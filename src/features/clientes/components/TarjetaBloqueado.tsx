import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TelefonoConBandera from "@/components/ui/TelefonoConBandera";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Bloqueado } from "../api";

type Props = {
  bloqueado: Bloqueado;
  onDesbloquear: (b: Bloqueado) => void;
};

// Registro de la lista negra: nombre, teléfono y el botón para desbloquear
export default function TarjetaBloqueado({ bloqueado: b, onDesbloquear }: Props) {
  const { colors } = useAppTheme();
  return (
    <TarjetaFila>
      <View style={styles.datos}>
        <Text style={[styles.nombre, { color: colors.textPrimary }]} numberOfLines={1}>
          {b.nombre}
        </Text>
        <TelefonoConBandera
          telefono={b.telefono}
          style={[styles.telefono, { color: colors.textSecondary }]}
        />
      </View>
      <Tocable
        accessibilityRole="button"
        accessibilityLabel={`Desbloquear a ${b.nombre}`}
        accessibilityHint="Le permite volver a reservar"
        onPress={() => onDesbloquear(b)}
        style={styles.zona}
      >
        {/* La zona táctil mide 44 px de alto; el botón que se ve es más compacto */}
        <View style={[styles.boton, { borderColor: colors.exitoTexto }]}>
          <Ionicons name="lock-open-outline" size={12} color={colors.exitoTexto} />
          <Text style={[styles.botonTexto, { color: colors.exitoTexto }]}>Desbloquear</Text>
        </View>
      </Tocable>
    </TarjetaFila>
  );
}

const styles = StyleSheet.create({
  datos: { flex: 1, gap: 4, marginRight: 8 },
  nombre: { fontSize: 15, fontWeight: "bold" },
  telefono: { fontSize: 13 },
  zona: { minHeight: 44, minWidth: 44, justifyContent: "center" },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  botonTexto: { fontSize: 11, fontWeight: "bold" },
});
