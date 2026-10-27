export type Status = "disconnected" | "connecting" | "connected" | "error";
export type LampState = "ON" | "OFF";
export type Reading = { value: number; at: number };
export type Entry = {
  id: string;
  topic: string;
  payload: string;
  at: number;
  direction: "enviada" | "recebida";
};
export type Theme = "light" | "dark";
