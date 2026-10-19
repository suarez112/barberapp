import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { fechaLarga } from "@/utils/fechas";
import { Suscripcion } from "../../cuenta/api";

// Días que le quedan a la prueba o al plan. El backend decide cuándo mostrarlo:
// siempre en la prueba y en los últimos 7 días de un plan.
export default function AvisoSuscripcion({ suscripcion }: { suscripcion: Suscripcion }) {
  const { colors } = useAppTheme();
  const { estado, plan, diasRestantes: dias, fechaFin, mostrarRecordatorio } = suscripcion;
  if (!mostrarRecordatorio || estado === "vencida" || dias === null) return null;

  const urgente = dias <= 3;
  const quedan = dias === 1 ? "Te queda 1 día" : `Te quedan ${dias} días`;
  const titulo =
    estado === "prueba"
      ? `${quedan} de prueba gratuita`
      : `${quedan} de tu plan${plan ? ` ${plan}` : ""}`;
  const termina = estado === "prueba" ? "La prueba termina" : "El plan termina";

  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.aviso,
        {
          backgroundColor: colors.cardBg,
          borderColor: urgente ? COLORES.advertencia : colors.primary,
        },
      ]}
    >
      <Ionicons
        name="hourglass-outline"
        size={26}
        color={urgente ? COLORES.advertencia : colors.primary}
      />
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
        {fechaFin ? (
          <Text style={[styles.detalle, { color: colors.textSecondary }]}>
            {termina} el {fechaLarga(fechaFin)}.{" "}
            {estado === "prueba"
              ? "Activa un plan para no perder el acceso."
              : "Renuévalo para no perder el acceso."}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 15,
  },
  textos: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: "bold" },
  detalle: { fontSize: 12, marginTop: 3 },
});
