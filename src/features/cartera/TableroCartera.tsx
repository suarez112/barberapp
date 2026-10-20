import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import SelectorDias from "@/components/ui/SelectorDias";
import { useAppTheme } from "@/theme/ThemeProvider";
import { crearDia, fechaLarga, hoyColombiaISO, sumarDias } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import { PeriodoResumen, ProfesionalResumen } from "./api";
import ProyeccionCartera from "./ProyeccionCartera";
import { periodoVisible, textoRango } from "./periodoVisible";
import { useFechaRegistro } from "./useFechaRegistro";
import { useResumenCartera } from "./useResumenCartera";

const PERIODOS: { valor: PeriodoResumen; texto: string }[] = [
  { valor: "hoy", texto: "Hoy" },
  { valor: "semana", texto: "Semana" },
  { valor: "mes", texto: "Mes" },
  { valor: "rango", texto: "Rango" },
];

// El backend acepta rangos de hasta 366 días (contando los dos extremos)
const MAX_DIAS_RANGO = 365;

const dinero = (n: number) => `$${formatearPesos(n)}`;

// Texto de las flechas según el período
const UNIDAD: Record<Exclude<PeriodoResumen, "rango">, { anterior: string; siguiente: string }> = {
  hoy: { anterior: "Día anterior", siguiente: "Día siguiente" },
  semana: { anterior: "Semana anterior", siguiente: "Semana siguiente" },
  mes: { anterior: "Mes anterior", siguiente: "Mes siguiente" },
};

