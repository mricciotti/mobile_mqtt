import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type Screen = "dashboard" | "history" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const items: { key: Screen; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "history", label: "Histórico" },
    { key: "settings", label: "Configurações" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {screen === "dashboard" && <DashboardScreen />}
        {screen === "history" && <HistoryScreen />}
        {screen === "settings" && <SettingsScreen />}
      </View>
      <View style={styles.navigation}>
        {items.map((item) => (
          <Pressable key={item.key} onPress={() => setScreen(item.key)} accessibilityRole="button" accessibilityState={{ selected: screen === item.key }} style={styles.tab}>
            <Text style={[styles.tabText, screen === item.key && styles.selected]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  navigation: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#dce2eb" },
  tab: { flex: 1, alignItems: "center", paddingVertical: 18 },
  tabText: { color: "#667085", fontSize: 13 },
  selected: { color: "#2563eb", fontWeight: "700" },
});
