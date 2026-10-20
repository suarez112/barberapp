import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import SelectorDias from "@/components/ui/SelectorDias";
import { useAppTheme } from "@/theme/ThemeProvider";
import { crearDia, fechaLarga, hoyColombiaISO, sumarDias } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import { PeriodoResumen, ProfesionalResumen } from "./api";
import ProyeccionCartera from "./ProyeccionCartera";
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

// Tablero de la cartera del administrador: totales del período, citas por
// profesional (de mayor a menor) y el detalle del profesional que se toque.
export default function TableroCartera({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const [periodo, setPeriodo] = useState<PeriodoResumen>("hoy");
  // Rango: por defecto, del primer día del mes hasta hoy
  const [desde, setDesde] = useState(() => `${hoyColombiaISO().slice(0, 8)}01`);
  const [hasta, setHasta] = useState(hoyColombiaISO);
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const { resumen, error } = useResumenCartera(token, periodo, desde, hasta);

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
        style={[s.numero, { color: destacada ? colors.primary : colors.textPrimary }]}
      >
        {valor}
      </Text>
      <Text style={[s.textoTarjeta, { color: destacada ? colors.primary : colors.textSecondary }]}>
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
          style={[s.nombreBarra, { color: activa ? colors.primary : colors.textPrimary }]}
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
            onPress={() => setPeriodo(op.valor)}
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
          <SelectorDias seleccionado={crearDia(desde)} onSeleccionar={(d) => cambiarDesde(d.fechaFull)} />
          <Text style={[s.etiquetaRango, { color: colors.textSecondary }]}>Hasta</Text>
          <SelectorDias
            // Al cambiar "desde" el selector vuelve a abrir en el mes de "hasta"
            key={desde}
            seleccionado={crearDia(hasta)}
            onSeleccionar={(d) => setHasta(d.fechaFull)}
            desde={desde}
            hasta={sumarDias(desde, MAX_DIAS_RANGO)}
          />
        </View>
      ) : null}

      {resumen ? (
        <Text style={[s.fechas, { color: colors.textSecondary }]}>
          {resumen.desde === resumen.hasta
            ? fechaLarga(resumen.desde)
            : `${fechaLarga(resumen.desde)} – ${fechaLarga(resumen.hasta)}`}
        </Text>
      ) : null}

      {error ? <Text style={s.error}>{error}</Text> : null}
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
  cargando: { marginVertical: 20 },
  error: { color: "#EF4444", fontSize: 13, marginVertical: 10 },
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
