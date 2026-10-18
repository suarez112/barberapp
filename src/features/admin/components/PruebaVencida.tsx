import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";

type Props = { mensaje: string; onSalir: () => void };

// Se muestra cuando el backend dice que la prueba (o la suscripción) terminó
export default function PruebaVencida({ mensaje, onSalir }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.contenedor}>
      <Ionicons name="time-outline" size={64} color={COLORES.advertencia} />
      <Text style={[styles.titulo, { color: colors.textPrimary }]}>
        Tu prueba gratuita terminó
      </Text>
      <Text style={[styles.mensaje, { color: colors.textSecondary }]}>
        {mensaje}
      </Text>
      <Text style={[styles.mensaje, { color: colors.textSecondary }]}>
        Tus datos siguen guardados. Comunícate con nosotros para activar tu
        suscripción.
      </Text>
      <Boton
        titulo="CERRAR SESIÓN"
        variante="neutro"
        onPress={onSalir}
        style={styles.boton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", marginTop: 60, paddingHorizontal: 10 },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  mensaje: { fontSize: 14, marginTop: 10, textAlign: "center" },
  boton: { marginTop: 24, alignSelf: "stretch" },
});
