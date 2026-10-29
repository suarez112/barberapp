import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { PropsMapa } from "./mapaTipos";

// Web: el mapa (WebView) solo funciona en Android e iOS.
// Aquí se muestran las coordenadas; se ajustan con el GPS.
export default function MapaUbicacion({ punto }: PropsMapa) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.caja, { borderColor: colors.cardBorder }]}>
      <Text style={{ color: colors.textSecondary }}>
        {punto
          ? `Pin en ${punto.latitude.toFixed(6)}, ${punto.longitude.toFixed(6)}`
          : "Sin ubicación"}
        . El mapa para arrastrar el pin está en la app del celular.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderWidth: 1, borderRadius: 10, padding: 14 },
});
