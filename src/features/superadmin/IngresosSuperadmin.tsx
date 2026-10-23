import { StyleSheet, Text, View } from "react-native";
import Insignia from "@/components/ui/Insignia";
import { COLORES } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { CifrasIngreso, IngresosPlataforma, obtenerIngresos } from "./api";
import EstadoCarga from "./components/EstadoCarga";
import { formatearMes, formatearNumero, formatearPesos } from "./formato";
import GraficoBarras from "./graficos/GraficoBarras";
import GraficoColumnas from "./graficos/GraficoColumnas";
import TarjetaGrafico from "./graficos/TarjetaGrafico";
import { useCargar } from "./useCargar";

// Ingresos estimados del Inicio: todo sale de GET /superadmin/ingresos.
// Son la suma del precio en cada activación y cargo proporcional pagado, no pagos reales:
// por eso todo lleva la etiqueta "Estimado".
export default function IngresosSuperadmin() {
  const { datos, cargando, error, recargar } = useCargar(obtenerIngresos, "ingresos");

  return (
    <EstadoCarga cargando={cargando} error={error} hayDatos={datos !== null} onReintentar={recargar}>
      {datos ? <Graficos i={datos} /> : null}
    </EstadoCarga>
  );
}

const movimientos = (c: CifrasIngreso) => {
  const a = `${formatearNumero(c.activaciones)} ${c.activaciones === 1 ? "activación" : "activaciones"}`;
  const p = `${formatearNumero(c.cargosPagados)} ${c.cargosPagados === 1 ? "cargo" : "cargos"}`;
  return `${a} · ${p}`;
};

// "Bruto $X · Comisión $Y · Neto $Z" de una fila de la tabla
const resumenFila = (c: CifrasIngreso) =>
  `Bruto ${formatearPesos(c.bruto)} · Comisión ${formatearPesos(c.comisionPasarela)} · Neto ${formatearPesos(c.neto)}`;

const sumar = (filas: CifrasIngreso[]) =>
  filas.reduce(
    (t, f) => ({
      bruto: t.bruto + f.bruto,
      comisionPasarela: t.comisionPasarela + f.comisionPasarela,
      neto: t.neto + f.neto,
    }),
    { bruto: 0, comisionPasarela: 0, neto: 0 },
  );

