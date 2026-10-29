import { StyleSheet, Text, View } from "react-native";
import { COLORES } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";

// Se muestra mientras el pago pasa por la pasarela simulada o con llaves de prueba
export default function AvisoModoPrueba() {
  const { colors } = useAppTheme();
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Modo de prueba: no se cobra dinero real"
      style={[styles.caja, { borderColor: COLORES.naranja, backgroundColor: colors.cardBg }]}
    >
      <Text style={[styles.texto, { color: colors.avisoTexto }]}>Modo de prueba: no se cobra dinero real</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 16 },
  texto: { fontSize: 14, fontWeight: "bold", textAlign: "center" },
});
