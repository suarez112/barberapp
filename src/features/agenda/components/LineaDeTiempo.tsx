import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES, textoSobre } from "@/theme/paleta";
import { BloqueoHorario, Cita } from "@/types";
import { bloqueoAplicaEseDia, horaAMinutos, horario24AMinutos } from "@/utils/disponibilidad";
import { hoyISO } from "@/utils/fechas";
import { ESTADO_CITA } from "./TarjetaCita";

type Props = {
  fecha: string;
  // Apertura y cierre de ese día ("09:00"); null si el negocio cierra
  horario: { apertura: string; cierre: string } | null;
  citas: Cita[];
  bloqueos: BloqueoHorario[];
  citaResaltadaId?: string | null;
  onAbrirCita: (c: Cita) => void;
};

const PX_POR_MIN = 1.4; // 30 min = 42 px
const PASO = 30; // marca cada 30 minutos
const ANCHO_HORAS = 58;
const DURACION_POR_DEFECTO = 30; // si la cita no trae su duración

type Bloque = { cita: Cita; ini: number; fin: number; col: number; cols: number };

// "09:00 AM" -> "9:00 AM"; las medias horas van sin AM/PM
const textoMarca = (min: number) => {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const base = `${h12}:${String(m).padStart(2, "0")}`;
  return m === 0 ? `${base} ${h24 >= 12 ? "PM" : "AM"}` : base;
};

// Reparte en columnas las citas que se cruzan en el tiempo (ej. una cancelada y otra nueva a la misma hora)
function acomodar(citas: Cita[]): Bloque[] {
  const orden = citas
    .map((cita) => {
      const ini = horaAMinutos(cita.hora);
      return { cita, ini, fin: ini + (cita.duracionMin && cita.duracionMin > 0 ? cita.duracionMin : DURACION_POR_DEFECTO) };
    })
    .sort((a, b) => a.ini - b.ini || a.fin - b.fin);

  const resultado: Bloque[] = [];
  let grupo: Bloque[] = [];
  let finGrupo = -1;
  let finColumnas: number[] = [];
  const cerrarGrupo = () => {
    grupo.forEach((b) => (b.cols = finColumnas.length));
    resultado.push(...grupo);
    grupo = [];
    finColumnas = [];
  };
  for (const o of orden) {
    if (grupo.length > 0 && o.ini >= finGrupo) cerrarGrupo();
    let col = finColumnas.findIndex((fin) => fin <= o.ini);
    if (col === -1) {
      col = finColumnas.length;
      finColumnas.push(o.fin);
    } else finColumnas[col] = o.fin;
    grupo.push({ ...o, col, cols: 1 });
    finGrupo = Math.max(finGrupo, o.fin);
  }
  if (grupo.length > 0) cerrarGrupo();
  return resultado;
}

