# IoT Control

Checkpoint 3 — Mobile Development & IoT. Aplicativo em React Native, Expo e TypeScript para monitorar temperatura e umidade e controlar uma lâmpada simulada via MQTT.

## Integrantes

- RM554673 — Fernanda Rocha Menon
- RM556237 — Luiza Macena Dantas
- RM558537 — Luan Ramos Garcia de Souza
- RM556930 — Matheus Ricciotti
- RM555189 — Matheus Bortolotto

## Tecnologias

Expo SDK 54, React Native 0.81, React 19, TypeScript, MQTT.js e AsyncStorage. Consulte o `package.json` para as versões declaradas.

## Instalação e execução

Requisitos: Node.js, npm, Expo Go compatível com SDK 54 ou emulador Android/iOS.

```bash
npm install
npx expo start
```

Com o emulador aberto, pressione `a` para Android ou `i` para iOS. Para Web, pressione `w`. Em outro terminal, na mesma pasta, execute o simulador:

```bash
npm run simulator
```

No aplicativo, abra **Configurações** e toque em **Conectar**. O endereço padrão é `wss://broker.hivemq.com:8884/mqtt`, MQTT sobre WebSocket seguro. É possível alterá-lo e salvá-lo ao conectar. O broker público é compartilhado e pode ficar indisponível; não envie dados sensíveis. O simulador e o aplicativo precisam usar o mesmo broker e tópico-base. Para trocar o broker do simulador no PowerShell:

```powershell
$env:MQTT_URL = 'wss://broker.hivemq.com:8884/mqtt'
npm run simulator
```

## Tópicos e mensagens

Base exclusiva do grupo: `fiap/3espv/mobile-mqtt-rm556930`.

| Sufixo | Direção no app | Exemplo |
| --- | --- | --- |
| `/sensor/temperatura` | Recebe | `{"value":24.5}` |
| `/sensor/umidade` | Recebe | `{"value":58}` |
| `/lampada/comando` | Envia | `{"action":"ON"}` ou `{"action":"OFF"}` |
| `/lampada/estado` | Recebe | `{"state":"ON"}` ou `{"state":"OFF"}` |

## Demonstração

1. Inicie o simulador e conecte o aplicativo ao mesmo broker.
2. Verifique que temperatura e umidade aparecem e mudam a cada cinco segundos.
3. Toque em **Ligar**: o simulador registra o comando, publica a confirmação e o aplicativo mostra **Ligada**.
4. Repita com **Desligar**; confira o histórico das últimas dez mensagens.
5. Em Configurações, alterne o tema e reinicie o app para verificar a persistência. A URL também é salva ao conectar.

O estado só muda após uma mensagem válida de confirmação. Mensagens inválidas aparecem no histórico, mas não alteram as leituras. Ao desconectar, comandos são recusados com aviso. O histórico é mantido somente durante a sessão. O simulador confirma o estado inicial ao conectar; como não usa mensagens retidas, se o app conectar depois, o estado aparece ao receber o próximo comando confirmado.

## Telas

- **Dashboard:** conexão, leituras com horário, estado confirmado e comandos.
- **Histórico:** dez mensagens mais recentes com tópico, payload, direção e horário.
- **Configurações:** broker, conexão e tema claro/escuro.

Os prints do app em execução ainda precisam ser adicionados para a entrega. Teste o fluxo também no Android e iOS: gerar o pacote não substitui a verificação em dispositivo. A entrega é o link acessível do repositório no Teams.
