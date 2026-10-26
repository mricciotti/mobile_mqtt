import { StyleSheet, Text, View } from "react-native";

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.description}>A configuração do broker e do tema será adicionada nesta tela.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#172033" },
  description: { fontSize: 16, color: "#667085" },
});
