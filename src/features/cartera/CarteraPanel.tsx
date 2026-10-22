import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { fechaISO } from "@/utils/fechas";
import { listarAgenda } from "../agenda/api";
import { useAgenda } from "../agenda/AgendaProvider";
import { useRefrescoPanel } from "../panel/RefrescoPanel";
import ProyeccionCartera, { PeriodoActual } from "./ProyeccionCartera";
import TableroCartera from "./TableroCartera";
import { useCartera } from "./useCartera";

type Periodo = "DIARIO" | "SEMANAL" | "MENSUAL";

type Props = {
  token: string;
  esAdmin: boolean;
};

const PERIODO_ACTUAL: Record<Periodo, PeriodoActual> = {
  DIARIO: "hoy",
  SEMANAL: "semana",
  MENSUAL: "mes",
};

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const dinero = (n: number) => `$${n.toLocaleString("es-CO")}`;

// Calcula desde qué día hasta qué día va el periodo.
// "atras" = cuántos periodos hacia atrás (0 = el actual).
const calcularRango = (periodo: Periodo, atras: number) => {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

  if (periodo === "DIARIO") {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - atras);
    return {
      inicio: d,
      fin: d,
      etiqueta: `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`,
    };
  }

  if (periodo === "SEMANAL") {
    // Semana de lunes a domingo
    const desdeLunes = (hoy.getDay() + 6) % 7;
    const inicio = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() - desdeLunes - 7 * atras,
    );
    const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
    const etiqueta =
      inicio.getMonth() === fin.getMonth()
        ? `${inicio.getDate()}–${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`
        : `${inicio.getDate()} ${MESES[inicio.getMonth()]} – ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
    return { inicio, fin, etiqueta };
  }

  // MENSUAL
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - atras, 1);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
  return {
    inicio,
    fin,
    etiqueta: `${MESES_LARGOS[inicio.getMonth()]} ${inicio.getFullYear()}`,
  };
};

const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: "DIARIO", texto: "Diario" },
  { valor: "SEMANAL", texto: "Semanal" },
  { valor: "MENSUAL", texto: "Mensual" },
];

// Admin: tablero del negocio (TableroCartera). Integrante: su propia cartera,
// con las ventas y su comisión de las citas completadas (calculadas por el servidor).
export default function CarteraPanel({ token, esAdmin }: Props) {
  if (esAdmin) return <TableroCartera token={token} />;
  return <MiCartera token={token} />;
}

function MiCartera({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const { setCitas } = useAgenda();
  const [periodo, setPeriodo] = useState<Periodo>("DIARIO");
  const [atras, setAtras] = useState(0);

  const cambiarPeriodo = (p: Periodo) => {
    setPeriodo(p);
    setAtras(0); // al cambiar de periodo, volvemos al actual
  };

  const rango = calcularRango(periodo, atras); // lo que se está mirando
  const desde = fechaISO(rango.inicio);
  const hasta = fechaISO(rango.fin);

  // El servidor solo le devuelve lo suyo. La ganancia de cada cita usa el
  // porcentaje que tenía al completarse.
  const { cartera, error, refrescar } = useCartera(token, desde, hasta, null);
  // También la agenda: la proyección se calcula con las citas pendientes
  useRefrescoPanel(() => Promise.all([refrescar(), listarAgenda(token).then(setCitas)]));
  const propia = cartera?.porProfesional[0];

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
      <Text
        style={[
          s.textoTarjeta,
          { color: destacada ? colors.primaryText : colors.textSecondary },
          destacada && s.negrita,
        ]}
      >
        {texto}
      </Text>
    </View>
  );

  return (
    <View>
      <Text style={[s.titulo, { color: colors.primaryText }]}>💰 MI CARTERA Y GANANCIAS</Text>

      {/* Selector Diario / Semanal / Mensual */}
      <View
        style={[s.segmento, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      >
        {PERIODOS.map((op) => (
          <TouchableOpacity
            key={op.valor}
            accessibilityRole="button"
            accessibilityState={{ selected: periodo === op.valor }}
            accessibilityLabel={op.texto}
            accessibilityHint="Cambia el periodo de la cartera"
            style={[s.btnSegmento, periodo === op.valor && { backgroundColor: colors.primary }]}
            onPress={() => cambiarPeriodo(op.valor)}
          >
            <Text
              style={[
                s.textoSegmento,
                { color: periodo === op.valor ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {op.texto}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navegador: flecha izquierda = periodo anterior, derecha = volver hacia hoy */}
      <View
        style={[s.navegador, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Periodo anterior"
          accessibilityHint="Muestra el periodo anterior"
          onPress={() => setAtras(atras + 1)}
          style={s.flecha}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[s.etiquetaRango, { color: colors.textPrimary }]}>{rango.etiqueta}</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Periodo siguiente"
          accessibilityHint="Vuelve hacia el periodo actual"
          disabled={atras === 0}
          onPress={() => setAtras(atras - 1)}
          style={[s.flecha, { opacity: atras === 0 ? 0.25 : 1 }]}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={[s.infoText, { color: colors.peligroTexto }]}>{error}</Text> : null}
      {!cartera && !error ? (
        <ActivityIndicator color={colors.primaryText} style={s.cargando} />
      ) : null}

      {cartera ? (
        <View style={s.filaTarjetas}>
          {tarjeta(dinero(cartera.totalVentas), `Ventas (${cartera.totalCitas} citas)`)}
          {tarjeta(
            dinero(propia?.ganancia ?? 0),
            `Tu comisión${propia ? ` (${propia.porcentajeGanancia}%)` : ""}`,
            true,
          )}
        </View>
      ) : null}

      {/* Proyección: siempre del periodo actual */}
      <ProyeccionCartera periodo={PERIODO_ACTUAL[periodo]} />

      <Text style={[s.nota, { color: colors.textSecondary }]}>
        La ganancia de cada cita usa el porcentaje que tenía el profesional cuando se
        completó. Para ver el detalle de cada cita, revisa la pestaña Agenda.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  titulo: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginTop: 15,
    marginBottom: 10,
  },
  segmento: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  btnSegmento: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 6,
    alignItems: "center",
  },
  textoSegmento: { fontSize: 11, fontWeight: "bold" },
  navegador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  flecha: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  etiquetaRango: { fontSize: 16, fontWeight: "bold" },
  cargando: { marginVertical: 20 },
  filaTarjetas: { flexDirection: "row", gap: 10, marginTop: 4 },
  tarjeta: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  numero: { fontSize: 20, fontWeight: "bold" },
  textoTarjeta: { fontSize: 11, marginTop: 4, textAlign: "center" },
  negrita: { fontWeight: "bold" },
  infoText: { fontSize: 13, marginVertical: 10 },
  nota: { fontSize: 11, marginTop: 8 },
});
