import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { useAgenda } from "../agenda/AgendaProvider";

export type PeriodoActual = "hoy" | "semana" | "mes";

const ETIQUETAS: Record<PeriodoActual, string> = {
  hoy: "HOY",
  semana: "ESTA SEMANA",
  mes: "ESTE MES",
};

// Convierte "2026-10-11" en una fecha local
const aFecha = (fechaStr: string) => {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Primer y último día del período actual (la semana va de lunes a domingo)
const rangoActual = (periodo: PeriodoActual) => {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  if (periodo === "hoy") return { inicio: hoy, fin: hoy };
  if (periodo === "semana") {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7));
    return { inicio, fin: new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6) };
  }
  return {
    inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    fin: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0),
  };
};

// Citas confirmadas por realizar en el período actual y lo que se espera vender
export default function ProyeccionCartera({ periodo }: { periodo: PeriodoActual }) {
  const { colors } = useAppTheme();
  const { citas } = useAgenda();
  const { inicio, fin } = rangoActual(periodo);

  const porRealizar = citas.filter((c) => {
    const f = aFecha(c.fecha);
    return c.estado === "CONFIRMADA" && f >= inicio && f <= fin;
  });
  const esperado = porRealizar.reduce((suma, c) => suma + c.precio, 0);

  const tarjeta = (valor: string, texto: string, destacada = false) => (
    <View
      style={[
        s.tarjeta,
        {
          backgroundColor: colors.cardBg,
          borderColor: destacada ? colors.primary : colors.cardBorder,
        },
      ]}
    >
      <Text style={[s.numero, { color: destacada ? colors.primaryText : colors.textPrimary }]}>
        {valor}
      </Text>
      <Text style={[s.texto, { color: destacada ? colors.primaryText : colors.textSecondary }]}>
        {texto}
      </Text>
    </View>
  );

  return (
    <View>
      <Text style={[s.titulo, { color: colors.primaryText }]}>
        📈 PROYECCIÓN · {ETIQUETAS[periodo]}
      </Text>
      <View style={s.fila}>
        {tarjeta(String(porRealizar.length), "Citas por realizar")}
        {tarjeta(`$${formatearPesos(esperado)}`, "Ventas esperadas", true)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginTop: 25, marginBottom: 10 },
  fila: { flexDirection: "row", gap: 10, marginTop: 4 },
  tarjeta: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  numero: { fontSize: 20, fontWeight: "bold" },
  texto: { fontSize: 11, marginTop: 4, textAlign: "center" },
});
