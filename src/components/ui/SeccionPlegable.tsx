import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "./Tocable";
import { useAppTheme } from "../../theme/ThemeProvider";

type Props = {
  titulo: string;
  icono: ComponentProps<typeof Ionicons>["name"];
  // Texto corto bajo el título que se ve aun con la sección cerrada ("Nivel Equipo · 12 funciones")
  resumen?: string;
  // Abierta al entrar; después la persona la abre y la cierra
  abiertaAlInicio?: boolean;
  children: ReactNode;
};

// Sección con título e ícono que se pliega. El contenido conserva sus propias tarjetas.
export default function SeccionPlegable({ titulo, icono, resumen, abiertaAlInicio = false, children }: Props) {
  const { colors } = useAppTheme();
  const [abierta, setAbierta] = useState(abiertaAlInicio);
  return (
    <View style={styles.contenedor}>
      <Tocable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={resumen ? `${titulo}. ${resumen}` : titulo}
        accessibilityHint={abierta ? "Oculta esta sección" : "Muestra esta sección"}
        style={[styles.cabecera, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        onPress={() => setAbierta((a) => !a)}
      >
        <Ionicons name={icono} size={22} color={colors.primaryText} />
        <View style={styles.textos}>
          <Text style={[styles.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
          {resumen ? <Text style={[styles.resumen, { color: colors.textSecondary }]}>{resumen}</Text> : null}
        </View>
        <Ionicons name={abierta ? "chevron-up" : "chevron-down"} size={20} color={colors.primaryText} />
      </Tocable>
      {abierta ? <View style={styles.cuerpo}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 12 },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  textos: { flex: 1 },
  titulo: { fontSize: 15, fontWeight: "bold" },
  resumen: { fontSize: 12, marginTop: 2 },
  cuerpo: { paddingTop: 10 },
});
