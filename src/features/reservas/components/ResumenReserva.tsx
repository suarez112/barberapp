import { useAppTheme } from "@/theme/ThemeProvider";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  servicio: string;
  precio: number;
  profesional: string;
  fecha: string; // ya escrita, por ejemplo "jueves 19 de noviembre"
  hora: string;
};

// Resumen corto de lo que el cliente va a reservar, justo antes de confirmar
export default function ResumenReserva({
  servicio,
  precio,
  profesional,
  fecha,
  hora,
}: Props) {
  const { colors } = useAppTheme();
  const fechaTexto = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  return (
    <View
      accessible
      accessibilityLabel={`Resumen de tu reserva: ${servicio}, ${precio} pesos, ${fechaTexto} a las ${hora}, con ${profesional}`}
      style={[
        s.caja,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <View style={s.fila}>
        <Text
          style={[s.servicio, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {servicio}
        </Text>
        <Text style={[s.precio, { color: colors.primaryText }]}>
          ${precio.toLocaleString("es-CO")}
        </Text>
      </View>
      <Text style={[s.detalle, { color: colors.textSecondary }]}>
        {fechaTexto} · {hora} · con {profesional}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  fila: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  servicio: { fontSize: 15, fontWeight: "bold", flex: 1 },
  precio: { fontSize: 15, fontWeight: "bold" },
  detalle: { fontSize: 13 },
});
