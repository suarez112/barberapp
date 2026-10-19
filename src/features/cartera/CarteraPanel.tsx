import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Desplegable from "@/components/ui/Desplegable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Barbero } from "@/types";
import { fechaISO } from "@/utils/fechas";
import { useAgenda } from "../agenda/AgendaProvider";
import { GananciaProfesional } from "./api";
import { useCartera } from "./useCartera";

type Periodo = "DIARIO" | "SEMANAL" | "MENSUAL";

type Props = {
  token: string;
  esAdmin: boolean;
  // Equipo del negocio, para que el admin elija de quién ver la cartera
  barberos: Barbero[];
  // El integrante que usa la app (null para la cuenta de la empresa)
  yoId: string | null;
};

const TODO_EL_NEGOCIO = "";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Convierte "2026-10-11" en una fecha
const aFecha = (fechaStr: string) => {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

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

// Ventas y ganancias de las citas completadas (calculadas por el servidor).
// Admin: todo el negocio y cada profesional; integrante: lo suyo.
export default function CarteraPanel({ token, esAdmin, barberos, yoId }: Props) {
  const { colors } = useAppTheme();
  const { citas } = useAgenda();
  const [periodo, setPeriodo] = useState<Periodo>("DIARIO");
  const [atras, setAtras] = useState(0);
  // Admin: de quién ver la cartera ("" = todo el negocio)
  const [verId, setVerId] = useState<string>(TODO_EL_NEGOCIO);

  const cambiarPeriodo = (p: Periodo) => {
    setPeriodo(p);
    setAtras(0); // al cambiar de periodo, volvemos al actual
  };

  const rango = calcularRango(periodo, atras); // lo que se está mirando
  const rangoActual = calcularRango(periodo, 0); // hoy / esta semana / este mes
  const desde = fechaISO(rango.inicio);
  const hasta = fechaISO(rango.fin);
  // Si el integrante elegido ya no está en el equipo, se vuelve a todo el negocio
  const elegido = esAdmin ? (barberos.find((b) => b.id === verId) ?? null) : null;

  // Total del negocio (admin) o lo propio (empleado). La ganancia de cada cita
  // usa el porcentaje que tenía al completarse.
  const { cartera, error } = useCartera(token, desde, hasta, null);
  // Admin: además, la cartera del integrante elegido (?barberoId=)
  const integrante = useCartera(token, desde, hasta, elegido?.id ?? null, !!elegido);

  const opcionesVer = [
    { valor: TODO_EL_NEGOCIO, etiqueta: "Todo el negocio" },
    ...barberos.map((b) => ({
      valor: b.id,
      etiqueta: b.id === yoId ? `${b.nombre} (tú)` : b.nombre,
    })),
  ];

  // LA PROYECCIÓN: citas confirmadas por realizar en el periodo ACTUAL
  const porRealizar = citas.filter((c) => {
    const f = aFecha(c.fecha);
    return c.estado === "CONFIRMADA" && f >= rangoActual.inicio && f <= rangoActual.fin;
  });
  const proyBruto = porRealizar.reduce((sum, c) => sum + c.precio, 0);

  const etiquetaActual =
    periodo === "DIARIO" ? "HOY" : periodo === "SEMANAL" ? "ESTA SEMANA" : "ESTE MES";

  // Un integrante solo recibe su propia fila
  const propia = !esAdmin ? cartera?.porProfesional[0] : undefined;

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
      <Text style={[s.numero, { color: destacada ? colors.primary : colors.textPrimary }]}>
        {valor}
      </Text>
      <Text
        style={[
          s.textoTarjeta,
          { color: destacada ? colors.primary : colors.textSecondary },
          destacada && s.negrita,
        ]}
      >
        {texto}
      </Text>
    </View>
  );

  // Cartera de un integrante elegido por el admin
  const carteraIntegrante = (
    nombre: string,
    fila: GananciaProfesional | undefined,
    errorFila: string | null,
    cargandoFila: boolean,
  ) => {
    if (errorFila) return <Text style={s.infoText}>{errorFila}</Text>;
    if (cargandoFila) return <ActivityIndicator color={colors.primary} style={s.cargando} />;
    return (
      <>
        <View style={[s.filaTarjetas, s.separado]}>
          {tarjeta(dinero(fila?.ventas ?? 0), `Ventas de ${nombre} (${fila?.citas ?? 0} citas)`)}
          {tarjeta(
            dinero(fila?.ganancia ?? 0),
            `Comisión${fila ? ` (${fila.porcentajeGanancia}%)` : ""}`,
            true,
          )}
        </View>
        <View style={[s.filaTarjetas, s.separado]}>
          {tarjeta(
            dinero((fila?.ventas ?? 0) - (fila?.ganancia ?? 0)),
            `Para el negocio (de ${nombre})`,
          )}
        </View>
      </>
    );
  };

  return (
    <View>
      <Text style={[s.titulo, { color: colors.primary }]}>
        💰 {esAdmin ? "CARTERA DEL NEGOCIO" : "MI CARTERA Y GANANCIAS"}
      </Text>

      {/* Selector Diario / Semanal / Mensual */}
      <View
        style={[s.segmento, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      >
        {PERIODOS.map((op) => (
          <TouchableOpacity
            key={op.valor}
            style={[s.btnSegmento, periodo === op.valor && { backgroundColor: colors.primary }]}
            onPress={() => cambiarPeriodo(op.valor)}
          >
            <Text
              style={[
                s.textoSegmento,
                { color: periodo === op.valor ? "#000" : colors.textSecondary },
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
          accessibilityLabel="Periodo anterior"
          onPress={() => setAtras(atras + 1)}
          style={s.flecha}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[s.etiquetaRango, { color: colors.textPrimary }]}>{rango.etiqueta}</Text>

        <TouchableOpacity
          accessibilityLabel="Periodo siguiente"
          disabled={atras === 0}
          onPress={() => setAtras(atras - 1)}
          style={[s.flecha, { opacity: atras === 0 ? 0.25 : 1 }]}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={s.infoText}>{error}</Text> : null}
      {!cartera && !error ? (
        <ActivityIndicator color={colors.primary} style={s.cargando} />
      ) : null}

      {cartera ? (
        <>
          <View style={s.filaTarjetas}>
            {tarjeta(dinero(cartera.totalVentas), `Ventas (${cartera.totalCitas} citas)`)}
            {esAdmin
              ? tarjeta(dinero(cartera.gananciaNegocio), "Para el negocio", true)
              : tarjeta(
                  dinero(propia?.ganancia ?? 0),
                  `Tu comisión${propia ? ` (${propia.porcentajeGanancia}%)` : ""}`,
                  true,
                )}
          </View>

          {esAdmin ? (
            <>
              <View style={[s.filaTarjetas, s.separado]}>
                {tarjeta(dinero(cartera.gananciaEquipo), "Comisiones del equipo")}
              </View>

              <Text style={[s.titulo, s.tituloSeparado, { color: colors.primary }]}>
                VER CARTERA DE
              </Text>
              <Desplegable
                titulo="Ver cartera de"
                placeholder="Todo el negocio"
                opciones={opcionesVer}
                valor={elegido?.id ?? TODO_EL_NEGOCIO}
                onCambiar={setVerId}
              />
              {elegido
                ? carteraIntegrante(
                    elegido.nombre,
                    integrante.cartera?.porProfesional[0],
                    integrante.cartera ? null : integrante.error,
                    !integrante.cartera && !integrante.error,
                  )
                : null}

              <Text style={[s.titulo, s.tituloSeparado, { color: colors.primary }]}>
                POR PROFESIONAL ({cartera.porProfesional.length})
              </Text>
              {cartera.porProfesional.length === 0 ? (
                <Text style={s.infoText}>No hay servicios completados en este periodo.</Text>
              ) : (
                cartera.porProfesional.map((p) => (
                  <View
                    key={p.barberoId}
                    style={[
                      s.filaCita,
                      { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                    ]}
                  >
                    <View style={s.flex}>
                      <Text style={[s.tituloCita, { color: colors.textPrimary }]}>
                        {p.nombre}
                        {p.activo ? "" : " (retirado)"}
                      </Text>
                      <Text style={[s.subCita, { color: colors.textSecondary }]}>
                        {p.citas} citas · Ventas {dinero(p.ventas)} · Comisión actual{" "}
                        {p.porcentajeGanancia}%
                      </Text>
                    </View>
                    <View style={s.derecha}>
                      <Text style={[s.precioCita, { color: colors.primary }]}>
                        +{dinero(p.ganancia)}
                      </Text>
                      <Text style={[s.mini, { color: colors.textSecondary }]}>Ganancia</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          ) : null}
        </>
      ) : null}

      {/* Proyección: siempre del periodo actual */}
      <Text style={[s.titulo, s.tituloProyeccion, { color: colors.primary }]}>
        📈 PROYECCIÓN · {etiquetaActual}
      </Text>

      <View style={s.filaTarjetas}>
        {tarjeta(String(porRealizar.length), "Citas por realizar")}
        {tarjeta(dinero(proyBruto), "Ventas esperadas", true)}
      </View>

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
  tituloSeparado: { marginTop: 20 },
  tituloProyeccion: { marginTop: 25 },
  segmento: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  btnSegmento: {
    flex: 1,
    paddingVertical: 8,
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
  flecha: { paddingHorizontal: 12, paddingVertical: 4 },
  etiquetaRango: { fontSize: 16, fontWeight: "bold" },
  cargando: { marginVertical: 20 },
  filaTarjetas: { flexDirection: "row", gap: 10, marginTop: 4 },
  separado: { marginTop: 10 },
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
  filaCita: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  flex: { flex: 1 },
  derecha: { alignItems: "flex-end" },
  tituloCita: { fontSize: 14, fontWeight: "bold" },
  subCita: { fontSize: 12, marginTop: 4 },
  precioCita: { fontSize: 12, fontWeight: "bold" },
  mini: { fontSize: 9 },
  infoText: { color: "#EF4444", fontSize: 13, marginVertical: 10 },
  nota: { fontSize: 11, marginTop: 8 },
});
