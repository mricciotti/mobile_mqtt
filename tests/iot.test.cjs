const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { create, act } = require("react-test-renderer");
const { EventEmitter } = require("node:events");
global.IS_REACT_ACT_ENVIRONMENT = true;
function load(file, overrides = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      require: (name) => (name in overrides ? overrides[name] : require(name)),
      setTimeout,
      clearTimeout,
      console,
      ...globals,
    },
    { filename: file },
  );
  return module.exports;
}

class Client extends EventEmitter {
  connected = true;
  subscriptions = [];
  subscribe(topics, options, callback) {
    this.subscriptions.push(topics);
    callback(
      null,
      topics.map((topic) => ({ topic, qos: 0 })),
    );
  }
  unsubscribe(topics) {
    this.unsubscribed = topics;
  }
  end(force, callback) {
    this.ended = force;
    callback?.();
  }
  publish(topic, payload, options, callback) {
    this.sent = { topic, payload, options };
    callback?.(null);
  }
}

test("MQTT: reconecta, reinscreve, ignora client antigo e limpa listeners", async () => {
  const { MqttService, TOPICS } = load("src/services/mqttService.ts");
  const clients = [],
    options = [],
    statuses = [],
    messages = [];
  const service = new MqttService((url, opts) => {
    options.push(opts);
    const client = new Client();
    clients.push(client);
    return client;
  });
  service.connect(
    "ws://localhost/mqtt",
    (s) => statuses.push(s),
    (...m) => messages.push(m),
  );
  const first = clients[0];
  first.emit("connect");
  first.emit("reconnect");
  first.emit("connect");
  assert.equal(first.subscriptions.length, 2);
  first.emit("error", new Error("offline"));
  assert.equal(statuses.at(-1), "error");
  service.connect(
    "ws://localhost/mqtt",
    (s) => statuses.push(s),
    (...m) => messages.push(m),
  );
  assert.equal(first.ended, true);
  assert.equal(first.listenerCount("message"), 0);
  assert.equal(first.unsubscribed.length, 3);
  assert.notEqual(options[0].clientId, options[1].clientId);
  first.emit("message", TOPICS.state, Buffer.from('{"state":"ON"}'));
  assert.equal(messages.length, 0);
  const current = clients[1];
  current.emit("connect");
  await service.publish(TOPICS.command, '{"action":"ON"}');
  assert.equal(current.sent.options.retain, false);
  service.disconnect();
  assert.equal(current.eventNames().length, 0);
  await assert.rejects(service.publish(TOPICS.command, "x"), /Conecte/);
});

test("Hook: preferências após remontagem, timeout, confirmação e mensagens inválidas", async () => {
  const saved = new Map();
  const storage = {
    multiGet: async (keys) => keys.map((key) => [key, saved.get(key) ?? null]),
    setItem: async (key, value) => saved.set(key, value),
  };
  const { storageService } = load("src/services/storageService.ts", {
    "@react-native-async-storage/async-storage": storage,
  });
  const timers = new Map();
  let sequence = 0;
  const topics = { temperature: "t", humidity: "h", state: "s", command: "c" };
  let client;
  class MockService {
    constructor() {
      client = this;
    }
    connect(url, status, receive) {
      this.receive = receive;
      status("connected");
    }
    disconnect() {}
    async publish() {}
  }
  const { useIoT } = load(
    "src/hooks/useIoT.ts",
    {
      react: React,
      "react-native": { Alert: { alert() {} } },
      "../services/mqttService": { MqttService: MockService, TOPICS: topics },
      "../services/storageService": { storageService },
      "../themes/colors": { themes: { light: {}, dark: {} } },
    },
    {
      setTimeout: (callback) => {
        timers.set(++sequence, callback);
        return sequence;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  );
  let model, root;
  function Probe() {
    model = useIoT();
    return null;
  }
  await act(async () => {
    root = create(React.createElement(Probe));
  });
  await act(async () => model.setUrl("wss://broker.example/mqtt"));
  await act(async () => model.connect());
  await act(async () => model.toggleTheme());
  await act(async () => model.command("ON"));
  assert.equal(model.lamp, null);
  assert.equal(model.sending, true);
  await act(async () => {
    [...timers.values()][0]();
  });
  assert.match(model.detail, /5 segundos/);
  assert.equal(model.sending, false);
  await act(async () => model.command("OFF"));
  await act(async () => client.receive("s", '{"state":"ON"}'));
  assert.equal(model.sending, true);
  await act(async () => client.receive("s", '{"state":"OFF"}'));
  assert.equal(model.sending, false);
  assert.match(model.detail, /confirmado/);
  await act(async () => client.receive("t", '{"value":24.5}'));
  await act(async () => {
    client.receive("t", "invalid");
    client.receive("h", '{"value":101}');
  });
  assert.equal(model.temperature.value, 24.5);
  assert.equal(model.humidity, null);
  await act(async () => {
    for (let i = 0; i < 20; i++)
      client.receive("h", JSON.stringify({ value: i }));
  });
  assert.equal(model.history.length, 10);
  await act(async () => root.unmount());
  await act(async () => {
    root = create(React.createElement(Probe));
  });
  assert.equal(model.url, "wss://broker.example/mqtt");
  assert.equal(model.dark, true);
  assert.equal(model.history.length, 0);
  await act(async () => root.unmount());
});

test("Simulador: estado inicial, republicação periódica e comandos inválidos", () => {
  const client = new Client();
  const messages = [];
  let tick;
  client.publish = (topic, payload) =>
    messages.push([topic, JSON.parse(payload)]);
  client.subscribe = (topic, callback) => callback(null);
  vm.runInNewContext(fs.readFileSync("simulator/device.cjs", "utf8"), {
    require: () => ({ connect: () => client }),
    process: { env: {}, on() {} },
    console: { log() {}, warn() {}, error() {} },
    setInterval: (fn) => {
      tick = fn;
    },
    clearInterval() {},
  });
  client.emit("connect");
  assert.ok(
    messages.some(
      ([topic, data]) => topic.endsWith("/estado") && data.state === "OFF",
    ),
  );
  const base = "fiap/3espv/mobile-mqtt-rm556930";
  client.emit("message", `${base}/lampada/comando`, Buffer.from("invalid"));
  client.emit("message", `${base}/lampada/comando`, Buffer.from("null"));
  client.emit(
    "message",
    `${base}/lampada/comando`,
    Buffer.from('{"action":"ON"}'),
  );
  tick();
  assert.ok(
    messages.some(
      ([topic, data]) => topic.endsWith("/estado") && data.state === "ON",
    ),
  );
  assert.ok(messages.some(([topic]) => topic.endsWith("/temperatura")));
  assert.ok(messages.some(([topic]) => topic.endsWith("/umidade")));
});