// Agenda del día en vertical: cada cita ocupa desde su inicio hasta su fin
export default function LineaDeTiempo({
  fecha,
  horario,
  citas,
  bloqueos,
  citaResaltadaId = null,
  onAbrirCita,
}: Props) {
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const [ahora, setAhora] = useState(() => new Date());

  // La línea roja de la hora actual avanza sola
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const bloques = acomodar(citas);
  const franjas = bloqueos
    .filter((b) => bloqueoAplicaEseDia(b, fecha))
    .map((b, i) => ({
      id: String(i),
      ini: b.todoElDia ? 0 : horario24AMinutos(b.horaInicio),
      fin: b.todoElDia ? 24 * 60 : horario24AMinutos(b.horaFin),
    }));

  // Rango visible: la jornada del día; si hay una cita fuera de ella, se amplía para que se vea
  const apertura = horario ? horario24AMinutos(horario.apertura) : 0;
  const cierre = horario ? horario24AMinutos(horario.cierre) : 0;
  let desde = horario ? apertura : Infinity;
  let hasta = horario ? cierre : -Infinity;
  for (const b of bloques) {
    desde = Math.min(desde, b.ini);
    hasta = Math.max(hasta, b.fin);
  }
  desde = Math.floor(desde / PASO) * PASO;
  hasta = Math.min(24 * 60, Math.ceil(hasta / PASO) * PASO);

  const esHoy = fecha === hoyISO();
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const yDe = (min: number) => (min - desde) * PX_POR_MIN;
  const altoTotal = Math.max(0, hasta - desde) * PX_POR_MIN;
  const altoVisible = Math.max(320, Math.round(height * 0.62));

  // Al abrir (o cambiar de día) queda cerca de la hora actual, o de la primera cita
  const inicioCitas = bloques.length > 0 ? bloques[0].ini : null;
  const objetivo = esHoy && minAhora >= desde && minAhora <= hasta ? minAhora : inicioCitas ?? desde;
  const acomodarScroll = () =>
    scroll.current?.scrollTo({ y: Math.max(0, yDe(objetivo) - 90), animated: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(acomodarScroll, [fecha, desde, hasta]);

  if (desde >= hasta) {
    return (
      <View style={[styles.vacio, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.vacioTexto, { color: colors.textSecondary }]}>
          El negocio está cerrado este día.
        </Text>
      </View>
    );
  }

  const marcas: number[] = [];
  for (let m = desde; m <= hasta; m += PASO) marcas.push(m);

  return (
    <ScrollView
      ref={scroll}
      onLayout={acomodarScroll}
      nestedScrollEnabled
      showsVerticalScrollIndicator
      style={[
        styles.marco,
        { height: altoVisible, backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <View style={{ height: altoTotal + 24, paddingTop: 12 }}>
        <View style={{ height: altoTotal }}>
          {marcas.map((m) => {
            const entera = m % 60 === 0;
            return (
              <View key={m} style={[styles.marca, { top: yDe(m) }]} pointerEvents="none">
                <Text
                  style={[
                    styles.horaMarca,
                    { color: entera ? colors.textPrimary : colors.textSecondary, fontWeight: entera ? "bold" : "normal" },
                  ]}
                >
                  {textoMarca(m)}
                </Text>
                <View style={[styles.linea, { backgroundColor: colors.cardBorder, opacity: entera ? 1 : 0.5 }]} />
              </View>
            );
          })}

          <View style={styles.zona}>
            {franjas.map((f) => {
              const ini = Math.max(f.ini, desde);
              const fin = Math.min(f.fin, hasta);
              if (fin <= ini) return null;
              return (
                <Rayado
                  key={f.id}
                  top={yDe(ini)}
                  alto={yDe(fin) - yDe(ini)}
                  color={colors.textSecondary}
                  fondo={colors.bg}
                  borde={colors.cardBorder}
                />
              );
            })}

            {bloques.map((b) => {
              const estado = ESTADO_CITA[b.cita.estado];
              const alto = Math.max(14, (b.fin - b.ini) * PX_POR_MIN - 2);
              const compacto = alto < 34;
              const color = textoSobre(estado.color);
              return (
                <Tocable
                  key={b.cita.id}
                  onPress={() => onAbrirCita(b.cita)}
                  accessibilityRole="button"
                  accessibilityLabel={`${b.cita.hora}, ${b.cita.cliente}, ${b.cita.servicio}, ${estado.texto}`}
                  accessibilityHint="Abre el detalle de la cita"
                  hitSlop={alto < 44 ? Math.ceil((44 - alto) / 2) : 0}
                  style={[
                    styles.cita,
                    {
                      top: yDe(b.ini) + 1,
                      height: alto,
                      left: `${(b.col / b.cols) * 100}%`,
                      width: `${100 / b.cols}%`,
                      backgroundColor: estado.color,
                      borderColor: b.cita.id === citaResaltadaId ? colors.primaryText : colors.cardBg,
                      borderWidth: b.cita.id === citaResaltadaId ? 2 : 1,
                      flexDirection: compacto ? "row" : "column",
                    },
                  ]}
                >
                  <Text style={[styles.cliente, { color }]} numberOfLines={1}>
                    {b.cita.cliente}
                  </Text>
                  <Text style={[styles.servicio, { color }]} numberOfLines={1}>
                    {compacto ? ` · ${b.cita.servicio}` : b.cita.servicio}
                  </Text>
                </Tocable>
              );
            })}
          </View>

          {esHoy && minAhora >= desde && minAhora <= hasta ? (
            <View
              pointerEvents="none"
              style={[styles.ahora, { top: yDe(minAhora) }]}
              accessible
              accessibilityLabel="Hora actual"
            >
              <View style={styles.puntoAhora} />
              <View style={styles.lineaAhora} />
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

// Franja gris con rayas diagonales y la palabra "Bloqueado"
function Rayado({
  top,
  alto,
  color,
  fondo,
  borde,
}: {
  top: number;
  alto: number;
  color: string;
  fondo: string;
  borde: string;
}) {
  const [ancho, setAncho] = useState(0);
  const largo = (ancho + alto) * 2;
  const cantidad = Math.ceil((ancho + alto) / 10) + 1;
  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel="Bloqueado"
      style={[styles.bloqueo, { top, height: alto, backgroundColor: fondo, borderColor: borde }]}
    >
      {ancho > 0
        ? Array.from({ length: cantidad }, (_, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                width: 2,
                height: largo,
                left: i * 10 - alto / 2,
                top: alto / 2 - largo / 2,
                backgroundColor: color,
                opacity: 0.3,
                transform: [{ rotate: "45deg" }],
              }}
            />
          ))
        : null}
      <Text style={[styles.textoBloqueo, { color, backgroundColor: fondo }]}>Bloqueado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marco: { borderWidth: 1, borderRadius: 10, marginTop: 4 },
  vacio: { borderWidth: 1, borderRadius: 10, padding: 16, marginTop: 4 },
  vacioTexto: { fontSize: 14, textAlign: "center" },
  marca: { position: "absolute", left: 0, right: 0, height: 0, flexDirection: "row", alignItems: "center" },
  horaMarca: { width: ANCHO_HORAS, fontSize: 11, textAlign: "right", paddingRight: 6, marginTop: -2 },
  linea: { flex: 1, height: 1 },
  zona: { position: "absolute", top: 0, bottom: 0, left: ANCHO_HORAS + 4, right: 8 },
  cita: {
    position: "absolute",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  cliente: { fontSize: 12, fontWeight: "bold", flexShrink: 1 },
  servicio: { fontSize: 11, flexShrink: 1 },
  bloqueo: {
    position: "absolute",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  textoBloqueo: { fontSize: 11, fontWeight: "bold", paddingHorizontal: 6, borderRadius: 4, overflow: "hidden" },
  ahora: { position: "absolute", left: ANCHO_HORAS - 4, right: 0, height: 0, flexDirection: "row", alignItems: "center" },
  puntoAhora: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.rojo },
  lineaAhora: { flex: 1, height: 2, backgroundColor: COLORES.rojo },
});
