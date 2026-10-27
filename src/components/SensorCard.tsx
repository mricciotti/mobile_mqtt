import { Text } from "react-native";
import type { Colors } from "../themes/colors";
import type { Reading } from "../types/mqtt";
import { Card, formatTime, styles } from "./ui";
export function SensorCard({
  name,
  reading,
  unit,
  colors,
}: {
  name: string;
  reading: Reading | null;
  unit: string;
  colors: Colors;
}) {
  return (
    <Card colors={colors}>
      <Text style={[styles.label, { color: colors.muted }]}>{name}</Text>
      <Text style={[styles.value, { color: colors.text }]}>
        {reading ? `${reading.value} ${unit}` : `-- ${unit}`}
      </Text>
      <Text style={{ color: colors.muted }}>
        {reading
          ? `Atualizado às ${formatTime(reading.at)}`
          : "Aguardando leitura"}
      </Text>
    </Card>
  );
}
