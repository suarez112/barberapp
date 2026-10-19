import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotonIcono from "@/components/ui/BotonIcono";
import Selector from "@/components/ui/Selector";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { Barbero, DiaHorario } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import {
  diaSemanaDe,
  horaAMinutos,
  horario24AMinutos,
  minutosAHora,
} from "@/utils/disponibilidad";
import { fechaISO, hoyColombiaISO, MESES_CORTOS } from "@/utils/fechas";
import { useAgenda } from "../agenda/AgendaProvider";
import { useAvisarError } from "../sesion/useAvisarError";
import { Bloqueo, crearBloqueo, eliminarBloqueo, listarBloqueos, NuevoBloqueo } from "./api";

const NOMBRES_DIA = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SÁB"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const PASO = 30; // cada casilla de la tabla = 30 minutos
const DURACION_CITA_POR_DEFECTO = 40;
const DIA_COMPLETO = { ini: 0, fin: 24 * 60 };

type Modo = "fecha" | "semanal";
const MODOS = [
  { id: "fecha", label: "Solo ese día" },
  { id: "semanal", label: "Cada semana" },
] as const;

// Colores de la tabla (igual en tema claro y oscuro)
const SOLO_ESE_DIA = { fondo: "#7F1D1D", borde: "#EF4444", texto: "#FECACA", simbolo: "✕" };
const CADA_SEMANA = { fondo: "#7C2D12", borde: "#F97316", texto: "#FED7AA", simbolo: "↻" };
const CON_CITA = { fondo: "#166534", borde: "#22C55E", texto: "#DCFCE7", simbolo: "✓" };
const LIBRE_OSCURO = { fondo: "#2A2A2A", borde: "#404040" };
const LIBRE_CLARO = { fondo: "#E5E7EB", borde: "#D1D5DB" };

// 750 -> "12:30" (formato 24 horas que pide el backend)
const minutosA24 = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

// Lunes de la semana de esa fecha
const lunesDe = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));

const mesDe = (fecha: string) => MESES_CORTOS[Number(fecha.slice(5, 7)) - 1];

// "2026-10-21" -> "miércoles 21 oct"
const fechaCorta = (fecha: string) => {
  const [y, m, d] = fecha.split("-").map(Number);
  return `${DIAS_LARGOS[new Date(y, m - 1, d).getDay()]} ${d} ${mesDe(fecha).toLowerCase()}`;
};

const tramo = (b: Bloqueo) =>
  b.todoElDia
    ? DIA_COMPLETO
    : { ini: horario24AMinutos(b.horaInicio), fin: horario24AMinutos(b.horaFin) };

const textoHoras = (b: Bloqueo) =>
  b.todoElDia
    ? "todo el día"
    : `${minutosAHora(horario24AMinutos(b.horaInicio))} a ${minutosAHora(horario24AMinutos(b.horaFin))}`;

type Props = {
  token: string;
  esAdmin: boolean;
  profesional: Barbero;
  apertura: string; // "09:00", apertura más temprana de la semana
  cierre: string; // "20:00", cierre más tardío de la semana
  // Horario de cada día; los días cerrados se ven apagados
  horario?: DiaHorario[];
};

type DiaTabla = { diaSemana: number; diaNom: string; num: number; fecha: string };

