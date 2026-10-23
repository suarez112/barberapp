import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Desplegable, { OpcionDesplegable } from "@/components/ui/Desplegable";
import SelectorDias from "@/components/ui/SelectorDias";
import TarjetaDesplegable from "@/components/ui/TarjetaDesplegable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { crearDia, sumarDias, textoRango } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import { Comparar, ResumenCartera, TipoComparacion } from "./api";
import { BarrasHorizontales, BarraFila, diaCorto, VentasPorDia } from "./GraficosCartera";
import PagoProfesionales from "./PagoProfesionales";

const dinero = (n: number) => `$${formatearPesos(n)}`;
// 12.5 -> "12,5"
export const decimal = (n: number) => String(n).replace(".", ",");

// El backend acepta rangos de comparación de hasta 366 días (contando los dos extremos)
const MAX_DIAS_COMPARAR = 365;
// Hasta cuánto atrás se deja elegir fechas para comparar
const ANIOS_ATRAS_COMPARAR = 5;

const OPCIONES_COMPARAR: readonly OpcionDesplegable<TipoComparacion>[] = [
  { valor: "anterior", etiqueta: "Período anterior" },
  { valor: "mes_pasado", etiqueta: "Mismo período del mes pasado" },
  { valor: "anio_pasado", etiqueta: "Mismo período del año pasado" },
  { valor: "personalizado", etiqueta: "Elegir fechas" },
];

// Lunes primero; el número es el que manda el backend (0 = domingo)
export const DIAS = [
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
  { dia: 0, nombre: "Domingo" },
];

export const NOMBRE_DIA: Record<number, string> = Object.fromEntries(DIAS.map((d) => [d.dia, d.nombre]));

// "14:00" -> "2:00 p. m."
export const horaLegible = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
};

type Props = {
  resumen: ResumenCartera;
  // Día: sin ventas por día ni días y horas con más citas (un solo día no da para eso)
  esDia: boolean;
  comparar: Comparar;
  onCambiarComparar: (comparar: Comparar) => void;
  // Llegando el resumen con otra comparación
  actualizando: boolean;
  hoy: string;
};

