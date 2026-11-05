import { Ionicons } from "@expo/vector-icons";
import { useEffect, useSyncExternalStore } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisoFlotanteActual, suscribirAvisoFlotante } from "@/utils/avisoFlotante";

// Muestra el aviso de utils/avisoFlotante abajo y centrado, sin tapar los toques
export default function AvisoFlotanteHost() {
  const { colors } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const aviso = useSyncExternalStore(suscribirAvisoFlotante, avisoFlotanteActual, avisoFlotanteActual);

  // El lector de pantalla lo anuncia aunque no tenga el foco
  useEffect(() => {
    if (aviso) AccessibilityInfo.announceForAccessibility(aviso.texto);
  }, [aviso]);

  if (!aviso) return null;

  return (
    <View pointerEvents="none" style={[styles.capa, { bottom: bottom + 32 }]}>
      <View
        accessibilityLiveRegion="polite"
        style={[styles.aviso, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      >
        <Ionicons name="checkmark-circle" size={18} color={colors.exitoTexto} />
        <Text style={[styles.texto, { color: colors.textPrimary }]}>{aviso.texto}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  texto: { fontSize: 14, fontWeight: "600" },
});
