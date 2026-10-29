import { BloqueoHorario, Empresa } from "../types";

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
