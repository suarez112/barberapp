import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotonIcono from "@/components/ui/BotonIcono";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { Barbero } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { horaAMinutos, horario24AMinutos, minutosAHora } from "@/utils/disponibilidad";
import { fechaISO, MESES_CORTOS } from "@/utils/fechas";
import { useAgenda } from "../agenda/AgendaProvider";
import { useAvisarError } from "../sesion/useAvisarError";
import { Bloqueo, crearBloqueo, eliminarBloqueo, listarBloqueos } from "./api";

const NOMBRES_DIA = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SÁB"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const PASO = 30; // cada casilla de la tabla = 30 minutos
const DURACION_CITA_POR_DEFECTO = 40;

// Colores de la tabla (igual en tema claro y oscuro)
const BLOQUEADO = { fondo: "#854D0E", borde: "#EAB308", texto: "#FDE68A" };
const CON_CITA = { fondo: "#166534", borde: "#22C55E", texto: "#DCFCE7" };

// 750 -> "12:30" (formato 24 horas que pide el backend)
const minutosA24 = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

// Lunes de la semana de esa fecha
const lunesDe = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));

type Props = {
  token: string;
  esAdmin: boolean;
  profesional: Barbero;
  apertura: string; // "09:00"
  cierre: string; // "20:00"
};

type DiaTabla = { diaSemana: number; diaNom: string; num: number; fecha: string };

