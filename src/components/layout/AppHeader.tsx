import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import BotonCabecera from "./BotonCabecera";

export type OpcionesCabecera = {
  onVolver?: () => void;
  onSalir?: () => void;
};

export default function AppHeader({
  onVolver,
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
          accessibilityHint="Regresa a la pantalla anterior"
          style={styles.volver}
          onPress={onVolver}
        >
          <Ionicons name="arrow-back-outline" size={24} color={colors.primaryText} />
        </Tocable>
      ) : null}

      <Text style={[styles.titulo, { color: colors.primaryText }]}>
        {empresa ? `✨ ${empresa.nombre}` : "✂️ AGENDAMIENTOS"}
      </Text>

      <View style={styles.acciones}>
        <BotonCabecera
          icono={esOscuro ? "sunny-outline" : "moon-outline"}
          etiqueta={esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          onPress={alternarTema}
        />

        {onSalir ? (
          <Tocable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            accessibilityHint="Sale de tu cuenta en este celular"
            style={styles.salir}
            onPress={onSalir}
          >
            <Ionicons name="log-out-outline" size={14} color={COLORES.peligroSuave} />
            <Text style={styles.salirTexto}>Cerrar sesión</Text>
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
  volver: { minWidth: 44, minHeight: 44, justifyContent: "center" },
  titulo: { fontSize: 16, fontWeight: "bold", letterSpacing: 1 },
  acciones: { flexDirection: "row", alignItems: "center", gap: 10 },
  salir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: COLORES.peligroOscuro,
  },
  salirTexto: { fontSize: 13, fontWeight: "bold", color: COLORES.peligroSuave },
});
