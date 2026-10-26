import { StyleSheet, Text, View } from "react-native";

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>IoT Control</Text>
      <Text style={styles.description}>Painel de monitoramento e controle IoT</Text>
      <Text style={styles.status}>MQTT ainda não configurado</Text>
      <Text style={styles.value}>Temperatura: -- °C</Text>
      <Text style={styles.value}>Umidade: -- %</Text>
      <Text style={styles.value}>Lâmpada: estado desconhecido</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 16 },
  title: { fontSize: 32, fontWeight: "700", color: "#172033" },
  description: { fontSize: 16, color: "#667085" },
  status: { color: "#b45309", fontWeight: "600" },
  value: { fontSize: 18, color: "#172033" },
});
