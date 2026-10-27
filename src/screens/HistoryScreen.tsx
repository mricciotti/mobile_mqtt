import { Text } from "react-native";
import type { IoTModel } from "../hooks/useIoT";
import { MessageItem } from "../components/MessageItem";
import { styles } from "../components/ui";
export function HistoryScreen({ model: m }: { model: IoTModel }) {
  return (
    <>
      <Text style={[styles.title, { color: m.colors.text }]}>Histórico</Text>
      <Text style={{ color: m.colors.muted }}>
        Últimas 10 mensagens desta sessão
      </Text>
      {m.history.length === 0 && (
        <Text style={{ color: m.colors.muted }}>Nenhuma mensagem ainda.</Text>
      )}
      {m.history.map((entry) => (
        <MessageItem key={entry.id} entry={entry} colors={m.colors} />
      ))}
    </>
  );
}
