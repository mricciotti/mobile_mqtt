import { Switch, Text, TextInput, View } from "react-native";
import type { IoTModel } from "../hooks/useIoT";
import { BASE } from "../services/mqttService";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { ActionButton, styles } from "../components/ui";
export function SettingsScreen({ model: m }: { model: IoTModel }) {
  const active = m.status === "connected" || m.status === "connecting";
  return (
    <>
      <Text style={[styles.title, { color: m.colors.text }]}>
        Configurações
      </Text>
      <Text style={[styles.label, { color: m.colors.text }]}>
        URL WebSocket do broker
      </Text>
      <TextInput
        accessibilityLabel="URL WebSocket do broker"
        value={m.url}
        onChangeText={m.setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!active}
        style={[
          styles.input,
          {
            color: m.colors.text,
            backgroundColor: m.colors.card,
            borderColor: m.colors.border,
          },
        ]}
      />
      <ConnectionStatus status={m.status} detail={m.detail} colors={m.colors} />
      <ActionButton
        label={active ? "Desconectar" : "Conectar"}
        onPress={active ? m.disconnect : m.connect}
        colors={m.colors}
      />
      <View style={styles.row}>
        <Text style={[styles.label, { color: m.colors.text }]}>
          Tema escuro
        </Text>
        <Switch
          accessibilityLabel="Tema escuro"
          value={m.dark}
          onValueChange={m.toggleTheme}
        />
      </View>
      <Text style={{ color: m.colors.muted }}>Tópico-base: {BASE}</Text>
    </>
  );
}
