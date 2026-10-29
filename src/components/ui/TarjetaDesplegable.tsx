import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import Tocable from "./Tocable";

type Props = {
  titulo: string;
  // Cifra clave: se ve aunque la tarjeta esté cerrada
  valor: string;
  // Color de la cifra (por defecto, el texto normal)
  colorValor?: string;
  children: ReactNode;
};

// Tarjeta cerrada por defecto: título y cifra clave a la vista; al tocarla muestra el detalle
export default function TarjetaDesplegable({ titulo, valor, colorValor, children }: Props) {
  const { colors } = useAppTheme();
  const [abierta, setAbierta] = useState(false);

  return (
    <View style={[s.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <Tocable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={`${titulo}: ${valor}`}
        accessibilityHint={abierta ? "Oculta el detalle" : "Muestra el detalle"}
        onPress={() => setAbierta((a) => !a)}
        style={s.cabecera}
      >
        <Text style={[s.titulo, { color: colors.primaryText }]}>{titulo}</Text>
        <Text numberOfLines={2} style={[s.valor, { color: colorValor ?? colors.textPrimary }]}>
          {valor}
        </Text>
        <Ionicons
          name={abierta ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Tocable>
      {abierta ? <View style={[s.cuerpo, { borderTopColor: colors.cardBorder }]}>{children}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, marginTop: 10 },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  titulo: { flex: 1, fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 },
  valor: { flexShrink: 1, maxWidth: "50%", fontSize: 14, fontWeight: "bold", textAlign: "right" },
  cuerpo: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8 },
});
