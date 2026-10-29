import { Ionicons } from "@expo/vector-icons";
import { colorIconoPagina, estiloBotonPagina } from "@/components/ui/estiloBotonPagina";
import { ComponentProps, useEffect, useState } from "react";
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
  horario24AMinutos,
  minutosAHora,
} from "@/utils/disponibilidad";
import { fechaISO, hoyColombiaISO, MESES_CORTOS } from "@/utils/fechas";
import { useAgenda } from "../agenda/AgendaProvider";
import { useAvisarError } from "../sesion/useAvisarError";
import { useRefrescoPanel } from "../panel/RefrescoPanel";
import {
  Bloqueo,
  CitaCalendario,
  crearBloqueo,
  eliminarBloqueo,
  NuevoBloqueo,
  obtenerCalendarioBloqueos,
} from "./api";

const NOMBRES_DIA = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SÁB"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const PASO_POR_DEFECTO = 30; // hasta que llega el intervalo del negocio
const DIA_COMPLETO = { ini: 0, fin: 24 * 60 };

type Modo = "fecha" | "semanal";
const MODOS = [
  { id: "fecha", label: "Solo ese día" },
  { id: "semanal", label: "Cada semana" },
] as const;

// Colores de la tabla (iguales en tema claro y oscuro): los bloqueos van en rojo intenso,
// sólido; el símbolo (X, ↻, ✓) los distingue entre sí. Íconos dibujados: los caracteres
// de texto se ven de tamaños distintos
type Icono = ComponentProps<typeof Ionicons>["name"];
type EstiloCelda = { fondo: string; borde: string; texto: string; simbolo: Icono };
const SOLO_ESE_DIA: EstiloCelda = { fondo: COLORES.rojo, borde: "#991B1B", texto: COLORES.blanco, simbolo: "close" };
const CADA_SEMANA: EstiloCelda = { fondo: "#B91C1C", borde: "#7F1D1D", texto: COLORES.blanco, simbolo: "refresh" };
const CON_CITA: EstiloCelda = { fondo: COLORES.verde, borde: "#14532D", texto: COLORES.blanco, simbolo: "checkmark" };
const LIBRE_OSCURO = { fondo: "#2A2A2A", borde: "#404040" };
const LIBRE_CLARO = { fondo: "#E5E7EB", borde: "#D1D5DB" };

// 750 -> "12:30" (formato 24 horas que pide el backend)
const minutosA24 = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

// Bloqueo provisional: ya se ve en la tabla, pero el servidor todavía no responde
const PREFIJO_TEMPORAL = "guardando-";
const esTemporal = (b: Bloqueo) => b.id.startsWith(PREFIJO_TEMPORAL);
let contadorTemporal = 0;

