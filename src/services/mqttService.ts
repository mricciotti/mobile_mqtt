import mqtt, { MqttClient } from 'mqtt';
import type { Status } from '../types/mqtt';

export const BASE = 'fiap/3espv/mobile-mqtt-rm556930';
export const TOPICS = {
  temperature: `${BASE}/sensor/temperatura`,
  humidity: `${BASE}/sensor/umidade`,
  command: `${BASE}/lampada/comando`,
  state: `${BASE}/lampada/estado`,
};

export class MqttService {
  private client: MqttClient | null = null;

  connect(url: string, status: (status: Status, detail?: string) => void, receive: (topic: string, payload: string) => void): void {
    this.disconnect();
    status('connecting');
    let instance: MqttClient;
    try {
      instance = mqtt.connect(url, { clientId: `mobile_${Math.random().toString(16).slice(2)}`, clean: true, reconnectPeriod: 5000, connectTimeout: 30000, resubscribe: false, forceNativeWebSocket: true });
    } catch (error) {
      status('error', error instanceof Error ? error.message : 'URL inválida');
      return;
    }
    this.client = instance;
    instance.on('connect', () => {
      if (this.client !== instance) return;
      instance.subscribe([TOPICS.temperature, TOPICS.humidity, TOPICS.state], { qos: 0 }, (error, grants) => {
        if (this.client !== instance) return;
        if (error || !grants?.length || grants.some((grant) => grant.qos === 128)) {
          status('error', 'Falha ao assinar tópicos');
          return;
        }
        status('connected');
      });
    });
    instance.on('message', (topic, payload) => { if (this.client === instance) receive(topic, payload.toString()); });
    instance.on('reconnect', () => { if (this.client === instance) status('connecting', 'Reconectando'); });
    instance.on('offline', () => { if (this.client === instance) status('connecting', 'Sem conexão. Tentando novamente'); });
    instance.on('error', (error) => { if (this.client === instance) status('error', error.message); });
    instance.on('close', () => { if (this.client === instance && !instance.reconnecting) status('disconnected'); });
  }

  publish(topic: string, payload: string): Promise<void> {
    const client = this.client;
    if (!client?.connected) return Promise.reject(new Error('Conecte ao broker antes de enviar um comando.'));
    return new Promise((resolve, reject) => client.publish(topic, payload, { qos: 1, retain: false }, (error) => error ? reject(error) : resolve()));
  }

  disconnect(): void {
    const instance = this.client;
    this.client = null;
    if (instance) { instance.removeAllListeners(); instance.on('error', () => {}); instance.end(true); }
  }
}
