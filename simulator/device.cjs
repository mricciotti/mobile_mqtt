const mqtt = require("mqtt");
const url = process.env.MQTT_URL || "wss://broker.hivemq.com:8884/mqtt";
const base = process.env.MQTT_BASE || "fiap/3espv/mobile-mqtt-rm556930";
const client = mqtt.connect(url, {
  clientId: `sim_${Math.random().toString(16).slice(2)}`,
  reconnectPeriod: 5000,
});
let lamp = "OFF";
client.on("connect", () => {
  console.log(`Conectado a ${url}; tópicos: ${base}`);
  client.subscribe(`${base}/lampada/comando`, (error) => {
    if (error) return console.error("Falha na inscrição:", error.message);
    client.publish(`${base}/lampada/estado`, JSON.stringify({ state: lamp }));
  });
  publishSensors();
});
function publishSensors() {
  if (!client.connected) return;
  client.publish(`${base}/lampada/estado`, JSON.stringify({ state: lamp }));
  const temperature = Number((22 + Math.random() * 7).toFixed(1));
  const humidity = Math.round(45 + Math.random() * 20);
  client.publish(
    `${base}/sensor/temperatura`,
    JSON.stringify({ value: temperature }),
  );
  client.publish(`${base}/sensor/umidade`, JSON.stringify({ value: humidity }));
  console.log(`Temperatura: ${temperature} °C | Umidade: ${humidity}%`);
}
const timer = setInterval(publishSensors, 5000);
client.on("message", (topic, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    if (
      topic !== `${base}/lampada/comando` ||
      !["ON", "OFF"].includes(data.action)
    )
      return;
    lamp = data.action;
    client.publish(`${base}/lampada/estado`, JSON.stringify({ state: lamp }));
    console.log(`Comando recebido: ${lamp}; estado confirmado`);
  } catch {
    console.warn("Comando inválido ignorado");
  }
});
client.on("error", (error) => console.error("Erro MQTT:", error.message));
process.on("SIGINT", () => {
  clearInterval(timer);
  client.end(true, () => process.exit(0));
});
