import { Modal, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = { segundos: number; onSeguir: () => void; onSalir: () => void };

// "0:45"
const reloj = (segundos: number) => `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

// Aviso de que la sesión se cerrará por no haber actividad
export default function AvisoInactividad({ segundos, onSeguir, onSalir }: Props) {
  const { colors } = useAppTheme();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onSeguir}>
      <View style={styles.fondo}>
        <View
          accessibilityViewIsModal
          style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
            ¿Sigues ahí?
          </Text>
          <Text style={[styles.texto, { color: colors.textSecondary }]}>
            Cerraremos tu sesión por inactividad en
          </Text>
          <Text
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${segundos} segundos`}
            style={[styles.reloj, { color: colors.primaryText }]}
          >
            {reloj(segundos)}
          </Text>
          <Boton
            titulo="SEGUIR CONECTADO"
            ayuda="Mantiene tu sesión abierta"
            onPress={onSeguir}
          />
          <Boton
            titulo="CERRAR SESIÓN"
            ayuda="Cierra tu sesión ahora"
            variante="secundario"
            onPress={onSalir}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  tarjeta: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 24 },
  titulo: { fontSize: 20, fontWeight: "bold", textAlign: "center" },
  texto: { fontSize: 14, textAlign: "center", marginTop: 8 },
  reloj: { fontSize: 40, fontWeight: "bold", textAlign: "center", marginVertical: 12 },
});
