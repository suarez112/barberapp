import { StyleSheet, Text, View } from "react-native";
import Insignia from "@/components/ui/Insignia";
import { COLORES } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { IngresosPlataforma, obtenerIngresos } from "./api";
import EstadoCarga from "./components/EstadoCarga";
import { formatearMes, formatearNumero, formatearPesos } from "./formato";
import GraficoColumnas from "./graficos/GraficoColumnas";
import TarjetaGrafico from "./graficos/TarjetaGrafico";
import { useCargar } from "./useCargar";

// Ingresos estimados del Inicio: todo sale de GET /superadmin/ingresos.
// Son la suma del precio del plan en cada activación, no pagos reales: por eso todo
// lleva la etiqueta "Estimado".
export default function IngresosSuperadmin() {
  const { datos, cargando, error, recargar } = useCargar(obtenerIngresos, "ingresos");

  return (
    <EstadoCarga cargando={cargando} error={error} hayDatos={datos !== null} onReintentar={recargar}>
      {datos ? <Graficos i={datos} /> : null}
    </EstadoCarga>
  );
}

const activaciones = (n: number) => `${formatearNumero(n)} ${n === 1 ? "activación" : "activaciones"}`;

function Graficos({ i }: { i: IngresosPlataforma }) {
  const { colors } = useAppTheme();

  const meses = i.porMes.map((m) => ({
    etiqueta: formatearMes(m.mes),
    valor: m.total,
    destacada: m.mes === i.mejorMes?.mes,
  }));
  const anios = i.porAnio.map((a) => ({
    etiqueta: String(a.anio),
    valor: a.total,
    destacada: a.anio === i.mejorAnio?.anio,
  }));
  const totalMeses = i.porMes.reduce((suma, m) => suma + m.total, 0);
  const estimado = i.estimado ? <Insignia texto="ESTIMADO" color={COLORES.naranja} /> : null;

  const mejor = (titulo: string, valor: string, detalle: string) => (
    <View
      accessible
      accessibilityLabel={`${titulo}: ${valor}, ${detalle}, estimado`}
      style={[styles.mejor, { borderColor: colors.cardBorder }]}
    >
      <Text style={[styles.mejorTitulo, { color: colors.textSecondary }]}>★ {titulo}</Text>
      <Text style={[styles.mejorValor, { color: colors.textPrimary }]}>{valor}</Text>
      <Text style={[styles.mejorDetalle, { color: colors.textSecondary }]}>{detalle}</Text>
    </View>
  );

  const pie = (
    <Text style={[styles.pie, { color: colors.textSecondary }]}>
      {i.nota} Moneda: {i.moneda}.
    </Text>
  );

  return (
    <View style={styles.rejilla}>
      <TarjetaGrafico
        ancha
        titulo="Ingresos estimados por mes"
        subtitulo="Últimos 12 meses, por fecha de activación del plan"
        filas={i.porMes.map((m) => [formatearMes(m.mes), `${formatearPesos(m.total)} · ${activaciones(m.activaciones)}`])}
      >
        <View style={styles.cabecera}>
          {estimado}
          <Text style={[styles.total, { color: colors.textSecondary }]}>
            {formatearPesos(totalMeses)} en estos 12 meses
          </Text>
        </View>
        <GraficoColumnas
          datos={meses}
          descripcion={`Ingresos estimados por mes en los últimos 12 meses: ${formatearPesos(totalMeses)} en total.${
            i.mejorMes ? ` Mejor mes: ${formatearMes(i.mejorMes.mes)}, ${formatearPesos(i.mejorMes.total)}.` : ""
          }`}
        />
        {i.mejorMes
          ? mejor("Mes con más ingresos", formatearPesos(i.mejorMes.total), `${formatearMes(i.mejorMes.mes)} · ${activaciones(i.mejorMes.activaciones)}`)
          : (
            <Text style={[styles.pie, { color: colors.textSecondary }]}>Aún no hay activaciones de planes.</Text>
          )}
        {pie}
      </TarjetaGrafico>

      <TarjetaGrafico
        ancha
        titulo="Ingresos estimados por año"
        subtitulo="Desde el primer año con activaciones"
        filas={i.porAnio.map((a) => [String(a.anio), `${formatearPesos(a.total)} · ${activaciones(a.activaciones)}`])}
      >
        <View style={styles.cabecera}>
          {estimado}
          <Text style={[styles.total, { color: colors.textSecondary }]}>
            {formatearPesos(i.total)} en total · {activaciones(i.activaciones)}
          </Text>
        </View>
        <GraficoColumnas
          datos={anios}
          descripcion={`Ingresos estimados por año: ${formatearPesos(i.total)} en total.${
            i.mejorAnio ? ` Mejor año: ${i.mejorAnio.anio}, ${formatearPesos(i.mejorAnio.total)}.` : ""
          }`}
        />
        {i.mejorAnio
          ? mejor("Año con más ingresos", formatearPesos(i.mejorAnio.total), `${i.mejorAnio.anio} · ${activaciones(i.mejorAnio.activaciones)}`)
          : (
            <Text style={[styles.pie, { color: colors.textSecondary }]}>Aún no hay activaciones de planes.</Text>
          )}
        {pie}
      </TarjetaGrafico>
    </View>
  );
}

const styles = StyleSheet.create({
  rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16 },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 },
  total: { fontSize: 13 },
  mejor: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  mejorTitulo: { fontSize: 13, fontWeight: "600" },
  mejorValor: { fontSize: 24, fontWeight: "bold", marginTop: 2 },
  mejorDetalle: { fontSize: 13, marginTop: 2 },
  pie: { fontSize: 12, marginTop: 12 },
});
