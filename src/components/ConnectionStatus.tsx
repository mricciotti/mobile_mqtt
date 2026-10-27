import { ActivityIndicator, Text, View } from "react-native";
import type { Colors } from "../themes/colors";
import type { Status } from "../types/mqtt";
import { Card, styles } from "./ui";
const labels: Record<Status, string> = {
  connected: "Conectado",
  connecting: "Conectando",
  disconnected: "Desconectado",
  error: "Erro",
};
export function ConnectionStatus({
  status,
  detail,
  colors,
}: {
  status: Status;
  detail: string;
  colors: Colors;
}) {
  return (
    <Card colors={colors}>
      <View style={styles.row}>
        {status === "connecting" && (
          <ActivityIndicator
            color={colors.accent}
            accessibilityLabel="Conectando ao broker"
          />
        )}
        <Text style={[styles.label, { color: colors.text }]}>
          Conexão: {labels[status]}
        </Text>
      </View>
      {!!detail && (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.muted }}>
          {detail}
        </Text>
      )}
    </Card>
  );
}
