import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useIoT } from "./src/hooks/useIoT";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { styles as shared } from "./src/components/ui";

const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "history", label: "Histórico" },
  { key: "settings", label: "Configurações" },
] as const;
type Screen = (typeof tabs)[number]["key"];

function IoTApp() {
  const model = useIoT();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const { colors } = model;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={model.dark ? "light" : "dark"} />
      {!model.ready ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={{ color: colors.text }}>Carregando preferências...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={shared.content}
            keyboardShouldPersistTaps="handled"
          >
            {screen === "dashboard" && <DashboardScreen model={model} />}
            {screen === "history" && <HistoryScreen model={model} />}
            {screen === "settings" && <SettingsScreen model={model} />}
          </ScrollView>
          <View
            style={[
              styles.navigation,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={{ selected: screen === tab.key }}
                onPress={() => setScreen(tab.key)}
                style={styles.tab}
              >
                <Text
                  style={{
                    color: screen === tab.key ? colors.accent : colors.muted,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <IoTApp />
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  navigation: { flexDirection: "row", borderTopWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 18 },
});
