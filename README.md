# IoT Control

Checkpoint 3 — Mobile Development & IoT. Aplicativo em React Native, Expo e TypeScript para monitorar sensores e controlar uma lâmpada por MQTT.

> Projeto em construção: a estrutura inicial ainda não implementa a comunicação MQTT, o simulador ou os requisitos completos do checkpoint.

## Integrantes

**Pendente:** adicionar nome completo e RM de todos os integrantes antes da entrega. A ausência dessas informações implica nota zero.

## Execução

Requisitos: Node.js e npm instalados; Expo Go ou emulador Android/iOS para executar no dispositivo.

```bash
npm install
npx expo start
```

Para a versão web, execute `npm run web`. A compatibilidade com Android e iOS deverá ser testada durante a implementação.

## Estrutura

- `src/screens`: telas do aplicativo.
- `src/components`: componentes reutilizáveis.
- `src/services`: comunicação MQTT e armazenamento local.
- `src/types`: tipos compartilhados.
- `src/themes`: cores e temas.
- `simulator`: futuro simulador do dispositivo IoT.

## Próximos passos

Implementar conexão MQTT via WebSocket, sensores, comandos e confirmação da lâmpada, histórico, preferências com AsyncStorage, temas e simulador. Documentar o broker, tópicos, payloads, versões, prints e instruções de demonstração antes da entrega.