// Horario semanal de un profesional: lo bloqueado se repite cada semana el mismo día.
// La tabla muestra semanas reales con las citas de esa semana.
export default function BloqueoSemanal({ token, esAdmin, profesional, apertura, cierre }: Props) {
  const { colors } = useAppTheme();
  const { citas } = useAgenda();
  const avisarError = useAvisarError();
  const [semanas, setSemanas] = useState(0); // 0 = esta semana
  const [bloqueos, setBloqueos] = useState<Bloqueo[] | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(
    () =>
      listarBloqueos(token, esAdmin ? profesional.id : undefined)
        .then((lista) => setBloqueos(lista.filter((b) => b.barberoId === profesional.id)))
        .catch((e) => {
          setBloqueos([]);
          avisarError(e, { titulo: "No se pudieron cargar los bloqueos" });
        }),
    // avisarError cambia en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, esAdmin, profesional.id],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const inicioNegocio = horario24AMinutos(apertura);
  const finNegocio = horario24AMinutos(cierre);

  // Las filas de la tabla: una cada 30 minutos entre apertura y cierre
  const filas: number[] = [];
  for (let t = inicioNegocio; t < finNegocio; t += PASO) filas.push(t);

  const lunes = lunesDe(new Date());
  const dias: DiaTabla[] = Array.from({ length: 7 }, (_, i) => {
    const f = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + semanas * 7 + i);
    return { diaSemana: f.getDay(), diaNom: NOMBRES_DIA[f.getDay()], num: f.getDate(), fecha: fechaISO(f) };
  });
  const primero = dias[0];
  const ultimo = dias[6];
  const mes = (fecha: string) => MESES_CORTOS[Number(fecha.slice(5, 7)) - 1];
  const etiquetaSemana =
    mes(primero.fecha) === mes(ultimo.fecha)
      ? `${primero.num} – ${ultimo.num} ${mes(ultimo.fecha)}`
      : `${primero.num} ${mes(primero.fecha)} – ${ultimo.num} ${mes(ultimo.fecha)}`;

  // ¿Hay un bloqueo que toque este rango de tiempo ese día de la semana?
  const buscarBloqueo = (diaSemana: number, ini: number, fin: number) =>
    bloqueos?.find(
      (b) =>
        b.diaSemana === diaSemana &&
        ini < horario24AMinutos(b.horaFin) &&
        horario24AMinutos(b.horaInicio) < fin,
    );

  const buscarBloqueoDiaCompleto = (diaSemana: number) =>
    bloqueos?.find(
      (b) =>
        b.diaSemana === diaSemana &&
        horario24AMinutos(b.horaInicio) <= inicioNegocio &&
        horario24AMinutos(b.horaFin) >= finNegocio,
    );

  const citasActivas = citas.filter(
    (c) => c.barberoId === profesional.id && c.estado === "CONFIRMADA",
  );

  // ¿Hay una cita pendiente que ocupe este rango de tiempo?
  const hayCita = (fecha: string, ini: number, fin: number) =>
    citasActivas.some((c) => {
      if (c.fecha !== fecha) return false;
      const ci = horaAMinutos(c.hora);
      const cf = ci + (c.duracionMin ?? DURACION_CITA_POR_DEFECTO);
      return ini < cf && ci < fin;
    });

  // Ejecuta una acción con el servidor y recarga la lista
  const ejecutar = async (accion: () => Promise<unknown>, titulo: string) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      await accion();
      await cargar();
    } catch (e) {
      avisarError(e, { titulo });
    } finally {
      setOcupado(false);
    }
  };

  const crear = (diaSemana: number, desde: number, hasta: number) =>
    ejecutar(
      () =>
        crearBloqueo(token, {
          barberoId: profesional.id,
          diaSemana,
          horaInicio: minutosA24(desde),
          horaFin: minutosA24(hasta),
        }),
      "No se pudo bloquear",
    );

  const liberar = async (b: Bloqueo) => {
    const ok = await confirmar({
      titulo: "Liberar horario",
      mensaje: `¿Liberar el bloqueo de ${minutosAHora(horario24AMinutos(b.horaInicio))} a ${minutosAHora(horario24AMinutos(b.horaFin))} de todos los ${DIAS_LARGOS[b.diaSemana]}?`,
      textoConfirmar: "Sí, liberar",
    });
    if (ok) ejecutar(() => eliminarBloqueo(token, b.id), "No se pudo liberar");
  };

  const tocarCelda = (dia: DiaTabla, ini: number) => {
    const fin = ini + PASO;
    const existente = buscarBloqueo(dia.diaSemana, ini, fin);
    if (existente) {
      liberar(existente);
      return;
    }
    if (hayCita(dia.fecha, ini, fin)) {
      avisar("Hay una cita", "Ese espacio ya tiene una cita agendada.");
      return;
    }
    crear(dia.diaSemana, ini, fin);
  };

  const tocarDia = async (dia: DiaTabla) => {
    const existente = buscarBloqueoDiaCompleto(dia.diaSemana);
    if (existente) {
      liberar(existente);
      return;
    }
    if (citasActivas.some((c) => c.fecha === dia.fecha)) {
      avisar(
        "Ese día tiene citas",
        "Hay citas agendadas ese día. Bloquea solo los espacios libres.",
      );
      return;
    }
    const ok = await confirmar({
      titulo: "Bloquear día completo",
      mensaje: `¿Bloquear todos los ${DIAS_LARGOS[dia.diaSemana]}? Los clientes no podrán reservar ese día con ${profesional.nombre}.`,
      textoConfirmar: "Sí, bloquear",
    });
    if (ok) crear(dia.diaSemana, inicioNegocio, finNegocio);
  };

  // Lista ordenada de lunes a domingo
  const ordenados = [...(bloqueos ?? [])].sort(
    (a, b) =>
      ((a.diaSemana + 6) % 7) - ((b.diaSemana + 6) % 7) ||
      a.horaInicio.localeCompare(b.horaInicio),
  );

  return (
    <View style={s.contenedor}>
      <Text style={[s.titulo, { color: colors.primary }]}>
        HORARIO DE {profesional.nombre.toUpperCase()}
      </Text>

      <Text style={[s.ayuda, { color: colors.textSecondary }]}>
        Horario del negocio: {minutosAHora(inicioNegocio)} a {minutosAHora(finNegocio)}.
        Cada casilla es de 30 minutos. Lo que bloquees se repite cada semana ese mismo
        día y no se ofrece a los clientes. Toca una casilla para bloquearla o liberarla,
        o toca el día de arriba para bloquear el día completo.
      </Text>

      {!bloqueos ? (
        <ActivityIndicator color={colors.primary} style={s.cargando} />
      ) : (
        <View
          style={[s.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <View style={s.navSemana}>
            <TouchableOpacity
              accessibilityLabel="Semana anterior"
              disabled={semanas <= 0}
              onPress={() => setSemanas(semanas - 1)}
              style={{ opacity: semanas <= 0 ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </TouchableOpacity>
            <View style={s.centro}>
              <Text style={[s.textoSemana, { color: colors.textPrimary }]}>
                {etiquetaSemana}
              </Text>
              {ocupado ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            </View>
            <TouchableOpacity
              accessibilityLabel="Semana siguiente"
              onPress={() => setSemanas(semanas + 1)}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={s.fila}>
            <View style={s.colHora} />
            {dias.map((d) => {
              const bloqueado = !!buscarBloqueoDiaCompleto(d.diaSemana);
              return (
                <TouchableOpacity
                  key={d.fecha}
                  accessibilityLabel={`Bloquear o liberar el ${DIAS_LARGOS[d.diaSemana]} completo`}
                  onPress={() => tocarDia(d)}
                  style={[
                    s.cabDia,
                    {
                      backgroundColor: bloqueado ? BLOQUEADO.fondo : colors.inputBg,
                      borderColor: bloqueado ? BLOQUEADO.borde : colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[s.diaNom, { color: bloqueado ? BLOQUEADO.texto : colors.textSecondary }]}
                  >
                    {d.diaNom}
                  </Text>
                  <Text
                    style={[s.diaNum, { color: bloqueado ? BLOQUEADO.texto : colors.textPrimary }]}
                  >
                    {d.num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filas.map((ini) => (
            <View key={ini} style={s.fila}>
              <View style={s.colHora}>
                <Text style={[s.hora, { color: colors.textSecondary }]}>{minutosAHora(ini)}</Text>
              </View>
              {dias.map((d) => {
                const conCita = hayCita(d.fecha, ini, ini + PASO);
                const bloqueado = !!buscarBloqueo(d.diaSemana, ini, ini + PASO);
                const estilo = conCita ? CON_CITA : bloqueado ? BLOQUEADO : null;
                return (
                  <TouchableOpacity
                    key={d.fecha + ini}
                    onPress={() => tocarCelda(d, ini)}
                    style={[
                      s.celda,
                      {
                        backgroundColor: estilo?.fondo ?? colors.inputBg,
                        borderColor: estilo?.borde ?? colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[s.simbolo, { color: estilo?.texto }]}>
                      {conCita ? "✓" : bloqueado ? "↻" : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <View style={s.leyenda}>
        <ItemLeyenda color={colors.inputBg} borde={colors.cardBorder} texto="Libre" />
        <ItemLeyenda color={BLOQUEADO.fondo} borde={BLOQUEADO.borde} texto="↻ Bloqueado cada semana" />
        <ItemLeyenda color={CON_CITA.fondo} borde={CON_CITA.borde} texto="✓ Con cita" />
      </View>

      <Text style={[s.titulo, s.tituloLista, { color: colors.primary }]}>
        BLOQUEOS ACTIVOS ({ordenados.length})
      </Text>
      {bloqueos && ordenados.length === 0 ? (
        <TextoInfo>No hay horarios bloqueados.</TextoInfo>
      ) : null}
      {ordenados.map((b) => (
        <View
          key={b.id}
          style={[s.itemLista, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <Text style={[s.textoLista, { color: colors.textPrimary }]}>
            Cada {DIAS_LARGOS[b.diaSemana]} · {minutosAHora(horario24AMinutos(b.horaInicio))} a{" "}
            {minutosAHora(horario24AMinutos(b.horaFin))}
            {b.motivo ? ` · ${b.motivo}` : ""}
          </Text>
          <BotonIcono
            icono="trash-outline"
            color={COLORES.peligro}
            etiqueta="Liberar este horario"
            onPress={() => liberar(b)}
          />
        </View>
      ))}
    </View>
  );
}

function ItemLeyenda({ color, borde, texto }: { color: string; borde: string; texto: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={s.itemLeyenda}>
      <View style={[s.cuadro, { backgroundColor: color, borderColor: borde }]} />
      <Text style={[s.textoLeyenda, { color: colors.textSecondary }]}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { marginTop: 10 },
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 },
  tituloLista: { marginTop: 16 },
  ayuda: { fontSize: 11, lineHeight: 15, marginBottom: 10 },
  cargando: { marginVertical: 20 },
  tarjeta: { borderRadius: 10, borderWidth: 1, padding: 8 },
  navSemana: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  centro: { flexDirection: "row", alignItems: "center", gap: 8 },
  textoSemana: { fontSize: 14, fontWeight: "bold", letterSpacing: 1 },
  fila: { flexDirection: "row", alignItems: "center" },
  colHora: { width: 52, justifyContent: "center" },
  hora: { fontSize: 9 },
  cabDia: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 1.5,
    marginBottom: 4,
  },
  diaNom: { fontSize: 9, fontWeight: "bold" },
  diaNum: { fontSize: 14, fontWeight: "bold" },
  celda: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 1.5,
    marginVertical: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  simbolo: { fontSize: 11 },
  leyenda: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  itemLeyenda: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 14, marginBottom: 6 },
  cuadro: { width: 14, height: 14, borderRadius: 3, borderWidth: 1 },
  textoLeyenda: { fontSize: 10 },
  itemLista: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  textoLista: { fontSize: 12, flex: 1 },
});
