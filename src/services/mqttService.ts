import mqtt, { MqttClient } from "mqtt";
import type { Status } from "../types/mqtt";

export const BASE = "fiap/3espv/mobile-mqtt-rm556930";
export const TOPICS = {
  temperature: `${BASE}/sensor/temperatura`,
  humidity: `${BASE}/sensor/umidade`,
  command: `${BASE}/lampada/comando`,
  state: `${BASE}/lampada/estado`,
};

export class MqttService {
  private client: MqttClient | null = null;
  private pending = new Set<(error: Error) => void>();

  constructor(private createClient: typeof mqtt.connect = mqtt.connect) {}

  connect(
    url: string,
    status: (status: Status, detail?: string) => void,
    receive: (topic: string, payload: string) => void,
  ): void {
    this.disconnect();
    status("connecting");
    let instance: MqttClient;
    try {
      instance = this.createClient(url, {
        clientId: `mobile_${Math.random().toString(16).slice(2)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        resubscribe: false,
        forceNativeWebSocket: true,
      });
    } catch (error) {
      status("error", error instanceof Error ? error.message : "URL inválida");
      return;
    }
    this.client = instance;
    instance.on("connect", () => {
      if (this.client !== instance) return;
      instance.subscribe(
        [TOPICS.temperature, TOPICS.humidity, TOPICS.state],
        { qos: 0 },
        (error, grants) => {
          if (this.client !== instance) return;
          if (
            error ||
            !grants?.length ||
            grants.some((grant) => grant.qos === 128)
          ) {
            status("error", "Falha ao assinar tópicos");
            return;
          }
          status("connected");
        },
      );
    });
    instance.on("message", (topic, payload) => {
      if (this.client === instance) receive(topic, payload.toString());
    });
    instance.on("reconnect", () => {
      if (this.client === instance) status("connecting", "Reconectando");
    });
    instance.on("offline", () => {
      if (this.client === instance)
        status("connecting", "Sem conexão. Tentando novamente");
    });
    instance.on("error", (error) => {
      if (this.client === instance) status("error", error.message);
    });
    instance.on("close", () => {
      if (this.client === instance && !instance.reconnecting)
        status("disconnected");
    });
  }

  publish(topic: string, payload: string): Promise<void> {
    const client = this.client;
    if (!client?.connected)
      return Promise.reject(
        new Error("Conecte ao broker antes de enviar um comando."),
      );
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.pending.delete(finish);
        if (error) reject(error);
        else resolve();
      };
      const timer = setTimeout(
        () => finish(new Error("Tempo limite ao publicar o comando.")),
        5000,
      );
      this.pending.add(finish);
      try {
        client.publish(topic, payload, { qos: 1, retain: false }, finish);
      } catch (error) {
        finish(
          error instanceof Error ? error : new Error("Falha ao publicar."),
        );
      }
    });
  }

  disconnect(): void {
    const instance = this.client;
    this.client = null;
    for (const reject of this.pending) reject(new Error("Conexão encerrada."));
    if (!instance) return;
    instance.removeAllListeners();
    instance.on("error", () => {});
    if (instance.connected) {
      instance.unsubscribe(
        [TOPICS.temperature, TOPICS.humidity, TOPICS.state],
        () => {},
      );
    }
    instance.end(true, () => instance.removeAllListeners());
  }
}