const bloqueoTemporal = (datos: NuevoBloqueo, nombre: string): Bloqueo => ({
  id: `${PREFIJO_TEMPORAL}${++contadorTemporal}`,
  barberoId: datos.barberoId,
  barberoNombre: nombre,
  tipo: datos.fecha ? "fecha" : "semanal",
  diaSemana: datos.diaSemana ?? null,
  fecha: datos.fecha ?? null,
  todoElDia: !!datos.todoElDia,
  horaInicio: datos.todoElDia ? "00:00" : datos.horaInicio,
  horaFin: datos.todoElDia ? "24:00" : datos.horaFin,
  motivo: datos.motivo ?? null,
});

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
  const { citas: citasAgenda } = useAgenda();
  const avisarError = useAvisarError();
  const [modo, setModo] = useState<Modo>("fecha");
  const [semanas, setSemanas] = useState(0); // 0 = esta semana
  const [bloqueos, setBloqueos] = useState<Bloqueo[] | null>(null);
  // Citas de la semana mostrada, con su inicio y fin reales, y el intervalo del negocio
  const [citasSemana, setCitasSemana] = useState<CitaCalendario[]>([]);
  const [paso, setPaso] = useState(PASO_POR_DEFECTO);
  // Bloqueos que se están liberando: se muestran libres mientras responde el servidor
  const [liberando, setLiberando] = useState<Set<string>>(new Set());

  const lunes = lunesDe(new Date());
  const dias: DiaTabla[] = Array.from({ length: 7 }, (_, i) => {
    const f = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + semanas * 7 + i);
    return { diaSemana: f.getDay(), diaNom: NOMBRES_DIA[f.getDay()], num: f.getDate(), fecha: fechaISO(f) };
  });
  const primero = dias[0];
  const ultimo = dias[6];
  const desdeSemana = primero.fecha;
  const hastaSemana = ultimo.fecha;

  // Bloqueos y citas de la semana mostrada. quitarTemporal: el bloqueo provisional que ya
  // confirmó el servidor. Los demás provisionales (aún guardándose) se conservan para que
  // no parpadeen.
  const traer = (quitarTemporal?: string) =>
    obtenerCalendarioBloqueos(token, desdeSemana, hastaSemana, profesional.id).then((r) => {
      setPaso(r.intervaloMinutos || PASO_POR_DEFECTO);
      setCitasSemana(r.citas.filter((c) => c.barberoId === profesional.id));
      setBloqueos((prev) => [
        ...r.bloqueos.filter((b) => b.barberoId === profesional.id),
        ...(prev ?? []).filter((b) => esTemporal(b) && b.id !== quitarTemporal),
      ]);
    });

  // Con aviso si falla; lo que ya se veía se queda
  const cargar = (quitarTemporal?: string) =>
    traer(quitarTemporal).catch((e) => {
      setBloqueos((prev) => prev ?? []);
      avisarError(e, { titulo: "No se pudieron cargar los bloqueos" });
    });

  useEffect(() => {
    // avisarError cambia en cada render
    cargar();
    // Solo cambia la semana, el profesional o la sesión
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, desdeSemana, hastaSemana, profesional.id]);

  // Se actualiza al deslizar, al volver a la app, cada 30 s y al llegar una notificación
  useRefrescoPanel(() => traer());

  const inicioNegocio = horario24AMinutos(apertura);
  const finNegocio = horario24AMinutos(cierre);
  const hoy = hoyColombiaISO();

  // Las filas siguen el intervalo del negocio, alineado al reloj (con 30: 10:00, 10:30…).
  // Empieza en la apertura y cada casilla llega hasta la siguiente fila o el cierre.
  const filas: { ini: number; fin: number }[] = [];
  for (let t = inicioNegocio; t < finNegocio; ) {
    const siguiente = Math.min((Math.floor(t / paso) + 1) * paso, finNegocio);
    filas.push({ ini: t, fin: siguiente });
    t = siguiente;
  }

  const etiquetaSemana =
    mesDe(primero.fecha) === mesDe(ultimo.fecha)
      ? `${primero.num} – ${ultimo.num} ${mesDe(ultimo.fecha)}`
      : `${primero.num} ${mesDe(primero.fecha)} – ${ultimo.num} ${mesDe(ultimo.fecha)}`;

  // Horario de ese día de la semana (sin horario guardado: el general de la semana).
  // El backend rechaza bloqueos en días cerrados o fuera de la apertura y el cierre.
  const horarioDe = (diaSemana: number) => {
    if (!horario?.length) return { ini: inicioNegocio, fin: finNegocio };
    const h = horario.find((x) => x.dia === diaSemana);
    return h?.abierto && h.apertura && h.cierre
      ? { ini: horario24AMinutos(h.apertura), fin: horario24AMinutos(h.cierre) }
      : null;
  };
  const abreEseDia = (diaSemana: number) => horarioDe(diaSemana) !== null;
  // La casilla debe empezar dentro del horario de ese día (si el cierre cae a mitad de
  // una casilla, el bloqueo llega hasta el cierre: ver finDe)
  const abiertoEn = (diaSemana: number, ini: number) => {
    const h = horarioDe(diaSemana);
    return !!h && ini >= h.ini && ini < h.fin;
  };
  const finDe = (diaSemana: number, fila: { ini: number; fin: number }) =>
    Math.min(fila.fin, horarioDe(diaSemana)?.fin ?? fila.fin);

  // Lo que se está liberando ya se ve libre
  const visibles = (bloqueos ?? []).filter((b) => !liberando.has(b.id));
  const guardandoBloqueos = (bloqueos ?? []).filter((b) => esTemporal(b) || liberando.has(b.id));

  const delDia = (dia: DiaTabla, tipo: Modo) =>
    visibles.filter((b) =>
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

  // Parte de la casilla [ini, fin) que ocupa una cita, según su duración real: de 0 a 1,
  // con dónde empieza y dónde termina. null si no hay cita.
  const coberturaCita = (fecha: string, ini: number, fin: number) => {
    let desde = fin;
    let hasta = ini;
    for (const c of citasSemana) {
      if (c.fecha !== fecha) continue;
      const ci = horario24AMinutos(c.horaInicio);
      const cf = horario24AMinutos(c.horaFin);
      if (ini >= cf || ci >= fin) continue;
      desde = Math.min(desde, Math.max(ci, ini));
      hasta = Math.max(hasta, Math.min(cf, fin));
    }
    if (hasta <= desde) return null;
    return { desde: (desde - ini) / (fin - ini), hasta: (hasta - ini) / (fin - ini) };
  };
  const hayCita = (fecha: string, ini: number, fin: number) => coberturaCita(fecha, ini, fin) !== null;

  // ¿Algún bloqueo de ese día espera la respuesta del servidor? (en el rango, si se da; o solo los de día completo)
  const guardandoEn = (dia: DiaTabla, ini = 0, fin = 24 * 60, soloDiaCompleto = false) =>
    guardandoBloqueos.some((b) => {
      if (soloDiaCompleto && !b.todoElDia) return false;
      if (b.tipo === "fecha" ? b.fecha !== dia.fecha : b.diaSemana !== dia.diaSemana) return false;
      const t = tramo(b);
      return ini < t.fin && t.ini < fin;
    });

  // Se marca al instante y se confirma con el servidor; si falla, se revierte
  const crear = async (datos: NuevoBloqueo) => {
    const provisional = bloqueoTemporal(datos, profesional.nombre);
    setBloqueos((prev) => [...(prev ?? []), provisional]);
    try {
      await crearBloqueo(token, datos);
      await cargar(provisional.id);
    } catch (e) {
      setBloqueos((prev) => (prev ?? []).filter((b) => b.id !== provisional.id));
      avisarError(e, { titulo: "No se pudo bloquear" });
    }
  };

  const quitar = async (b: Bloqueo) => {
    setLiberando((prev) => new Set(prev).add(b.id));
    try {
      await eliminarBloqueo(token, b.id);
      await cargar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo liberar" });
    } finally {
      // Si falló, el bloqueo vuelve a verse como estaba
      setLiberando((prev) => {
        const siguiente = new Set(prev);
        siguiente.delete(b.id);
        return siguiente;
      });
    }
  };

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

  const tocarCelda = (dia: DiaTabla, fila: { ini: number; fin: number }) => {
    const ini = fila.ini;
    const fin = finDe(dia.diaSemana, fila);
    if (guardandoEn(dia, ini, fin)) return; // espera la respuesta del servidor
    const otro: Modo = modo === "fecha" ? "semanal" : "fecha";
    const existente = buscarBloqueo(dia, modo, ini, fin);
    if (existente) {
      const t = tramo(existente);
      liberar(existente, t.ini === ini && t.fin === fin);
      return;
    }
    if (hayCita(dia.fecha, ini, fin)) {
      avisar("Hay una cita en ese horario", "Elige un horario libre para bloquear.", "aviso");
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
    if (guardandoEn(dia)) return;
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
        ? citasSemana.some((c) => c.fecha === dia.fecha)
        : citasAgenda.some(
            (c) =>
              c.barberoId === profesional.id &&
              c.estado === "CONFIRMADA" &&
              c.fecha >= hoy &&
              diaSemanaDe(c.fecha) === dia.diaSemana,
          );
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
  const ordenados = visibles.filter((b) => !esTemporal(b)).sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "fecha" ? -1 : 1;
    const orden =
      a.tipo === "fecha"
        ? (a.fecha ?? "").localeCompare(b.fecha ?? "")
        : (((a.diaSemana ?? 0) + 6) % 7) - (((b.diaSemana ?? 0) + 6) % 7);
    return orden || a.horaInicio.localeCompare(b.horaInicio);
  });

  // Estado de una casilla: el bloqueo de ese día, luego el semanal. La cita se dibuja
  // encima, solo en la parte de la casilla que ocupa (ver coberturaCita)
  const estadoCelda = (dia: DiaTabla, ini: number, fin: number) => {
    if (buscarBloqueo(dia, "fecha", ini, fin)) return SOLO_ESE_DIA;
    if (buscarBloqueo(dia, "semanal", ini, fin)) return CADA_SEMANA;
    return null;
  };

  const estadoDia = (dia: DiaTabla) =>
    buscarDiaCompleto(dia, "fecha") ? SOLO_ESE_DIA : buscarDiaCompleto(dia, "semanal") ? CADA_SEMANA : null;

  return (
    <View style={s.contenedor}>
      <Text style={[s.titulo, { color: colors.primaryText }]}>
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
            bloquear el día completo. Cada casilla sigue el intervalo de horarios del negocio. Las horas con
            &quot;—&quot; y los días &quot;Cerrado&quot; están fuera del horario del negocio.
          </Text>
        </>
      ) : (
        <Text style={[s.ayuda, { color: colors.textSecondary }]}>
          Estos son tus horarios bloqueados y tus citas. Solo la administradora del
          negocio puede bloquear o liberar horarios.
        </Text>
      )}

      {!bloqueos ? (
        <ActivityIndicator color={colors.primaryText} style={s.cargando} />
      ) : (
        <View
          style={[s.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <View style={s.navSemana}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Semana anterior"
              accessibilityHint="Muestra la semana anterior"
              accessibilityState={{ disabled: semanas <= 0 }}
              disabled={semanas <= 0}
              onPress={() => setSemanas(semanas - 1)}
              style={[s.flecha, estiloBotonPagina(colors, semanas > 0)]}
            >
              <Ionicons name="chevron-back" size={22} color={colorIconoPagina(colors, semanas > 0)} />
            </TouchableOpacity>
            <View style={s.centro}>
              <Text style={[s.textoSemana, { color: colors.textPrimary }]}>
                {etiquetaSemana}
              </Text>
              {guardandoBloqueos.length > 0 ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : null}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Semana siguiente"
              accessibilityHint="Muestra la semana siguiente"
              onPress={() => setSemanas(semanas + 1)}
              style={[s.flecha, estiloBotonPagina(colors, true)]}
            >
              <Ionicons name="chevron-forward" size={22} color={colorIconoPagina(colors, true)} />
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
                  // Un bloqueo que ya existía en un día cerrado se puede liberar
                  disabled={!esAdmin || (cerrado && !estilo)}
                  accessibilityRole="button"
                  accessibilityLabel={`${DIAS_LARGOS[d.diaSemana]} ${d.num}${cerrado ? ", cerrado" : estilo ? ", bloqueado" : ""}`}
                  accessibilityHint="Bloquea o libera el día completo"
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
                  {guardandoEn(d, 0, 24 * 60, true) ? (
                    <ActivityIndicator size="small" color={estilo?.texto ?? colors.primaryText} style={s.iconoDia} />
                  ) : estilo ? (
                    <Ionicons name={estilo.simbolo} size={20} color={estilo.texto} style={s.iconoDia} />
                  ) : (
                    <Text style={[s.diaNum, { color: colors.textPrimary }]}>{d.num}</Text>
                  )}
                  {cerrado ? (
                    <Text style={[s.cerrado, { color: colors.textSecondary }]}>Cerrado</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {filas.map((fila) => {
            const ini = fila.ini;
            return (
              <View key={ini} style={s.fila}>
                <View style={s.colHora}>
                  <Text style={[s.hora, { color: colors.textSecondary }]}>{minutosAHora(ini)}</Text>
                </View>
                {dias.map((d) => {
                  const fin = finDe(d.diaSemana, fila);
                  const bloqueo = estadoCelda(d, ini, fin);
                  const cita = coberturaCita(d.fecha, ini, fin);
                  const completa = !!cita && cita.desde <= 0.01 && cita.hasta >= 0.99;
                  // Una cita que llena la casilla la pinta toda; si no, solo su parte
                  const estilo = completa ? CON_CITA : bloqueo;
                  const abierto = abiertoEn(d.diaSemana, ini);
                  const guardando = guardandoEn(d, ini, fin);
                  return (
                    <TouchableOpacity
                      key={d.fecha + ini}
                      disabled={!esAdmin || (!abierto && !estilo && !cita)}
                      accessibilityRole="button"
                      accessibilityLabel={`${DIAS_LARGOS[d.diaSemana]} ${d.num}, ${minutosAHora(ini)}${guardando ? ", guardando" : cita ? ", con cita" : bloqueo ? ", bloqueado" : abierto ? ", libre" : ", cerrado"}`}
                      accessibilityHint="Bloquea o libera esta hora"
                      onPress={() => tocarCelda(d, fila)}
                      style={[
                        s.celda,
                        {
                          backgroundColor: estilo?.fondo ?? LIBRE.fondo,
                          borderColor: estilo?.borde ?? LIBRE.borde,
                        },
                        (!abierto || d.fecha < hoy) && s.apagado,
                        !abierto && !estilo && !cita && { backgroundColor: "transparent" },
                      ]}
                    >
                      {cita && !completa ? (
                        <View
                          pointerEvents="none"
                          style={[
                            s.parteCita,
                            {
                              top: `${cita.desde * 100}%`,
                              height: `${(cita.hasta - cita.desde) * 100}%`,
                              backgroundColor: CON_CITA.fondo,
                            },
                          ]}
                        />
                      ) : null}
                      {guardando ? (
                        <ActivityIndicator size="small" color={estilo?.texto ?? colors.primaryText} />
                      ) : cita ? (
                        <Ionicons name={CON_CITA.simbolo} size={16} color={CON_CITA.texto} />
                      ) : estilo ? (
                        <Ionicons name={estilo.simbolo} size={16} color={estilo.texto} />
                      ) : !abierto ? (
                        <Text style={[s.cerradoCelda, { color: colors.textSecondary }]}>—</Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      <View style={s.leyenda}>
        <ItemLeyenda color={LIBRE.fondo} borde={LIBRE.borde} texto="Libre" />
        <ItemLeyenda color="transparent" borde={LIBRE.borde} texto="— Cerrado" />
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

      <Text style={[s.titulo, s.tituloLista, { color: colors.primaryText }]}>
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
              { backgroundColor: b.tipo === "fecha" ? SOLO_ESE_DIA.fondo : CADA_SEMANA.fondo },
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
              color={colors.peligroTexto}
              etiqueta="Liberar este horario"
              onPress={() => liberar(b, false)}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

type Leyenda = { color: string; borde: string; texto: string; simbolo?: Icono };

function ItemLeyenda({ color, borde, texto, simbolo }: Leyenda) {
  const { colors } = useAppTheme();
  return (
    <View style={s.itemLeyenda}>
      <View style={[s.cuadro, { backgroundColor: color, borderColor: borde }]}>
        {simbolo ? <Ionicons name={simbolo} size={11} color={COLORES.blanco} /> : null}
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
  flecha: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
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
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 1.5,
    marginBottom: 4,
  },
  diaNom: { fontSize: 9, fontWeight: "bold" },
  diaNum: { fontSize: 14, fontWeight: "bold" },
  cerrado: { fontSize: 8, fontWeight: "bold" },
  cerradoCelda: { fontSize: 12 },
  celda: {
    overflow: "hidden",
    flex: 1,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 1.5,
    marginVertical: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  apagado: { opacity: 0.4 },
  parteCita: { position: "absolute", left: 0, right: 0 },
  iconoDia: { marginVertical: 1 },
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
