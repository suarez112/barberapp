import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import BotonNotificaciones from "@/features/notificaciones/BotonNotificaciones";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import BotonCabecera from "./BotonCabecera";

export type OpcionesCabecera = {
  onVolver?: () => void;
  mostrarNotificaciones?: boolean;
  onSalir?: () => void;
};

export default function AppHeader({
  onVolver,
  mostrarNotificaciones = false,
  onSalir,
}: OpcionesCabecera) {
  const { colors, esOscuro, alternarTema } = useAppTheme();
  const { empresa } = useNegocio();

  return (
    <View
      style={[
        styles.barra,
        { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder },
      ]}
    >
      {onVolver ? (
        <Tocable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.volver}
          onPress={onVolver}
        >
          <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
        </Tocable>
      ) : null}

      <Text style={[styles.titulo, { color: colors.primary }]}>
        {empresa ? `✨ ${empresa.nombre}` : "✂️ AGENDAMIENTOS"}
      </Text>

      <View style={styles.acciones}>
        {mostrarNotificaciones && empresa ? <BotonNotificaciones /> : null}

        <BotonCabecera
          icono={esOscuro ? "sunny-outline" : "moon-outline"}
          etiqueta={esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          onPress={alternarTema}
        />

        {onSalir ? (
          <Tocable
            accessibilityRole="button"
            style={styles.salir}
            onPress={onSalir}
          >
            <Ionicons name="log-out-outline" size={14} color={COLORES.peligroSuave} />
            <Text style={styles.salirTexto}>Salir</Text>
          </Tocable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  volver: { paddingRight: 10, paddingVertical: 4 },
  titulo: { fontSize: 16, fontWeight: "bold", letterSpacing: 1 },
  acciones: { flexDirection: "row", alignItems: "center", gap: 10 },
  salir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: COLORES.peligroOscuro,
  },
  salirTexto: { fontSize: 12, fontWeight: "bold", color: COLORES.peligroSuave },
});
