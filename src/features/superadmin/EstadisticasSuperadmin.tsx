import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Insignia from "@/components/ui/Insignia";
import Tocable from "@/components/ui/Tocable";
import { COLORES } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { EstadisticasPlataforma, EstadoNegocio, obtenerEstadisticas } from "./api";
import EstadoCarga from "./components/EstadoCarga";
import { formatearDiaMes, formatearMes, formatearNumero, formatearPesos } from "./formato";
import GraficoBarras, { BarraDato } from "./graficos/GraficoBarras";
import GraficoLinea from "./graficos/GraficoLinea";
import TarjetaGrafico from "./graficos/TarjetaGrafico";
import { useCargar } from "./useCargar";

const ETIQUETA_ESTADO: Record<EstadoNegocio, string> = {
  prueba: "En prueba",
  activo: "Activos",
  vencido: "Vencidos",
  suspendido: "Suspendidos",
};

const NOMBRE_PERIODO = { mensual: "mensual", anual: "anual" } as const;

type Props = { onVerNegocio: (id: string) => void };

// Gráficos del Inicio: todo sale de GET /superadmin/estadisticas (solo conteos y totales)
export default function EstadisticasSuperadmin({ onVerNegocio }: Props) {
  const { datos, cargando, error, recargar } = useCargar(obtenerEstadisticas, "estadisticas");

  return (
    <EstadoCarga cargando={cargando} error={error} hayDatos={datos !== null} onReintentar={recargar}>
      {datos ? <Graficos e={datos} onVerNegocio={onVerNegocio} /> : null}
    </EstadoCarga>
  );
}