// Tablero de la cartera del administrador: totales del período, citas por
// profesional (de mayor a menor) y el detalle del profesional que se toque.
export default function TableroCartera({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const [periodo, setPeriodo] = useState<PeriodoResumen>("hoy");
  // Rango: por defecto, del primer día del mes hasta hoy
  const [desde, setDesde] = useState(() => `${hoyColombiaISO().slice(0, 8)}01`);
  const [hasta, setHasta] = useState(hoyColombiaISO);
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  // Hoy, Semana y Mes: cuántos días, semanas o meses hacia atrás (0 = el actual)
  const [atras, setAtras] = useState(0);
  const registro = useFechaRegistro(token);
  const hoy = hoyColombiaISO();

  // Rango libre: entre el registro del negocio y hoy (el backend no acepta más)
  const minimo = registro ?? undefined;
  const desdeRango = minimo && desde < minimo ? minimo : desde;
  const hastaRango = hasta < desdeRango ? desdeRango : hasta > hoy ? hoy : hasta;
  const maxHasta = sumarDias(desdeRango, MAX_DIAS_RANGO) < hoy ? sumarDias(desdeRango, MAX_DIAS_RANGO) : hoy;

  const visible = periodo === "rango" ? null : periodoVisible(periodo, atras, hoy, registro);
  const consulta = visible ?? { periodo: "rango" as const, desde: desdeRango, hasta: hastaRango };
  const { resumen, error } = useResumenCartera(token, consulta.periodo, consulta.desde, consulta.hasta);

  const cambiarPeriodo = (p: PeriodoResumen) => {
    setPeriodo(p);
    setAtras(0); // al cambiar de período se vuelve al actual
  };

  const cambiarDesde = (fecha: string) => {
    setDesde(fecha);
    // "hasta" nunca queda antes de "desde" ni a más de un año
    if (hasta < fecha || hasta > sumarDias(fecha, MAX_DIAS_RANGO)) setHasta(fecha);
  };

  // Barras: de más a menos citas; a igual número, el que más vendió
  const profesionales = [...(resumen?.porProfesional ?? [])].sort(
    (a, b) => b.citas - a.citas || b.ventas - a.ventas,
  );
  const maxCitas = Math.max(1, ...profesionales.map((p) => p.citas));
  const elegido = profesionales.find((p) => p.barberoId === elegidoId) ?? null;

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
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[s.numero, { color: destacada ? colors.primaryText : colors.textPrimary }]}
      >
        {valor}
      </Text>
      <Text style={[s.textoTarjeta, { color: destacada ? colors.primaryText : colors.textSecondary }]}>
        {texto}
      </Text>
    </View>
  );

  const barra = (p: ProfesionalResumen) => {
    const activa = p.barberoId === elegidoId;
    return (
      <Pressable
        key={p.barberoId}
        accessibilityRole="button"
        accessibilityState={{ selected: activa }}
        accessibilityLabel={`${p.nombre}: ${p.citas} citas`}
        accessibilityHint={activa ? "Oculta el detalle" : "Muestra ventas y ganancia de este profesional"}
        onPress={() => setElegidoId(activa ? null : p.barberoId)}
        style={({ pressed }) => [s.filaBarra, pressed && s.presionado]}
      >
        <Text
          numberOfLines={1}
          style={[s.nombreBarra, { color: activa ? colors.primaryText : colors.textPrimary }]}
        >
          {p.nombre}
          {p.activo ? "" : " (retirado)"}
        </Text>
        <View style={[s.pista, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View
            style={[
              s.relleno,
              {
                width: `${(p.citas / maxCitas) * 100}%`,
                backgroundColor: colors.primary,
                opacity: elegidoId && !activa ? 0.45 : 1,
              },
            ]}
          />
        </View>
        <Text style={[s.valorBarra, { color: colors.textPrimary }]}>{p.citas}</Text>
      </Pressable>
    );
  };

  const detalle = (p: ProfesionalResumen) => (
    <View style={[s.detalle, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}>
      <View style={s.cabeceraDetalle}>
        <Text style={[s.tituloDetalle, { color: colors.textPrimary }]}>{p.nombre}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar detalle"
          accessibilityHint={`Oculta el detalle de ${p.nombre}`}
          onPress={() => setElegidoId(null)}
          style={s.botonCerrar}
        >
          <Text style={[s.cerrar, { color: colors.primaryText }]}>Cerrar</Text>
        </Pressable>
      </View>
      {(
        [
          ["Citas completadas", String(p.citas)],
          ["Ventas", dinero(p.ventas)],
          ["Ganancia del profesional", dinero(p.ganancia)],
          ["Para el negocio", dinero(p.ventas - p.ganancia)],
        ] as const
      ).map(([etiqueta, valor]) => (
        <View key={etiqueta} style={s.filaDetalle}>
          <Text style={[s.etiquetaDetalle, { color: colors.textSecondary }]}>{etiqueta}</Text>
          <Text style={[s.valorDetalle, { color: colors.textPrimary }]}>{valor}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View>
      <Text style={[s.titulo, { color: colors.primaryText }]}>💰 CARTERA DEL NEGOCIO</Text>

      <View style={[s.segmento, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        {PERIODOS.map((op) => (
          <Pressable
            key={op.valor}
            accessibilityRole="button"
            accessibilityState={{ selected: periodo === op.valor }}
            accessibilityLabel={op.texto}
            accessibilityHint="Cambia el periodo del tablero"
            style={[s.btnSegmento, periodo === op.valor && { backgroundColor: colors.primary }]}
            onPress={() => cambiarPeriodo(op.valor)}
          >
            <Text
              style={[s.textoSegmento, { color: periodo === op.valor ? colors.onPrimary : colors.textSecondary }]}
            >
              {op.texto}
            </Text>
          </Pressable>
        ))}
      </View>

      {periodo === "rango" ? (
        <View>
          <Text style={[s.etiquetaRango, { color: colors.textSecondary }]}>Desde</Text>
          <SelectorDias
            seleccionado={crearDia(desdeRango)}
            onSeleccionar={(d) => cambiarDesde(d.fechaFull)}
            desde={minimo}
            hasta={hoy}
          />
          <Text style={[s.etiquetaRango, { color: colors.textSecondary }]}>Hasta</Text>
          <SelectorDias
            // Al cambiar "desde" el selector vuelve a abrir en el mes de "hasta"
            key={desdeRango}
            seleccionado={crearDia(hastaRango)}
            onSeleccionar={(d) => setHasta(d.fechaFull)}
            desde={desdeRango}
            hasta={maxHasta}
          />
        </View>
      ) : null}

      {visible && periodo !== "rango" ? (
        // Flechas: atrás hasta el registro del negocio, adelante hasta el período actual
        <View style={[s.navegador, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={UNIDAD[periodo].anterior}
            accessibilityHint={
              visible.hayAnterior ? "Muestra el período anterior" : "No hay datos antes del registro del negocio"
            }
            accessibilityState={{ disabled: !visible.hayAnterior }}
            disabled={!visible.hayAnterior}
            onPress={() => setAtras((n) => n + 1)}
            style={[s.flecha, !visible.hayAnterior && s.flechaApagada]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text
            accessibilityLiveRegion="polite"
            style={[s.textoNavegador, { color: colors.textPrimary }]}
          >
            {textoRango(visible.desde, visible.hasta)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={UNIDAD[periodo].siguiente}
            accessibilityHint={visible.haySiguiente ? "Muestra el período siguiente" : "Ya estás en el período actual"}
            accessibilityState={{ disabled: !visible.haySiguiente }}
            disabled={!visible.haySiguiente}
            onPress={() => setAtras((n) => Math.max(0, n - 1))}
            style={[s.flecha, !visible.haySiguiente && s.flechaApagada]}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
      ) : (
        <Text style={[s.fechas, { color: colors.textSecondary }]}>
          {consulta.desde === consulta.hasta
            ? fechaLarga(consulta.desde)
            : `${fechaLarga(consulta.desde)} – ${fechaLarga(consulta.hasta)}`}
        </Text>
      )}

      {error ? <Text style={[s.error, { color: colors.peligroTexto }]}>{error}</Text> : null}
      {!resumen && !error ? <ActivityIndicator color={colors.primaryText} style={s.cargando} /> : null}

      {resumen ? (
        <>
          <View style={s.filaTarjetas}>
            {tarjeta(dinero(resumen.totalVentas), "Ventas totales")}
            {tarjeta(dinero(resumen.gananciaNegocio), "Ganancia del negocio", true)}
            {tarjeta(String(resumen.citasCompletadas), "Citas completadas")}
          </View>

          <Text style={[s.titulo, s.tituloSeparado, { color: colors.primaryText }]}>
            CITAS POR PROFESIONAL
          </Text>
          {profesionales.length === 0 ? (
            <Text style={[s.vacio, { color: colors.textSecondary }]}>
              No hay citas completadas en este período.
            </Text>
          ) : (
            <>
              <Text style={[s.ayuda, { color: colors.textSecondary }]}>
                Toca un profesional para ver su detalle.
              </Text>
              {profesionales.map(barra)}
              {elegido ? detalle(elegido) : null}
            </>
          )}
        </>
      ) : null}

      {periodo !== "rango" ? <ProyeccionCartera periodo={periodo} /> : null}

      <Text style={[s.nota, { color: colors.textSecondary }]}>
        La ganancia de cada cita usa el porcentaje que tenía el profesional cuando se completó.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginTop: 15, marginBottom: 10 },
  tituloSeparado: { marginTop: 22 },
  segmento: { flexDirection: "row", borderRadius: 8, borderWidth: 1, padding: 4, marginBottom: 12 },
  btnSegmento: { flex: 1, minHeight: 44, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  botonCerrar: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  textoSegmento: { fontSize: 12, fontWeight: "bold" },
  etiquetaRango: { fontSize: 12, fontWeight: "bold", marginTop: 6 },
  fechas: { fontSize: 13, textAlign: "center", marginBottom: 10 },
  navegador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  flecha: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  flechaApagada: { opacity: 0.25 },
  textoNavegador: { flex: 1, fontSize: 14, fontWeight: "bold", textAlign: "center" },
  cargando: { marginVertical: 20 },
  error: { fontSize: 13, marginVertical: 10 },
  filaTarjetas: { flexDirection: "row", gap: 8 },
  tarjeta: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  numero: { fontSize: 17, fontWeight: "bold" },
  textoTarjeta: { fontSize: 11, marginTop: 4, textAlign: "center" },
  ayuda: { fontSize: 11, marginBottom: 8 },
  vacio: { fontSize: 13, marginVertical: 6 },
  filaBarra: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  presionado: { opacity: 0.6 },
  nombreBarra: { width: 96, fontSize: 13, fontWeight: "600" },
  pista: { flex: 1, height: 18, borderRadius: 5, borderWidth: 1, overflow: "hidden" },
  relleno: { height: "100%", borderRadius: 4 },
  valorBarra: { width: 28, fontSize: 13, fontWeight: "bold", textAlign: "right" },
  detalle: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 10 },
  cabeceraDetalle: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  tituloDetalle: { fontSize: 15, fontWeight: "bold" },
  cerrar: { fontSize: 13, fontWeight: "bold" },
  filaDetalle: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  etiquetaDetalle: { fontSize: 13 },
  valorDetalle: { fontSize: 13, fontWeight: "bold" },
  nota: { fontSize: 11, marginTop: 12 },
});
