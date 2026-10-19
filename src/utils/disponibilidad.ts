import { BloqueoHorario, Empresa, HorarioOcupado, Servicio } from "../types";
import { fechaISO } from "./fechas";

// Cada cuántos minutos puede empezar una cita
export const INTERVALO_MIN = 15;

// Duración que se usa si una cita antigua no tiene guardada su duración
const DURACION_POR_DEFECTO = 40;

// "09:00" -> 540 (minutos desde la medianoche)
export const horario24AMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// "09:40 AM" -> 580
export const horaAMinutos = (hora: string) => {
  const [h12, resto] = hora.split(":");
  const [min, ampm] = resto.split(" ");
  let h = parseInt(h12) % 12;
  if (ampm === "PM") h += 12;
  return h * 60 + parseInt(min);
};

// 580 -> "09:40 AM"
export const minutosAHora = (total: number) => {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

// "40 min" -> 40
export const duracionEnMinutos = (texto?: string) => {
  const n = parseInt(texto ?? "", 10);
  return isNaN(n) || n <= 0 ? 30 : n;
};

// "2026-10-15" -> 4 (0 = domingo … 6 = sábado)
export const diaSemanaDe = (fecha: string) => {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
};

// ¿Este bloqueo aplica a ese día? Se repite cada semana; los antiguos son de un solo día.
export const bloqueoAplicaEseDia = (b: BloqueoHorario, fecha: string) =>
  b.fecha ? b.fecha === fecha : b.diaSemana === diaSemanaDe(fecha);

// Apertura y cierre de esa fecha según el horario de cada día; null si cierra.
// Sin horario por día (datos antiguos) se usa el horario general.
export const horarioDelDia = (
  empresa: Pick<Empresa, "horarioApertura" | "horarioCierre" | "horario">,
  fecha: string,
): { apertura: string; cierre: string } | null => {
  if (!empresa.horario?.length)
    return { apertura: empresa.horarioApertura, cierre: empresa.horarioCierre };
  const dia = empresa.horario.find((h) => h.dia === diaSemanaDe(fecha));
  if (!dia?.abierto || !dia.apertura || !dia.cierre) return null;
  return { apertura: dia.apertura, cierre: dia.cierre };
};

type Parametros = {
  empresa: Pick<Empresa, "horarioApertura" | "horarioCierre" | "horario">;
  barberoId: string;
  servicio: Servicio;
  fecha: string; // "2026-10-15"
  citas: HorarioOcupado[];
  bloqueos: BloqueoHorario[];
  // Duración del servicio más corto del negocio (para saber qué espacio ya no sirve)
  duracionMinimaServicios?: number;
};

type Tramo = { ini: number; fin: number };

// Aprovechar huecos: de las horas posibles, descarta las que dejan un espacio libre
// (antes o después del servicio) donde ya no cabe ningún servicio.
// Los espacios menores a INTERVALO_MIN son inevitables por la grilla y no cuentan.
const filtrarHuecos = (
  candidatos: number[],
  ocupados: Tramo[],
  apertura: number,
  cierre: number,
  duracion: number,
  duracionMinima: number,
  minutosAhora: number,
): number[] => {
  const inutil = (g: number) =>
    g >= INTERVALO_MIN && g < duracionMinima ? g : 0;

  // Lo que ya pasó hoy se trata como tiempo ocupado
  const bloqueado = [...ocupados];
  if (minutosAhora >= 0) bloqueado.push({ ini: 0, fin: minutosAhora });
  bloqueado.sort((a, b) => a.ini - b.ini);

  // Tramos libres entre lo ocupado
  const tramos: Tramo[] = [];
  let cursor = apertura;
  for (const b of bloqueado) {
    if (b.ini > cursor)
      tramos.push({ ini: cursor, fin: Math.min(b.ini, cierre) });
    cursor = Math.max(cursor, b.fin);
  }
  if (cursor < cierre) tramos.push({ ini: cursor, fin: cierre });

  const resultado: number[] = [];
  for (const t of tramos) {
    const delTramo = candidatos
      .filter((c) => c >= t.ini && c + duracion <= t.fin)
      .map((c) => ({
        c,
        desperdicio: inutil(c - t.ini) + inutil(t.fin - (c + duracion)),
      }));
    if (delTramo.length === 0) continue;

    const buenas = delTramo.filter((x) => x.desperdicio === 0);
    if (buenas.length > 0) {
      resultado.push(...buenas.map((x) => x.c));
    } else {
      // Ninguna hora deja el tramo perfecto: se ofrecen las que menos desperdician
      // para no esconder un hueco donde sí cabe un servicio
      const minimo = Math.min(...delTramo.map((x) => x.desperdicio));
      resultado.push(
        ...delTramo.filter((x) => x.desperdicio === minimo).map((x) => x.c),
      );
    }
  }
  return resultado.sort((a, b) => a - b);
};

// Devuelve la lista de horas en las que SÍ se puede empezar el servicio.
export const obtenerHorariosDisponibles = ({
  empresa,
  barberoId,
  servicio,
  fecha,
  citas,
  bloqueos,
  duracionMinimaServicios,
}: Parametros): string[] => {
  const delDia = horarioDelDia(empresa, fecha);
  if (!delDia) return []; // el negocio no abre ese día
  const apertura = horario24AMinutos(delDia.apertura);
  const cierre = horario24AMinutos(delDia.cierre);
  const duracion = duracionEnMinutos(servicio.duracion);

  // 1. Juntamos todo el tiempo ocupado de ese profesional ese día
  const ocupados: { ini: number; fin: number }[] = [];

  citas.forEach((c) => {
    if (
      c.barberoId === barberoId &&
      c.fecha === fecha &&
      c.estado !== "CANCELADA"
    ) {
      const ini = horaAMinutos(c.hora);
      ocupados.push({
        ini,
        fin: ini + (c.duracionMin ?? DURACION_POR_DEFECTO),
      });
    }
  });

  bloqueos.forEach((b) => {
    if (b.barberoId === barberoId && bloqueoAplicaEseDia(b, fecha)) {
      ocupados.push({
        ini: horario24AMinutos(b.horaInicio),
        fin: horario24AMinutos(b.horaFin),
      });
    }
  });

  // 2. Si es hoy, no ofrecemos horas que ya pasaron
  const ahora = new Date();
  const hoyStr = fechaISO(ahora);
  const minutosAhora =
    fecha === hoyStr ? ahora.getHours() * 60 + ahora.getMinutes() : -1;

  // 3. Probamos cada inicio posible (cada 15 minutos)
  let candidatos: number[] = [];
  for (
    let inicio = apertura;
    inicio + duracion <= cierre; // el servicio debe terminar antes del cierre
    inicio += INTERVALO_MIN
  ) {
    if (inicio <= minutosAhora) continue;

    const fin = inicio + duracion;
    // se cruza si empieza antes de que termine el otro y termina después de que empiece
    const seCruza = ocupados.some((o) => inicio < o.fin && o.ini < fin);

    if (!seCruza) candidatos.push(inicio);
  }

  // Aprovechar huecos: siempre activo
  candidatos = filtrarHuecos(
    candidatos,
    ocupados,
    apertura,
    cierre,
    duracion,
    Math.min(duracionMinimaServicios ?? duracion, duracion),
    minutosAhora,
  );

  return candidatos.map(minutosAHora);
};
