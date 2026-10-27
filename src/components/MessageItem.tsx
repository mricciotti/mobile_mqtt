import { Text } from "react-native";
import type { Entry } from "../types/mqtt";
import type { Colors } from "../themes/colors";
import { Card, formatTime, styles } from "./ui";
export function MessageItem({
  entry,
  colors,
}: {
  entry: Entry;
  colors: Colors;
}) {
  return (
    <Card colors={colors}>
      <Text style={[styles.label, { color: colors.text }]}>
        {entry.direction === "enviada" ? "Enviada" : "Recebida"} ·{" "}
        {formatTime(entry.at)}
      </Text>
      <Text selectable style={{ color: colors.muted }}>
        {entry.topic}
      </Text>
      <Text selectable style={{ color: colors.text }}>
        {entry.payload}
      </Text>
    </Card>
  );
}
