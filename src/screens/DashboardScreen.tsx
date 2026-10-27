import { Text, View } from "react-native";
import type { IoTModel } from "../hooks/useIoT";
import { SensorCard } from "../components/SensorCard";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { ActionButton, Card, formatTime, styles } from "../components/ui";
export function DashboardScreen({ model: m }: { model: IoTModel }) {
  return (
    <>
      <Text style={[styles.title, { color: m.colors.text }]}>IoT Control</Text>
      <Text style={{ color: m.colors.muted }}>Monitoramento em tempo real</Text>
      <ConnectionStatus status={m.status} detail={m.detail} colors={m.colors} />
      <SensorCard
        name="Temperatura"
        reading={m.temperature}
        unit="°C"
        colors={m.colors}
      />
      <SensorCard
        name="Umidade"
        reading={m.humidity}
        unit="%"
        colors={m.colors}
      />
      <Card colors={m.colors}>
        <Text style={[styles.label, { color: m.colors.text }]}>
          Lâmpada:{" "}
          {m.lamp
            ? m.lamp.state === "ON"
              ? "Ligada"
              : "Desligada"
            : "Aguardando estado"}
        </Text>
        <Text style={{ color: m.colors.muted }}>
          {m.lamp
            ? `Confirmado às ${formatTime(m.lamp.at)}`
            : "O simulador deve confirmar o estado"}
        </Text>
        <View style={styles.row}>
          <ActionButton
            label="Ligar"
            onPress={() => m.command("ON")}
            disabled={m.sending}
            colors={m.colors}
          />
          <ActionButton
            label="Desligar"
            onPress={() => m.command("OFF")}
            disabled={m.sending}
            colors={m.colors}
          />
        </View>
      </Card>
    </>
  );
}
