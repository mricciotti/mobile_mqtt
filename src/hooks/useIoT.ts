import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { MqttService, TOPICS } from "../services/mqttService";
import { storageService } from "../services/storageService";
import { themes } from "../themes/colors";
import type { Entry, LampState, Reading, Status, Theme } from "../types/mqtt";

const DEFAULT_URL = "wss://broker.hivemq.com:8884/mqtt";
export function useIoT() {
  const [service] = useState(() => new MqttService());
  const pendingLamp = useRef<LampState | null>(null);
  const commandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCommand() {
    pendingLamp.current = null;
    if (commandTimer.current) clearTimeout(commandTimer.current);
    commandTimer.current = null;
    setSending(false);
  }
  const [url, setUrl] = useState(DEFAULT_URL);
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>("disconnected");
  const [detail, setDetail] = useState("");
  const [temperature, setTemperature] = useState<Reading | null>(null);
  const [humidity, setHumidity] = useState<Reading | null>(null);
  const [lamp, setLamp] = useState<{ state: LampState; at: number } | null>(
    null,
  );
  const [history, setHistory] = useState<Entry[]>([]);
  const [sending, setSending] = useState(false);
  const dark = theme === "dark";
  const colors = themes[theme];

  useEffect(() => {
    let active = true;
    storageService
      .load()
      .then((values) => {
        if (!active) return;
        const storedUrl = values.url;
        const storedTheme = values.theme;
        if (storedUrl) setUrl(storedUrl);
        if (storedTheme === "dark" || storedTheme === "light")
          setTheme(storedTheme);
      })
      .catch(() => {
        if (active) setDetail("Não foi possível carregar as preferências.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      pendingLamp.current = null;
      if (commandTimer.current) clearTimeout(commandTimer.current);
      service.disconnect();
    };
  }, [service]);

  function addEntry(
    topic: string,
    payload: string,
    direction: Entry["direction"],
  ) {
    setHistory((old) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          topic,
          payload,
          direction,
          at: Date.now(),
        },
        ...old,
      ].slice(0, 10),
    );
  }
  function receive(topic: string, payload: string) {
    addEntry(topic, payload, "recebida");
    try {
      const data: unknown = JSON.parse(payload);
      if (!data || typeof data !== "object") return;
      const record = data as Record<string, unknown>;
      const now = Date.now();
      if (
        topic === TOPICS.temperature &&
        typeof record.value === "number" &&
        Number.isFinite(record.value)
      )
        setTemperature({ value: record.value, at: now });
      if (
        topic === TOPICS.humidity &&
        typeof record.value === "number" &&
        Number.isFinite(record.value) &&
        record.value >= 0 &&
        record.value <= 100
      )
        setHumidity({ value: record.value, at: now });
      if (
        topic === TOPICS.state &&
        (record.state === "ON" || record.state === "OFF")
      ) {
        setLamp({ state: record.state, at: now });
        if (pendingLamp.current === record.state) {
          clearCommand();
          setDetail("Estado da lâmpada confirmado.");
        }
      }
    } catch {
      return;
    }
  }
  async function connect() {
    const address = url.trim();
    if (!/^wss?:\/\/\S+$/i.test(address)) {
      setStatus("error");
      setDetail(
        "Informe uma URL WebSocket válida, começando com ws:// ou wss://.",
      );
      return;
    }
    try {
      await storageService.saveUrl(address);
    } catch {
      setDetail("Não foi possível salvar a URL.");
    }
    clearCommand();
    setTemperature(null);
    setHumidity(null);
    setLamp(null);
    service.connect(
      address,
      (next, message) => {
        if (next !== "connected") clearCommand();
        setStatus(next);
        setDetail(message ?? "");
      },
      receive,
    );
  }
  function disconnect() {
    clearCommand();
    service.disconnect();
    setStatus("disconnected");
    setDetail("");
  }
  async function toggleTheme() {
    const next = dark ? "light" : "dark";
    setTheme(next);
    try {
      await storageService.saveTheme(next);
    } catch {
      Alert.alert("Erro", "Não foi possível salvar o tema.");
    }
  }
  async function command(action: LampState) {
    if (status !== "connected") {
      Alert.alert(
        "Sem conexão",
        "Conecte ao broker antes de enviar um comando.",
      );
      return;
    }
    if (pendingLamp.current) return;
    setSending(true);
    const payload = JSON.stringify({ action });
    pendingLamp.current = action;
    setDetail("Enviando comando. Aguardando confirmação da lâmpada.");
    commandTimer.current = setTimeout(() => {
      clearCommand();
      setDetail(
        "Sem confirmação após 5 segundos. Verifique o simulador e tente novamente.",
      );
    }, 5000);
    try {
      await service.publish(TOPICS.command, payload);
      addEntry(TOPICS.command, payload, "enviada");
    } catch (error) {
      if (pendingLamp.current !== action) return;
      clearCommand();
      setDetail("Falha ao enviar comando.");
      Alert.alert(
        "Falha ao enviar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  return {
    url,
    setUrl,
    dark,
    colors,
    ready,
    status,
    detail,
    temperature,
    humidity,
    lamp,
    history,
    sending,
    connect,
    disconnect,
    toggleTheme,
    command,
  };
}
export type IoTModel = ReturnType<typeof useIoT>;