function Graficos({ e, onVerNegocio }: { e: EstadisticasPlataforma; onVerNegocio: (id: string) => void }) {
  const { colors } = useAppTheme();

  // Un color por estado, legible en el tema actual; además cada barra lleva su nombre escrito
  const colorEstado: Record<EstadoNegocio, string> = {
    prueba: colors.infoTexto,
    activo: colors.exitoTexto,
    vencido: colors.peligroTexto,
    suspendido: colors.apagadoTexto,
  };

  const nuevosPorMes = e.negociosNuevosPorMes.map((p) => ({ etiqueta: formatearMes(p.mes), valor: p.total }));
  const citasPorDia = e.citasPorDia.map((p) => ({ etiqueta: formatearDiaMes(p.dia), valor: p.total }));
  const porEstado: BarraDato[] = e.negociosPorEstado.map((f) => ({
    etiqueta: ETIQUETA_ESTADO[f.estado],
    valor: f.total,
    color: colorEstado[f.estado],
  }));
  const porPlan: BarraDato[] = e.negociosPorPlan.map((f) => ({
    etiqueta: f.nombre,
    valor: f.total,
    detalle: `${formatearNumero(f.activos)} ${f.activos === 1 ? "activo" : "activos"}`,
  }));
  const departamentos: BarraDato[] = e.topDepartamentos.map((f) => ({ etiqueta: f.departamento, valor: f.total }));

  const total = (serie: { valor: number }[]) => serie.reduce((suma, p) => suma + p.valor, 0);
  const conversion = e.conversionPruebaAPlan;
  const ingreso = e.ingresoMensualEstimado;
  const nombrePlan = (id: string) => e.negociosPorPlan.find((p) => p.plan === id)?.nombre ?? id;
  const vencen = e.vencenEn7Dias;

  return (
    <View style={styles.rejilla}>
      <TarjetaGrafico
        titulo="Negocios nuevos por mes"
        subtitulo="Últimos 12 meses, por fecha de registro"
        filas={nuevosPorMes.map((p) => [p.etiqueta, formatearNumero(p.valor)])}
      >
        <GraficoLinea
          puntos={nuevosPorMes}
          descripcion={`Negocios nuevos por mes en los últimos 12 meses: ${formatearNumero(total(nuevosPorMes))} en total`}
        />
      </TarjetaGrafico>

      <TarjetaGrafico
        titulo="Citas por día"
        subtitulo="Últimos 30 días, sin contar las canceladas"
        filas={citasPorDia.map((p) => [p.etiqueta, formatearNumero(p.valor)])}
      >
        <GraficoLinea
          puntos={citasPorDia}
          descripcion={`Citas por día en los últimos 30 días: ${formatearNumero(total(citasPorDia))} en total`}
        />
      </TarjetaGrafico>

      <TarjetaGrafico
        titulo="Negocios por estado"
        filas={porEstado.map((b) => [b.etiqueta, formatearNumero(b.valor)])}
      >
        <GraficoBarras datos={porEstado} vacio="Aún no hay negocios." />
      </TarjetaGrafico>

      <TarjetaGrafico
        titulo="Negocios por plan"
        subtitulo="Con cuántos están activos"
        filas={porPlan.map((b) => [b.etiqueta, `${formatearNumero(b.valor)} (${b.detalle})`])}
      >
        <GraficoBarras datos={porPlan} vacio="Aún no hay negocios." />
      </TarjetaGrafico>

      <TarjetaGrafico
        titulo="Top 5 departamentos"
        subtitulo="Donde hay más negocios"
        filas={departamentos.map((b) => [b.etiqueta, formatearNumero(b.valor)])}
      >
        <GraficoBarras datos={departamentos} vacio="Aún ningún negocio ha registrado su ubicación." />
      </TarjetaGrafico>

      <TarjetaGrafico
        titulo="Conversión de prueba a plan"
        subtitulo="De los negocios que ya pagaron o cuya prueba terminó"
      >
        {conversion.tasaPorcentaje === null ? (
          <Text style={[styles.nota, { color: colors.textSecondary }]}>
            Todavía no hay pruebas terminadas para calcularla.
          </Text>
        ) : (
          <View accessible accessibilityLabel={`${conversion.tasaPorcentaje} por ciento. ${conversion.convertidos} de ${conversion.pruebasTerminadas} negocios pasaron a un plan.`}>
            <Text style={[styles.grande, { color: colors.textPrimary }]}>
              {conversion.tasaPorcentaje.toLocaleString("es-CO")}%
            </Text>
            <Text style={[styles.nota, { color: colors.textSecondary }]}>
              {formatearNumero(conversion.convertidos)} de {formatearNumero(conversion.pruebasTerminadas)} negocios
              pasaron a un plan
            </Text>
          </View>
        )}
      </TarjetaGrafico>

      <TarjetaGrafico titulo="Ingreso mensual estimado" subtitulo="Negocios con plan activo">
        <View style={styles.filaIngreso}>
          <Text
            accessibilityLabel={`${formatearPesos(ingreso.total)} ${ingreso.moneda} al mes, estimado`}
            style={[styles.grande, { color: colors.textPrimary }]}
          >
            {formatearPesos(ingreso.total)}
          </Text>
          {ingreso.estimado ? <Insignia texto="ESTIMADO" color={COLORES.naranja} /> : null}
        </View>
        <Text style={[styles.nota, { color: colors.textSecondary }]}>{ingreso.moneda} al mes</Text>
        {ingreso.detalle.map((f) => (
          <View key={`${f.plan}-${f.periodo}`} style={styles.detalle}>
            <Text style={[styles.textoDetalle, { color: colors.textSecondary }]}>
              {nombrePlan(f.plan)} · {NOMBRE_PERIODO[f.periodo]} ({formatearNumero(f.negocios)}{" "}
              {f.negocios === 1 ? "negocio" : "negocios"})
            </Text>
            <Text style={[styles.textoDetalle, { color: colors.textPrimary }]}>{formatearPesos(f.ingreso)}</Text>
          </View>
        ))}
        <Text style={[styles.pie, { color: colors.textSecondary }]}>{ingreso.nota}</Text>
      </TarjetaGrafico>

      <TarjetaGrafico
        ancha
        titulo="Negocios que vencen en 7 días"
        subtitulo={
          vencen.total === 0
            ? undefined
            : `${formatearNumero(vencen.total)} en total · toca uno para ver su detalle`
        }
      >
        {vencen.negocios.length === 0 ? (
          <Text style={[styles.nota, { color: colors.textSecondary }]}>
            Ningún negocio vence en los próximos 7 días.
          </Text>
        ) : (
          vencen.negocios.map((n) => (
            <Tocable
              key={n.id}
              accessibilityRole="button"
              accessibilityLabel={`${n.nombre}, vence en ${n.diasRestantes} ${n.diasRestantes === 1 ? "día" : "días"}`}
              accessibilityHint="Abre el detalle del negocio"
              onPress={() => onVerNegocio(n.id)}
              style={[styles.negocio, { borderColor: colors.cardBorder }]}
            >
              <View style={styles.negocioTextos}>
                <Text numberOfLines={1} style={[styles.negocioNombre, { color: colors.textPrimary }]}>
                  {n.nombre}
                </Text>
                <Text numberOfLines={1} style={[styles.negocioCodigo, { color: colors.textSecondary }]}>
                  {n.codigoAcceso} · {n.estado === "prueba" ? "En prueba" : "Plan activo"}
                </Text>
              </View>
              <Text style={[styles.dias, { color: colors.avisoTexto }]}>
                {n.diasRestantes === 0 ? "Hoy" : `${n.diasRestantes} ${n.diasRestantes === 1 ? "día" : "días"}`}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Tocable>
          ))
        )}
        {vencen.total > vencen.negocios.length ? (
          <Text style={[styles.pie, { color: colors.textSecondary }]}>
            Se muestran {vencen.negocios.length}. Filtra por «Por vencer» en Negocios para ver todos.
          </Text>
        ) : null}
      </TarjetaGrafico>
    </View>
  );
}

const styles = StyleSheet.create({
  rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16 },
  grande: { fontSize: 40, fontWeight: "bold" },
  nota: { fontSize: 14, marginTop: 4 },
  pie: { fontSize: 12, marginTop: 12 },
  filaIngreso: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  detalle: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 8 },
  textoDetalle: { fontSize: 13 },
  negocio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  negocioTextos: { flex: 1 },
  negocioNombre: { fontSize: 14, fontWeight: "bold" },
  negocioCodigo: { fontSize: 12, marginTop: 2 },
  dias: { fontSize: 14, fontWeight: "bold" },
});
