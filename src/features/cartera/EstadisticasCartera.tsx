import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { ResumenCartera } from "./api";
import { BarrasHorizontales, BarraFila, VentasPorDia } from "./GraficosCartera";
import PagoProfesionales from "./PagoProfesionales";
import { textoRango } from "./periodoVisible";

const dinero = (n: number) => `$${formatearPesos(n)}`;
// 12.5 -> "12,5"
const decimal = (n: number) => String(n).replace(".", ",");

// Lunes primero; el número es el que manda el backend (0 = domingo)
const DIAS = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

const NOMBRE_DIA: Record<number, string> = Object.fromEntries(DIAS.map((d) => [d.dia, d.nombre]));

// "14:00" -> "2:00 p. m."
const horaLegible = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
};

// Estadísticas del período que se está viendo en la cartera del administrador.
// Todo sale del mismo GET /cartera/resumen: aquí solo se dibuja.
export default function EstadisticasCartera({ resumen }: { resumen: ResumenCartera }) {
  const { colors } = useAppTheme();
  const { comparacion, ocupacion, cancelaciones, clientes } = resumen;
  const anterior = comparacion.periodoAnterior;
  const variacion = comparacion.variacionPorcentaje;

  const seccion = (titulo: string, hijos: ReactNode, ayuda?: string) => (
    <View>
      <Text accessibilityRole="header" style={[s.titulo, { color: colors.primaryText }]}>
        {titulo}
      </Text>
      {ayuda ? <Text style={[s.ayuda, { color: colors.textSecondary }]}>{ayuda}</Text> : null}
      {hijos}
    </View>
  );

  const tarjeta = (valor: string, texto: string, ayuda: string) => (
    <View
      accessible
      accessibilityLabel={`${texto}: ${valor}. ${ayuda}`}
      style={[s.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
    >
      <Text numberOfLines={1} adjustsFontSizeToFit style={[s.numero, { color: colors.textPrimary }]}>
        {valor}
      </Text>
      <Text style={[s.textoTarjeta, { color: colors.textSecondary }]}>{texto}</Text>
      <Text style={[s.ayudaTarjeta, { color: colors.textSecondary }]}>{ayuda}</Text>
    </View>
  );

  // Flecha de subida o bajada contra el período anterior
  const cambio = (etiqueta: string, actual: string, antes: string, v: number | null) => {
    const sube = v === null || v > 0;
    const igual = v === 0;
    const color = igual ? colors.textSecondary : sube ? colors.exitoTexto : colors.peligroTexto;
    const texto = v === null ? "Nuevo" : igual ? "Sin cambios" : `${decimal(Math.abs(v))}%`;
    const voz = v === null ? "sube, antes era cero" : igual ? "sin cambios" : `${sube ? "sube" : "baja"} ${decimal(Math.abs(v))} por ciento`;
    return (
      <View
        key={etiqueta}
        accessible
        accessibilityLabel={`${etiqueta}: ${actual}, ${voz} frente al período anterior (${antes})`}
        style={[s.filaCambio, { borderColor: colors.cardBorder }]}
      >
        <View style={s.textosCambio}>
          <Text style={[s.etiquetaCambio, { color: colors.textSecondary }]}>{etiqueta}</Text>
          <Text style={[s.valorCambio, { color: colors.textPrimary }]}>{actual}</Text>
          <Text style={[s.antes, { color: colors.textSecondary }]}>Antes: {antes}</Text>
        </View>
        <View style={s.indicador}>
          <Ionicons
            name={igual ? "remove" : sube ? "arrow-up" : "arrow-down"}
            size={20}
            color={color}
          />
          <Text style={[s.textoIndicador, { color }]}>{texto}</Text>
        </View>
      </View>
    );
  };

  const servicios: BarraFila[] = resumen.serviciosMasVendidos.map((v) => ({
    clave: v.servicioId,
    etiqueta: v.nombre,
    valor: v.cantidad,
    detalle: dinero(v.ventas),
  }));

  const porDia: BarraFila[] = DIAS.map(({ dia, nombre }) => ({
    clave: String(dia),
    etiqueta: nombre,
    valor: ocupacion.diasSemana.find((d) => d.dia === dia)?.citas ?? 0,
    destacada: dia === ocupacion.diaMasOcupado,
  }));

  const porHora: BarraFila[] = ocupacion.horas.map((h) => ({
    clave: h.hora,
    etiqueta: horaLegible(h.hora),
    valor: h.citas,
    destacada: h.hora === ocupacion.horaMasOcupada,
  }));

  const totalClientes = clientes.nuevos + clientes.recurrentes;

  return (
    <View>
      <Text accessibilityRole="header" style={[s.tituloGrande, { color: colors.primaryText }]}>
        📊 ESTADÍSTICAS DEL PERÍODO
      </Text>

      <View style={s.filaTarjetas}>
        {tarjeta(dinero(resumen.ticketPromedio), "Ticket promedio", "Venta media por cita")}
        {tarjeta(
          `${decimal(cancelaciones.tasaPorcentaje)}%`,
          "Tasa de cancelación",
          `${cancelaciones.canceladas} de ${cancelaciones.totalCitas} citas`,
        )}
      </View>

      {seccion(
        "COMPARADO CON EL PERÍODO ANTERIOR",
        <View style={[s.bloque, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[s.rangoAnterior, { color: colors.textSecondary }]}>
            {textoRango(anterior.desde, anterior.hasta)}
          </Text>
          {cambio("Ventas totales", dinero(resumen.totalVentas), dinero(anterior.totalVentas), variacion.ventas)}
          {cambio(
            "Ganancia del negocio",
            dinero(resumen.gananciaNegocio),
            dinero(anterior.gananciaNegocio),
            variacion.gananciaNegocio,
          )}
          {cambio("Citas completadas", String(resumen.citasCompletadas), String(anterior.citasCompletadas), variacion.citas)}
        </View>,
        "Si el período actual aún no termina, se compara con el anterior completo.",
      )}

      {seccion("VENTAS POR DÍA", <VentasPorDia dias={resumen.ventasPorDia} />)}

      {seccion(
        "SERVICIOS MÁS VENDIDOS",
        <BarrasHorizontales
          filas={servicios}
          unidad="vendidos"
          vacio="No hay servicios vendidos en este período."
        />,
        "Cantidad vendida y total en pesos.",
      )}

      {seccion(
        "DÍAS CON MÁS CITAS",
        <BarrasHorizontales filas={porDia} unidad="citas" vacio="No hay citas en este período." />,
        ocupacion.diaMasOcupado !== null
          ? `Día más ocupado: ${NOMBRE_DIA[ocupacion.diaMasOcupado]}. No cuenta las canceladas.`
          : "No cuenta las canceladas.",
      )}

      {seccion(
        "HORAS CON MÁS CITAS",
        <BarrasHorizontales filas={porHora} unidad="citas" vacio="No hay citas en este período." />,
        ocupacion.horaMasOcupada ? `Hora más ocupada: ${horaLegible(ocupacion.horaMasOcupada)}.` : undefined,
      )}

      {seccion(
        "CLIENTES NUEVOS Y RECURRENTES",
        totalClientes === 0 ? (
          <Text style={[s.vacio, { color: colors.textSecondary }]}>No hubo clientes con citas en este período.</Text>
        ) : (
          <View
            accessible
            accessibilityLabel={`${clientes.nuevos} clientes nuevos y ${clientes.recurrentes} recurrentes`}
          >
            <View style={[s.divisor, { borderColor: colors.cardBorder }]}>
              {clientes.nuevos > 0 ? (
                <View style={{ flex: clientes.nuevos, backgroundColor: colors.primary }} />
              ) : null}
              {clientes.recurrentes > 0 ? (
                <View style={{ flex: clientes.recurrentes, backgroundColor: colors.primary, opacity: 0.4 }} />
              ) : null}
            </View>
            <View style={s.leyenda}>
              <Text style={[s.textoLeyenda, { color: colors.textPrimary }]}>
                <Text style={s.negrita}>{clientes.nuevos}</Text> nuevos (primera cita)
              </Text>
              <Text style={[s.textoLeyenda, { color: colors.textPrimary }]}>
                <Text style={s.negrita}>{clientes.recurrentes}</Text> recurrentes (ya habían venido)
              </Text>
            </View>
          </View>
        ),
      )}

      {seccion("PAGO A PROFESIONALES", <PagoProfesionales pago={resumen.pagoProfesionales} />)}
    </View>
  );
}

const s = StyleSheet.create({
  tituloGrande: { fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginTop: 30, marginBottom: 4 },
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginTop: 22, marginBottom: 8 },
  ayuda: { fontSize: 11, marginBottom: 8 },
  vacio: { fontSize: 13, marginVertical: 6 },
  filaTarjetas: { flexDirection: "row", gap: 8, marginTop: 8 },
  tarjeta: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  numero: { fontSize: 20, fontWeight: "bold" },
  textoTarjeta: { fontSize: 12, fontWeight: "600", marginTop: 4, textAlign: "center" },
  ayudaTarjeta: { fontSize: 11, marginTop: 2, textAlign: "center" },
  bloque: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  rangoAnterior: { fontSize: 12, paddingVertical: 6 },
  filaCambio: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderTopWidth: 1 },
  textosCambio: { flex: 1 },
  etiquetaCambio: { fontSize: 12 },
  valorCambio: { fontSize: 17, fontWeight: "bold", marginTop: 2 },
  antes: { fontSize: 11, marginTop: 2 },
  indicador: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  textoIndicador: { fontSize: 14, fontWeight: "bold" },
  divisor: { flexDirection: "row", height: 18, borderRadius: 5, borderWidth: 1, overflow: "hidden" },
  leyenda: { marginTop: 8, gap: 4 },
  textoLeyenda: { fontSize: 13 },
  negrita: { fontWeight: "bold" },
});
