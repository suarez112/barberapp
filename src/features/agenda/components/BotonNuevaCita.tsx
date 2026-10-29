import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

// Botón flotante de la agenda: abre la hoja para agendar una cita desde el panel
export default function BotonNuevaCita({ onPress }: { onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel="Nueva cita"
      accessibilityHint="Abre la hoja para agendar una cita a un cliente"
      onPress={onPress}
      style={[styles.boton, { backgroundColor: colors.primary }]}
    >
      <Ionicons name="add" size={24} color={colors.onPrimary} />
      <Text style={[styles.texto, { color: colors.onPrimary }]}>Nueva cita</Text>
    </Tocable>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 52,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 26,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  texto: { fontSize: 15, fontWeight: "bold" },
});