function Graficos({ i }: { i: IngresosPlataforma }) {
  const { colors } = useAppTheme();
  const estimado = i.estimado ? <Insignia texto="ESTIMADO" color={COLORES.naranja} /> : null;

  const meses = i.porMes.map((m) => ({
    etiqueta: formatearMes(m.mes),
    valor: m.bruto,
    destacada: m.mes === i.mejorMes?.mes,
  }));
  const anios = i.porAnio.map((a) => ({
    etiqueta: String(a.anio),
    valor: a.bruto,
    destacada: a.anio === i.mejorAnio?.anio,
  }));
  const totalMeses = sumar(i.porMes);
  const porNivel = i.negociosPorNivel.map((n) => ({
    etiqueta: n.nombre,
    valor: n.total,
    detalle: `${n.profesionalesDesde === n.profesionalesHasta ? n.profesionalesDesde : `${n.profesionalesDesde} a ${n.profesionalesHasta}`} prof. · ${formatearNumero(n.activos)} ${n.activos === 1 ? "activo" : "activos"}`,
  }));
  const { mensual, anual } = i.mensualVsAnual;
  const cargos = i.cargosProporcionalesDelMes;

  // Una cifra grande con su etiqueta y la insignia "Estimado"
  const cifra = (titulo: string, valor: string, detalle?: string) => (
    <View
      accessible
      accessibilityLabel={`${titulo}: ${valor}${detalle ? `, ${detalle}` : ""}, estimado`}
      style={[styles.cifra, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}
    >
      <View style={styles.cifraCabecera}>
        <Text style={[styles.cifraTitulo, { color: colors.textSecondary }]}>{titulo}</Text>
        {estimado}
      </View>
      <Text style={[styles.cifraValor, { color: colors.textPrimary }]}>{valor}</Text>
      {detalle ? <Text style={[styles.cifraDetalle, { color: colors.textSecondary }]}>{detalle}</Text> : null}
    </View>
  );

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
      <View style={styles.cifras}>
        {cifra("Ingreso bruto", formatearPesos(i.bruto), `${movimientos(i)} en todo el historial`)}
        {cifra("Comisión de la pasarela", formatearPesos(i.comisionPasarela), "2,65 % + $700 por transacción, más IVA")}
        {cifra("Ingreso neto", formatearPesos(i.neto), "Bruto menos la comisión")}
      </View>

      <TarjetaGrafico
        ancha
        titulo="Ingresos estimados por mes"
        subtitulo="Últimos 12 meses (columnas = ingreso bruto)"
        filas={i.porMes.map((m) => [formatearMes(m.mes), `${resumenFila(m)} · ${movimientos(m)}`])}
      >
        <View style={styles.cabecera}>
          {estimado}
          <Text style={[styles.total, { color: colors.textSecondary }]}>
            En estos 12 meses: bruto {formatearPesos(totalMeses.bruto)} · comisión{" "}
            {formatearPesos(totalMeses.comisionPasarela)} · neto {formatearPesos(totalMeses.neto)}
          </Text>
        </View>
        <GraficoColumnas
          datos={meses}
          descripcion={`Ingreso bruto estimado por mes en los últimos 12 meses: ${formatearPesos(totalMeses.bruto)} en total, ${formatearPesos(totalMeses.neto)} neto.${
            i.mejorMes ? ` Mejor mes: ${formatearMes(i.mejorMes.mes)}, ${formatearPesos(i.mejorMes.bruto)}.` : ""
          }`}
        />
        {i.mejorMes ? (
          mejor(
            "Mes con más ingresos",
            formatearPesos(i.mejorMes.bruto),
            `${formatearMes(i.mejorMes.mes)} · neto ${formatearPesos(i.mejorMes.neto)} · ${movimientos(i.mejorMes)}`,
          )
        ) : (
          <Text style={[styles.pie, { color: colors.textSecondary }]}>Aún no hay activaciones de planes.</Text>
        )}
        {pie}
      </TarjetaGrafico>

      <TarjetaGrafico
        ancha
        titulo="Ingresos estimados por año"
        subtitulo="Desde el primer año con movimiento (columnas = ingreso bruto)"
        filas={i.porAnio.map((a) => [String(a.anio), `${resumenFila(a)} · ${movimientos(a)}`])}
      >
        <View style={styles.cabecera}>
          {estimado}
          <Text style={[styles.total, { color: colors.textSecondary }]}>
            En total: bruto {formatearPesos(i.bruto)} · comisión {formatearPesos(i.comisionPasarela)} · neto{" "}
            {formatearPesos(i.neto)}
          </Text>
        </View>
        <GraficoColumnas
          datos={anios}
          descripcion={`Ingreso bruto estimado por año: ${formatearPesos(i.bruto)} en total, ${formatearPesos(i.neto)} neto.${
            i.mejorAnio ? ` Mejor año: ${i.mejorAnio.anio}, ${formatearPesos(i.mejorAnio.bruto)}.` : ""
          }`}
        />
        {i.mejorAnio ? (
          mejor(
            "Año con más ingresos",
            formatearPesos(i.mejorAnio.bruto),
            `${i.mejorAnio.anio} · neto ${formatearPesos(i.mejorAnio.neto)} · ${movimientos(i.mejorAnio)}`,
          )
        ) : (
          <Text style={[styles.pie, { color: colors.textSecondary }]}>Aún no hay activaciones de planes.</Text>
        )}
        {pie}
      </TarjetaGrafico>

      <View style={styles.cifras}>
        {cifra(
          "Profesionales cobrados",
          formatearNumero(i.profesionales.cobradosEnTotal),
          `${i.profesionales.promedioPorNegocio.toLocaleString("es-CO")} en promedio por negocio activo`,
        )}
        {i.ingresoPromedioPorNegocio
          ? cifra(
              "Ingreso promedio por negocio",
              `${formatearPesos(i.ingresoPromedioPorNegocio.bruto)} al mes`,
              `Neto ${formatearPesos(i.ingresoPromedioPorNegocio.neto)} al mes`,
            )
          : cifra("Ingreso promedio por negocio", "—", "Aún no hay negocios activos")}
        {cifra(
          "Cargos proporcionales del mes",
          `${formatearPesos(cargos.pendientes.total + cargos.pagados.total)}`,
          `Pagados ${formatearNumero(cargos.pagados.cantidad)} (${formatearPesos(cargos.pagados.total)}) · pendientes ${formatearNumero(cargos.pendientes.cantidad)} (${formatearPesos(cargos.pendientes.total)})`,
        )}
      </View>

      <TarjetaGrafico
        titulo="Negocios por nivel"
        subtitulo="Según los profesionales cobrados de cada negocio"
        filas={porNivel.map((b) => [b.etiqueta, `${formatearNumero(b.valor)} (${b.detalle})`])}
      >
        <GraficoBarras datos={porNivel} vacio="Aún no hay negocios." />
      </TarjetaGrafico>

      <TarjetaGrafico
        titulo="Mensual vs. anual"
        subtitulo="Negocios activos por periodo de pago"
        filas={[
          ["Mensual", formatearNumero(mensual)],
          ["Anual", formatearNumero(anual)],
        ]}
      >
        <GraficoBarras
          datos={[
            { etiqueta: "Mensual", valor: mensual },
            { etiqueta: "Anual", valor: anual },
          ]}
          vacio="Aún no hay negocios activos."
        />
        <View style={styles.estimadoPie}>{estimado}</View>
      </TarjetaGrafico>
    </View>
  );
}

const styles = StyleSheet.create({
  rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16 },
  cifras: { flexDirection: "row", flexWrap: "wrap", gap: 16, flexBasis: "100%" },
  cifra: { flexGrow: 1, flexBasis: 260, borderWidth: 1, borderRadius: 12, padding: 16 },
  cifraCabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cifraTitulo: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  cifraValor: { fontSize: 24, fontWeight: "bold", marginTop: 6 },
  cifraDetalle: { fontSize: 12, marginTop: 4 },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 },
  total: { fontSize: 13, flexShrink: 1 },
  mejor: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  mejorTitulo: { fontSize: 13, fontWeight: "600" },
  mejorValor: { fontSize: 24, fontWeight: "bold", marginTop: 2 },
  mejorDetalle: { fontSize: 13, marginTop: 2 },
  pie: { fontSize: 12, marginTop: 12 },
  estimadoPie: { marginTop: 10, alignItems: "flex-start" },
});
