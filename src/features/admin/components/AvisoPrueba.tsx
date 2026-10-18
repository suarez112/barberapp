import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { EstadoPrueba } from "../../cuenta/api";

// Días de prueba que le quedan a la empresa (no se muestra si no está en prueba)
export default function AvisoPrueba({ prueba }: { prueba: EstadoPrueba }) {
  const { colors } = useAppTheme();
  if (prueba.diasRestantes === null) return null;

  const dias = prueba.diasRestantes;
  const urgente = dias <= 3;
  const fin = prueba.trialEndsAt
    ? new Date(prueba.trialEndsAt).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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
        <Text style={[styles.titulo, { color: colors.textPrimary }]}>
          {dias === 1
            ? "Te queda 1 día de prueba gratuita"
            : `Te quedan ${dias} días de prueba gratuita`}
        </Text>
        {fin ? (
          <Text style={[styles.detalle, { color: colors.textSecondary }]}>
            La prueba termina el {fin}.
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
