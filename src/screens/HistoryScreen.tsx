import { StyleSheet, Text, View } from "react-native";

export function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico</Text>
      <Text style={styles.description}>As mensagens MQTT aparecerão aqui quando a comunicação for implementada.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#172033" },
  description: { fontSize: 16, color: "#667085" },
});