// Horario de un profesional por semanas reales. Solo la administradora bloquea:
// "Solo ese día" bloquea esa fecha; "Cada semana" se repite ese día todas las semanas.
// Un integrante solo ve sus bloqueos y sus citas.
export default function BloqueoSemanal({
  token,
  esAdmin,
  profesional,
  apertura,
  cierre,
  horario,
}: Props) {
  const { colors, esOscuro } = useAppTheme();
  const LIBRE = esOscuro ? LIBRE_OSCURO : LIBRE_CLARO;
  const { citas } = useAgenda();
  const avisarError = useAvisarError();
  const [modo, setModo] = useState<Modo>("fecha");
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
  const hoy = hoyColombiaISO();

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
  const etiquetaSemana =
    mesDe(primero.fecha) === mesDe(ultimo.fecha)
      ? `${primero.num} – ${ultimo.num} ${mesDe(ultimo.fecha)}`
      : `${primero.num} ${mesDe(primero.fecha)} – ${ultimo.num} ${mesDe(ultimo.fecha)}`;

  const abreEseDia = (diaSemana: number) =>
    !horario?.length || !!horario.find((h) => h.dia === diaSemana)?.abierto;

  const delDia = (dia: DiaTabla, tipo: Modo) =>
    (bloqueos ?? []).filter((b) =>
      b.tipo === "fecha" ? tipo === "fecha" && b.fecha === dia.fecha : tipo === "semanal" && b.diaSemana === dia.diaSemana,
    );

  // Bloqueo de ese tipo que toca este rango de tiempo ese día
  const buscarBloqueo = (dia: DiaTabla, tipo: Modo, ini: number, fin: number) =>
    delDia(dia, tipo).find((b) => {
      const t = tramo(b);
      return ini < t.fin && t.ini < fin;
    });

  const buscarDiaCompleto = (dia: DiaTabla, tipo: Modo) =>
    delDia(dia, tipo).find((b) => {
      const t = tramo(b);
      return b.todoElDia || (t.ini <= inicioNegocio && t.fin >= finNegocio);
    });

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

  const crear = (datos: NuevoBloqueo) =>
    ejecutar(() => crearBloqueo(token, datos), "No se pudo bloquear");

  const quitar = (b: Bloqueo) =>
    ejecutar(() => eliminarBloqueo(token, b.id), "No se pudo liberar");

  const describir = (b: Bloqueo) =>
    b.tipo === "fecha"
      ? `el ${fechaCorta(b.fecha ?? "")}, ${textoHoras(b)}`
      : `todos los ${DIAS_LARGOS[b.diaSemana ?? 0]}, ${textoHoras(b)}`;

  // Un bloqueo de una sola casilla se libera directo; uno más grande pide confirmación
  const liberar = async (b: Bloqueo, soloEstaCasilla: boolean) => {
    if (!soloEstaCasilla) {
      const ok = await confirmar({
        titulo: "Liberar horario",
        mensaje: `¿Liberar el bloqueo de ${describir(b)}?`,
      });
      if (!ok) return;
    }
    quitar(b);
  };

  const avisarOtroModo = (tipo: Modo) =>
    avisar(
      tipo === "semanal" ? "Bloqueado cada semana" : "Bloqueado solo ese día",
      `Este horario tiene un bloqueo "${tipo === "semanal" ? "Cada semana" : "Solo ese día"}". Cambia a ese modo arriba para liberarlo.`,
    );

  const tocarCelda = (dia: DiaTabla, ini: number) => {
    const fin = ini + PASO;
    const otro: Modo = modo === "fecha" ? "semanal" : "fecha";
    const existente = buscarBloqueo(dia, modo, ini, fin);
    if (existente) {
      const t = tramo(existente);
      liberar(existente, t.ini === ini && t.fin === fin);
      return;
    }
    if (hayCita(dia.fecha, ini, fin)) {
      avisar("Hay una cita", "Ese espacio ya tiene una cita agendada.");
      return;
    }
    if (buscarBloqueo(dia, otro, ini, fin)) {
      avisarOtroModo(otro);
      return;
    }
    if (modo === "fecha" && dia.fecha < hoy) {
      avisar("Ese día ya pasó", "Solo puedes bloquear desde hoy en adelante.");
      return;
    }
    const horas = { horaInicio: minutosA24(ini), horaFin: minutosA24(fin) };
    crear(
      modo === "fecha"
        ? { barberoId: profesional.id, fecha: dia.fecha, ...horas }
        : { barberoId: profesional.id, diaSemana: dia.diaSemana, ...horas },
    );
  };

  const tocarDia = async (dia: DiaTabla) => {
    const existente = buscarDiaCompleto(dia, modo);
    if (existente) {
      liberar(existente, false);
      return;
    }
    if (modo === "fecha" && dia.fecha < hoy) {
      avisar("Ese día ya pasó", "Solo puedes bloquear desde hoy en adelante.");
      return;
    }
    const conCitas =
      modo === "fecha"
        ? citasActivas.some((c) => c.fecha === dia.fecha)
        : citasActivas.some((c) => c.fecha >= hoy && diaSemanaDe(c.fecha) === dia.diaSemana);
    if (conCitas) {
      avisar(
        "Ese día tiene citas",
        "Hay citas agendadas ese día. Bloquea solo los espacios libres.",
      );
      return;
    }
    const ok = await confirmar({
      titulo: "Bloquear día completo",
      mensaje:
        modo === "fecha"
          ? `¿Bloquear el ${fechaCorta(dia.fecha)} completo? Los clientes no podrán reservar ese día con ${profesional.nombre}.`
          : `¿Bloquear todos los ${DIAS_LARGOS[dia.diaSemana]}? Los clientes no podrán reservar ningún ${DIAS_LARGOS[dia.diaSemana]} con ${profesional.nombre}.`,
    });
    if (!ok) return;
    crear(
      modo === "fecha"
        ? { barberoId: profesional.id, fecha: dia.fecha, todoElDia: true }
        : { barberoId: profesional.id, diaSemana: dia.diaSemana, todoElDia: true },
    );
  };

  // Primero los de una fecha (por fecha), luego los semanales de lunes a domingo
  const ordenados = [...(bloqueos ?? [])].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "fecha" ? -1 : 1;
    const orden =
      a.tipo === "fecha"
        ? (a.fecha ?? "").localeCompare(b.fecha ?? "")
        : (((a.diaSemana ?? 0) + 6) % 7) - (((b.diaSemana ?? 0) + 6) % 7);
    return orden || a.horaInicio.localeCompare(b.horaInicio);
  });

  // Estado de una casilla: la cita manda, luego el bloqueo de ese día, luego el semanal
  const estadoCelda = (dia: DiaTabla, ini: number) => {
    const fin = ini + PASO;
    if (hayCita(dia.fecha, ini, fin)) return CON_CITA;
    if (buscarBloqueo(dia, "fecha", ini, fin)) return SOLO_ESE_DIA;
    if (buscarBloqueo(dia, "semanal", ini, fin)) return CADA_SEMANA;
    return null;
  };

  const estadoDia = (dia: DiaTabla) =>
    buscarDiaCompleto(dia, "fecha") ? SOLO_ESE_DIA : buscarDiaCompleto(dia, "semanal") ? CADA_SEMANA : null;

  return (
    <View style={s.contenedor}>
      <Text style={[s.titulo, { color: colors.primary }]}>
        HORARIO DE {profesional.nombre.toUpperCase()}
      </Text>

      {esAdmin ? (
        <>
          <Selector opciones={MODOS} valor={modo} onCambiar={setModo} />
          <Text style={[s.ayuda, { color: colors.textSecondary }]}>
            {modo === "fecha"
              ? "Solo ese día: lo que bloquees aplica únicamente a esa fecha."
              : "Cada semana: lo que bloquees se repite todas las semanas ese mismo día."}{" "}
            Toca una hora para bloquearla o liberarla, o toca el día de arriba para
            bloquear el día completo. Cada casilla es de 30 minutos.
          </Text>
        </>
      ) : (
        <Text style={[s.ayuda, { color: colors.textSecondary }]}>
          Estos son tus horarios bloqueados y tus citas. Solo la administradora del
          negocio puede bloquear o liberar horarios.
        </Text>
      )}

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
              const estilo = estadoDia(d);
              const cerrado = !abreEseDia(d.diaSemana);
              return (
                <TouchableOpacity
                  key={d.fecha}
                  disabled={!esAdmin}
                  accessibilityLabel={`Bloquear o liberar el ${DIAS_LARGOS[d.diaSemana]} ${d.num} completo`}
                  onPress={() => tocarDia(d)}
                  style={[
                    s.cabDia,
                    {
                      backgroundColor: estilo?.fondo ?? LIBRE.fondo,
                      borderColor: estilo?.borde ?? LIBRE.borde,
                    },
                    (cerrado || d.fecha < hoy) && s.apagado,
                  ]}
                >
                  <Text style={[s.diaNom, { color: estilo?.texto ?? colors.textSecondary }]}>
                    {d.diaNom}
                  </Text>
                  <Text style={[s.diaNum, { color: estilo?.texto ?? colors.textPrimary }]}>
                    {estilo ? estilo.simbolo : d.num}
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
                const estilo = estadoCelda(d, ini);
                return (
                  <TouchableOpacity
                    key={d.fecha + ini}
                    disabled={!esAdmin}
                    accessibilityLabel={`${DIAS_LARGOS[d.diaSemana]} ${d.num}, ${minutosAHora(ini)}`}
                    onPress={() => tocarCelda(d, ini)}
                    style={[
                      s.celda,
                      {
                        backgroundColor: estilo?.fondo ?? LIBRE.fondo,
                        borderColor: estilo?.borde ?? LIBRE.borde,
                      },
                      (!abreEseDia(d.diaSemana) || d.fecha < hoy) && s.apagado,
                    ]}
                  >
                    <Text style={[s.simbolo, { color: estilo?.texto }]}>{estilo?.simbolo ?? ""}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      )}

      <View style={s.leyenda}>
        <ItemLeyenda color={LIBRE.fondo} borde={LIBRE.borde} texto="Libre" />
        {[
          { estilo: SOLO_ESE_DIA, texto: "Solo ese día" },
          { estilo: CADA_SEMANA, texto: "Cada semana" },
          { estilo: CON_CITA, texto: "Con cita" },
        ].map(({ estilo, texto }) => (
          <ItemLeyenda
            key={texto}
            color={estilo.fondo}
            borde={estilo.borde}
            simbolo={estilo.simbolo}
            texto={texto}
          />
        ))}
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
          <View
            style={[
              s.marca,
              { backgroundColor: b.tipo === "fecha" ? SOLO_ESE_DIA.borde : CADA_SEMANA.borde },
            ]}
          />
          <Text style={[s.textoLista, { color: colors.textPrimary }]}>
            {b.tipo === "fecha"
              ? `Solo el ${fechaCorta(b.fecha ?? "")}`
              : `Cada ${DIAS_LARGOS[b.diaSemana ?? 0]}`}{" "}
            · {textoHoras(b)}
            {b.motivo ? ` · ${b.motivo}` : ""}
          </Text>
          {esAdmin ? (
            <BotonIcono
              icono="trash-outline"
              color={COLORES.peligro}
              etiqueta="Liberar este horario"
              onPress={() => liberar(b, false)}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

type Leyenda = { color: string; borde: string; texto: string; simbolo?: string };

function ItemLeyenda({ color, borde, texto, simbolo }: Leyenda) {
  const { colors } = useAppTheme();
  return (
    <View style={s.itemLeyenda}>
      <View style={[s.cuadro, { backgroundColor: color, borderColor: borde }]}>
        {simbolo ? <Text style={s.simboloLeyenda}>{simbolo}</Text> : null}
      </View>
      <Text style={[s.textoLeyenda, { color: colors.textSecondary }]}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  contenedor: { marginTop: 10 },
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 },
  tituloLista: { marginTop: 16 },
  ayuda: { fontSize: 11, lineHeight: 15, marginVertical: 10 },
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
  apagado: { opacity: 0.4 },
  simbolo: { fontSize: 12, fontWeight: "bold" },
  leyenda: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  itemLeyenda: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 14, marginBottom: 6 },
  cuadro: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  simboloLeyenda: { fontSize: 10, fontWeight: "bold", color: COLORES.blanco },
  textoLeyenda: { fontSize: 11 },
  itemLista: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  marca: { width: 4, alignSelf: "stretch", borderRadius: 2 },
  textoLista: { fontSize: 12, flex: 1 },
});
