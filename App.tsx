import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MqttService, TOPICS } from './src/services/mqttService';
import type { Entry, LampState, Reading, Status, Theme } from './src/types/mqtt';

type Screen = 'dashboard' | 'history' | 'settings';
const DEFAULT_URL = 'wss://broker.hivemq.com:8884/mqtt';
const STATUS: Record<Status, string> = { connected: 'Conectado', connecting: 'Conectando', disconnected: 'Desconectado', error: 'Erro' };
const fmt = (time: number) => new Date(time).toLocaleTimeString('pt-BR');

export default function App() {
  const service = useRef(new MqttService()).current;
  const pendingLamp = useRef<LampState | null>(null);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [url, setUrl] = useState(DEFAULT_URL);
  const [theme, setTheme] = useState<Theme>('light');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>('disconnected');
  const [detail, setDetail] = useState('');
  const [temperature, setTemperature] = useState<Reading | null>(null);
  const [humidity, setHumidity] = useState<Reading | null>(null);
  const [lamp, setLamp] = useState<{ state: LampState; at: number } | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);
  const [sending, setSending] = useState(false);
  const dark = theme === 'dark';
  const colors = dark ? { bg: '#101827', card: '#1f2937', text: '#f9fafb', muted: '#c0cad9', border: '#445063', accent: '#82aaff' } : { bg: '#f5f7fb', card: '#ffffff', text: '#172033', muted: '#596579', border: '#dce2eb', accent: '#255fd1' };

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet(['brokerUrl', 'theme']).then((values) => {
      if (!active) return;
      const storedUrl = values[0][1]; const storedTheme = values[1][1];
      if (storedUrl) setUrl(storedUrl);
      if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);
    }).catch(() => { if (active) setDetail('Não foi possível carregar as preferências.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; service.disconnect(); };
  }, [service]);

  function addEntry(topic: string, payload: string, direction: Entry['direction']) {
    setHistory((old) => [{ id: `${Date.now()}-${Math.random()}`, topic, payload, direction, at: Date.now() }, ...old].slice(0, 10));
  }
  function receive(topic: string, payload: string) {
    addEntry(topic, payload, 'recebida');
    try {
      const data: unknown = JSON.parse(payload);
      if (!data || typeof data !== 'object') return;
      const record = data as Record<string, unknown>;
      const now = Date.now();
      if (topic === TOPICS.temperature && typeof record.value === 'number' && Number.isFinite(record.value)) setTemperature({ value: record.value, at: now });
      if (topic === TOPICS.humidity && typeof record.value === 'number' && Number.isFinite(record.value) && record.value >= 0 && record.value <= 100) setHumidity({ value: record.value, at: now });
      if (topic === TOPICS.state && (record.state === 'ON' || record.state === 'OFF')) {
        setLamp({ state: record.state, at: now });
        if (pendingLamp.current === record.state) {
          pendingLamp.current = null;
          setDetail('Estado da lâmpada confirmado.');
        }
      }
    } catch { /* Dados inválidos permanecem no histórico, sem alterar o painel. */ }
  }
  async function connect() {
    const address = url.trim();
    if (!/^wss?:\/\/\S+$/i.test(address)) { setStatus('error'); setDetail('Informe uma URL WebSocket válida, começando com ws:// ou wss://.'); return; }
    try { await AsyncStorage.setItem('brokerUrl', address); } catch { setDetail('Não foi possível salvar a URL.'); }
    pendingLamp.current = null;
    setTemperature(null); setHumidity(null); setLamp(null);
    service.connect(address, (next, message) => { setStatus(next); setDetail(message ?? ''); }, receive);
  }
  function disconnect() { pendingLamp.current = null; service.disconnect(); setStatus('disconnected'); setDetail(''); }
  async function toggleTheme() {
    const next = dark ? 'light' : 'dark'; setTheme(next);
    try { await AsyncStorage.setItem('theme', next); } catch { Alert.alert('Erro', 'Não foi possível salvar o tema.'); }
  }
  async function command(action: LampState) {
    if (status !== 'connected') { Alert.alert('Sem conexão', 'Conecte ao broker antes de enviar um comando.'); return; }
    setSending(true);
    const payload = JSON.stringify({ action });
    pendingLamp.current = action;
    setDetail('Enviando comando. Aguardando confirmação da lâmpada.');
    try { await service.publish(TOPICS.command, payload); addEntry(TOPICS.command, payload, 'enviada'); }
    catch (error) { pendingLamp.current = null; setDetail(''); Alert.alert('Falha ao enviar', error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { setSending(false); }
  }
  const button = (label: string, onPress: () => void, disabled = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, { backgroundColor: colors.accent, opacity: disabled ? 0.5 : 1 }]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
  if (!ready) return <SafeAreaView style={[styles.center, { backgroundColor: colors.bg }]}><ActivityIndicator /><Text style={{ color: colors.text }}>Carregando preferências...</Text></SafeAreaView>;
  return <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {screen === 'dashboard' && <>
        <Text style={[styles.title, { color: colors.text }]}>IoT Control</Text>
        <Text style={{ color: colors.muted }}>Monitoramento em tempo real</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.label, { color: colors.text }]}>Conexão: {STATUS[status]}</Text>{!!detail && <Text style={{ color: colors.muted }}>{detail}</Text>}</View>
        {[{ name: 'Temperatura', data: temperature, unit: '°C' }, { name: 'Umidade', data: humidity, unit: '%' }].map((sensor) => <View key={sensor.name} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.label, { color: colors.muted }]}>{sensor.name}</Text><Text style={[styles.value, { color: colors.text }]}>{sensor.data ? `${sensor.data.value} ${sensor.unit}` : `-- ${sensor.unit}`}</Text><Text style={{ color: colors.muted }}>{sensor.data ? `Atualizado às ${fmt(sensor.data.at)}` : 'Aguardando leitura'}</Text></View>)}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.label, { color: colors.text }]}>Lâmpada: {lamp ? (lamp.state === 'ON' ? 'Ligada' : 'Desligada') : 'Aguardando estado'}</Text><Text style={{ color: colors.muted }}>{lamp ? `Confirmado às ${fmt(lamp.at)}` : 'O simulador deve confirmar o estado'}</Text><View style={styles.row}>{button('Ligar', () => command('ON'), sending)}{button('Desligar', () => command('OFF'), sending)}</View></View>
      </>}
      {screen === 'history' && <><Text style={[styles.title, { color: colors.text }]}>Histórico</Text><Text style={{ color: colors.muted }}>Últimas 10 mensagens desta sessão</Text>{history.length === 0 && <Text style={{ color: colors.muted }}>Nenhuma mensagem ainda.</Text>}{history.map((entry) => <View key={entry.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.label, { color: colors.text }]}>{entry.direction === 'enviada' ? 'Enviada' : 'Recebida'} · {fmt(entry.at)}</Text><Text selectable style={{ color: colors.muted }}>{entry.topic}</Text><Text selectable style={{ color: colors.text }}>{entry.payload}</Text></View>)}</>}
      {screen === 'settings' && <><Text style={[styles.title, { color: colors.text }]}>Configurações</Text><Text style={[styles.label, { color: colors.text }]}>URL WebSocket do broker</Text><TextInput accessibilityLabel="URL WebSocket do broker" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} editable={status !== 'connected' && status !== 'connecting'} style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} /><Text style={{ color: colors.muted }}>Status: {STATUS[status]}{detail ? ` — ${detail}` : ''}</Text>{status === 'connected' || status === 'connecting' ? button('Desconectar', disconnect) : button('Conectar', connect)}<View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Tema escuro</Text><Switch accessibilityLabel="Tema escuro" value={dark} onValueChange={toggleTheme} /></View><Text style={{ color: colors.muted }}>Tópico-base: {TOPICS.command.replace('/lampada/comando', '')}</Text></>}
    </ScrollView>
    <View style={[styles.navigation, { backgroundColor: colors.card, borderColor: colors.border }]}>{([{ key: 'dashboard', label: 'Dashboard' }, { key: 'history', label: 'Histórico' }, { key: 'settings', label: 'Configurações' }] as const).map((item) => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: screen === item.key }} onPress={() => setScreen(item.key)} style={styles.tab}><Text style={{ color: screen === item.key ? colors.accent : colors.muted, fontWeight: screen === item.key ? '700' : '400' }}>{item.label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }, content: { padding: 24, gap: 14, paddingBottom: 32 }, title: { fontSize: 30, fontWeight: '700' }, card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 }, label: { fontSize: 16, fontWeight: '600' }, value: { fontSize: 30, fontWeight: '700' }, row: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }, button: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 }, buttonText: { color: '#fff', fontWeight: '700' }, input: { padding: 12, borderRadius: 8, borderWidth: 1 }, navigation: { flexDirection: 'row', borderTopWidth: 1 }, tab: { flex: 1, alignItems: 'center', paddingVertical: 18 },
});