// Estadísticas del período que se está viendo en la cartera del administrador.
// Todo sale del mismo GET /cartera/resumen: aquí solo se dibuja. Cada una es una
// tarjeta cerrada por defecto con su cifra clave a la vista.
export default function EstadisticasCartera({
  resumen,
  esDia,
  comparar,
  onCambiarComparar,
  actualizando,
  hoy,
}: Props) {
  const { colors } = useAppTheme();
  const { comparacion, ocupacion, cancelaciones, clientes } = resumen;
  const anterior = comparacion.periodoAnterior;
  const variacion = comparacion.variacionPorcentaje;

  // Texto corto de una variación: "+20%", "−5%", "Nuevo" o "Sin cambios"
  const textoVariacion = (v: number | null) =>
    v === null ? "Nuevo" : v === 0 ? "Sin cambios" : `${v > 0 ? "+" : "−"}${decimal(Math.abs(v))}%`;
  const colorVariacion = (v: number | null) =>
    v === 0 ? colors.textSecondary : v === null || v > 0 ? colors.exitoTexto : colors.peligroTexto;

  // Flecha de subida o bajada contra el período con el que se compara
  const cambio = (etiqueta: string, actual: string, antes: string, v: number | null) => {
    const sube = v === null || v > 0;
    const igual = v === 0;
    const color = colorVariacion(v);
    const voz = v === null ? "sube, antes era cero" : igual ? "sin cambios" : `${sube ? "sube" : "baja"} ${decimal(Math.abs(v))} por ciento`;
    return (
      <View
        key={etiqueta}
        accessible
        accessibilityLabel={`${etiqueta}: ${actual}, ${voz} frente al período de comparación (${antes})`}
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
          <Text style={[s.textoIndicador, { color }]}>
            {v === null ? "Nuevo" : igual ? "Sin cambios" : `${decimal(Math.abs(v))}%`}
          </Text>
        </View>
      </View>
    );
  };

  // Elegir fechas: el rango nunca queda al revés ni pasa de un año
  const cambiarTipo = (tipo: TipoComparacion) => {
    if (tipo === "personalizado") {
      // Parte del período con el que se estaba comparando
      onCambiarComparar({ tipo, desde: anterior.desde, hasta: anterior.hasta });
    } else {
      onCambiarComparar({ ...comparar, tipo });
    }
  };
  const cambiarDesde = (desde: string) => {
    const hasta =
      comparar.hasta < desde || comparar.hasta > sumarDias(desde, MAX_DIAS_COMPARAR) ? desde : comparar.hasta;
    onCambiarComparar({ tipo: "personalizado", desde, hasta });
  };
  const maxHasta =
    sumarDias(comparar.desde, MAX_DIAS_COMPARAR) < hoy ? sumarDias(comparar.desde, MAX_DIAS_COMPARAR) : hoy;
  const minimoComparar = sumarDias(hoy, -365 * ANIOS_ATRAS_COMPARAR);

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

  // Cifras clave de las tarjetas cerradas
  const mejorDia = resumen.ventasPorDia.reduce(
    (a, b) => (b.ventas > a.ventas ? b : a),
    { fecha: "", ventas: 0, citas: 0 },
  );
  const masVendido = resumen.serviciosMasVendidos[0];
  const totalClientes = clientes.nuevos + clientes.recurrentes;

  const ayuda = (texto: string) => <Text style={[s.ayuda, { color: colors.textSecondary }]}>{texto}</Text>;

  return (
    <View>
      <Text accessibilityRole="header" style={[s.tituloGrande, { color: colors.primaryText }]}>
        📊 ESTADÍSTICAS DEL PERÍODO
      </Text>

      <TarjetaDesplegable
        titulo="COMPARADO CON"
        valor={`Ventas ${textoVariacion(variacion.ventas)}`}
        colorValor={colorVariacion(variacion.ventas)}
      >
        <Desplegable
          etiqueta="Comparar con"
          ayuda="Elige con qué período se comparan las ventas, la ganancia y las citas"
          placeholder="Elige con qué comparar"
          opciones={OPCIONES_COMPARAR}
          valor={comparar.tipo}
          onCambiar={cambiarTipo}
        />
        {comparar.tipo === "personalizado" ? (
          <View>
            <Text style={[s.etiquetaRango, { color: colors.textSecondary }]}>Desde</Text>
            <SelectorDias
              seleccionado={crearDia(comparar.desde)}
              onSeleccionar={(d) => cambiarDesde(d.fechaFull)}
              desde={minimoComparar}
              hasta={hoy}
            />
            <Text style={[s.etiquetaRango, { color: colors.textSecondary }]}>Hasta</Text>
            <SelectorDias
              // Al cambiar "desde" el selector vuelve a abrir en el mes de "hasta"
              key={comparar.desde}
              seleccionado={crearDia(comparar.hasta)}
              onSeleccionar={(d) => onCambiarComparar({ ...comparar, hasta: d.fechaFull })}
              desde={comparar.desde}
              hasta={maxHasta}
            />
          </View>
        ) : null}
        <Text accessibilityLiveRegion="polite" style={[s.rangoAnterior, { color: colors.textSecondary }]}>
          {actualizando ? "Actualizando…" : textoRango(anterior.desde, anterior.hasta)}
        </Text>
        {comparacion.aviso ? (
          <Text style={[s.aviso, { color: colors.avisoTexto }]}>{comparacion.aviso}</Text>
        ) : null}
        <View style={[s.bloque, actualizando && s.actualizando]}>
          {cambio("Ventas totales", dinero(resumen.totalVentas), dinero(anterior.totalVentas), variacion.ventas)}
          {cambio(
            "Ganancia del negocio",
            dinero(resumen.gananciaNegocio),
            dinero(anterior.gananciaNegocio),
            variacion.gananciaNegocio,
          )}
          {cambio("Citas completadas", String(resumen.citasCompletadas), String(anterior.citasCompletadas), variacion.citas)}
        </View>
        {ayuda("Si el período actual aún no termina, se compara con el período completo.")}
      </TarjetaDesplegable>

      {esDia ? null : (
        <TarjetaDesplegable
          titulo="VENTAS POR DÍA"
          valor={mejorDia.ventas > 0 ? `${diaCorto(mejorDia.fecha)} · ${dinero(mejorDia.ventas)}` : "Sin ventas"}
        >
          <VentasPorDia dias={resumen.ventasPorDia} />
        </TarjetaDesplegable>
      )}

      <TarjetaDesplegable
        titulo="SERVICIOS MÁS VENDIDOS"
        valor={masVendido ? `${masVendido.nombre} · ${masVendido.cantidad}` : "Sin ventas"}
      >
        {ayuda("Cantidad vendida y total en pesos.")}
        <BarrasHorizontales
          filas={servicios}
          unidad="vendidos"
          vacio="No hay servicios vendidos en este período."
        />
      </TarjetaDesplegable>

      {esDia ? null : (
        <>
          <TarjetaDesplegable
            titulo="DÍAS CON MÁS CITAS"
            valor={ocupacion.diaMasOcupado !== null ? NOMBRE_DIA[ocupacion.diaMasOcupado] : "Sin citas"}
          >
            {ayuda(
              ocupacion.diaMasOcupado !== null
                ? `Día más ocupado: ${NOMBRE_DIA[ocupacion.diaMasOcupado]}. No cuenta las canceladas.`
                : "No cuenta las canceladas.",
            )}
            <BarrasHorizontales filas={porDia} unidad="citas" vacio="No hay citas en este período." />
          </TarjetaDesplegable>

          <TarjetaDesplegable
            titulo="HORAS CON MÁS CITAS"
            valor={ocupacion.horaMasOcupada ? horaLegible(ocupacion.horaMasOcupada) : "Sin citas"}
          >
            {ocupacion.horaMasOcupada ? ayuda(`Hora más ocupada: ${horaLegible(ocupacion.horaMasOcupada)}.`) : null}
            <BarrasHorizontales filas={porHora} unidad="citas" vacio="No hay citas en este período." />
          </TarjetaDesplegable>
        </>
      )}

      <TarjetaDesplegable
        titulo="CLIENTES NUEVOS Y RECURRENTES"
        valor={
          totalClientes === 0
            ? "Sin clientes"
            : `${clientes.nuevos} ${clientes.nuevos === 1 ? "nuevo" : "nuevos"} · ${clientes.recurrentes} ${clientes.recurrentes === 1 ? "recurrente" : "recurrentes"}`
        }
      >
        {totalClientes === 0 ? (
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
        )}
      </TarjetaDesplegable>

      <TarjetaDesplegable titulo="TICKET PROMEDIO" valor={dinero(resumen.ticketPromedio)}>
        {ayuda("Venta media por cita: ventas totales ÷ citas completadas.")}
        <Text style={[s.textoLeyenda, { color: colors.textPrimary }]}>
          {dinero(resumen.totalVentas)} en {resumen.citasCompletadas}{" "}
          {resumen.citasCompletadas === 1 ? "cita completada" : "citas completadas"}.
        </Text>
      </TarjetaDesplegable>

      <TarjetaDesplegable titulo="TASA DE CANCELACIÓN" valor={`${decimal(cancelaciones.tasaPorcentaje)}%`}>
        {ayuda("Citas canceladas sobre todas las citas del período.")}
        <Text style={[s.textoLeyenda, { color: colors.textPrimary }]}>
          {cancelaciones.canceladas} de {cancelaciones.totalCitas} citas.
        </Text>
      </TarjetaDesplegable>

      <TarjetaDesplegable titulo="PAGO A PROFESIONALES" valor={dinero(resumen.pagoProfesionales.total)}>
        <PagoProfesionales pago={resumen.pagoProfesionales} />
      </TarjetaDesplegable>
    </View>
  );
}

const s = StyleSheet.create({
  tituloGrande: { fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginTop: 30, marginBottom: 2 },
  ayuda: { fontSize: 11, marginBottom: 8 },
  vacio: { fontSize: 13, marginVertical: 6 },
  etiquetaRango: { fontSize: 12, fontWeight: "bold", marginTop: 6 },
  bloque: { marginTop: 4 },
  actualizando: { opacity: 0.5 },
  rangoAnterior: { fontSize: 12, fontWeight: "600", paddingVertical: 8 },
  aviso: { fontSize: 12, marginBottom: 6 },
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
