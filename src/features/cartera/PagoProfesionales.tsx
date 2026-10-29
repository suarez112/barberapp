import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { EstadisticasResumen } from "./api";

const dinero = (n: number) => `$${formatearPesos(n)}`;

// Tabla "Pago a profesionales": lo que le corresponde a cada uno en el período
export default function PagoProfesionales({ pago }: { pago: NonNullable<EstadisticasResumen["pagoProfesionales"]> }) {
  const { colors } = useAppTheme();

  if (pago.detalle.length === 0) {
    return (
      <Text style={[s.vacio, { color: colors.textSecondary }]}>No hay pagos por hacer en este período.</Text>
    );
  }

  const encabezado = (texto: string, estilo: object) => (
    <Text style={[s.encabezado, { color: colors.textSecondary }, estilo]}>{texto}</Text>
  );

  return (
    <View style={[s.tabla, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={[s.fila, { borderColor: colors.cardBorder }]}>
        {encabezado("Profesional", s.colNombre)}
        {encabezado("%", s.colPorcentaje)}
        {encabezado("Citas", s.colCitas)}
        {encabezado("Ventas", s.colDinero)}
        {encabezado("A pagar", s.colDinero)}
      </View>
      {pago.detalle.map((p) => (
        <View
          key={p.barberoId}
          accessible
          accessibilityLabel={`${p.nombre}${p.activo ? "" : ", retirado"}: ${p.citas} citas, ventas ${dinero(p.ventas)}, a pagar ${dinero(p.aPagar)}, porcentaje actual ${p.porcentajeGanancia} por ciento`}
          style={[s.fila, { borderColor: colors.cardBorder }]}
        >
          <Text style={[s.celda, s.colNombre, { color: colors.textPrimary }]}>
            {p.nombre}
            {p.activo ? "" : " (retirado)"}
          </Text>
          <Text style={[s.celda, s.colPorcentaje, { color: colors.textSecondary }]}>{p.porcentajeGanancia}%</Text>
          <Text style={[s.celda, s.colCitas, { color: colors.textPrimary }]}>{p.citas}</Text>
          <Text style={[s.celda, s.colDinero, { color: colors.textPrimary }]}>{dinero(p.ventas)}</Text>
          <Text style={[s.celda, s.colDinero, s.negrita, { color: colors.textPrimary }]}>{dinero(p.aPagar)}</Text>
        </View>
      ))}
      <View
        accessible
        accessibilityLabel={`Total a pagar al equipo: ${dinero(pago.total)}`}
        style={[s.fila, s.filaTotal]}
      >
        <Text style={[s.celda, s.negrita, { color: colors.textPrimary, flex: 1 }]}>Total a pagar</Text>
        <Text style={[s.celda, s.negrita, { color: colors.primaryText }]}>{dinero(pago.total)}</Text>
      </View>
      <Text style={[s.nota, { color: colors.textSecondary }]}>
        «A pagar» usa el porcentaje que tenía cada cita al completarse; la columna % es el porcentaje actual.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  vacio: { fontSize: 13, marginVertical: 6 },
  tabla: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingTop: 4, paddingBottom: 10 },
  fila: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40, borderBottomWidth: 1 },
  filaTotal: { borderBottomWidth: 0, marginTop: 4 },
  encabezado: { fontSize: 11, fontWeight: "bold" },
  celda: { fontSize: 12 },
  negrita: { fontWeight: "bold" },
  colNombre: { flex: 1 },
  colPorcentaje: { width: 36, textAlign: "right" },
  colCitas: { width: 34, textAlign: "right" },
  colDinero: { width: 72, textAlign: "right" },
  nota: { fontSize: 11, marginTop: 6 },
});
