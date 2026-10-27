import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Colors } from "../themes/colors";
export const styles = StyleSheet.create({
  content: { padding: 24, gap: 14, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: "700" },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  label: { fontSize: 16, fontWeight: "600" },
  value: { fontSize: 30, fontWeight: "700" },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  button: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8 },
  input: { padding: 12, borderRadius: 8, borderWidth: 1 },
});
export function Card({
  colors,
  children,
}: PropsWithChildren<{ colors: Colors }>) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}
export function ActionButton({
  label,
  onPress,
  colors,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  colors: Colors;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: colors.accent, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
export const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString("pt-BR");
