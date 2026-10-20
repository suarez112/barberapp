import { MESES_LARGOS, sumarDias } from "@/utils/fechas";
import { PeriodoResumen } from "./api";

export type PeriodoNavegable = Exclude<PeriodoResumen, "rango">;

// Lo que se pide al backend y lo que se muestra entre las flechas
export type Visible = {
  desde: string;
  hasta: string;
  // Consulta: el período actual completo se pide como antes ("hoy", "semana",
  // "mes"); uno anterior o recortado por el registro, como "rango"
  periodo: PeriodoResumen;
  hayAnterior: boolean;
  haySiguiente: boolean;
};

const partes = (fecha: string) => fecha.split("-").map(Number);

// Lunes de la semana de esa fecha (la semana va de lunes a domingo)
const lunesDe = (fecha: string) => {
  const [y, m, d] = partes(fecha);
  return sumarDias(fecha, -((new Date(y, m - 1, d).getDay() + 6) % 7));
};

// Primer y último día del mes, "atras" meses antes del de esa fecha
const mesDe = (fecha: string, atras: number) => {
  const [y, m] = partes(fecha);
  const inicio = new Date(y, m - 1 - atras, 1);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { inicio: iso(inicio), fin: iso(fin) };
};

// Día, semana o mes que se ve, "atras" períodos antes del actual (0 = el actual).
// Nunca pasa de hoy hacia adelante ni empieza antes del registro del negocio.
export function periodoVisible(
  periodo: PeriodoNavegable,
  atras: number,
  hoy: string,
  // undefined: todavía se está consultando; null: negocio sin fecha de registro
  registro: string | null | undefined,
): Visible {
  let inicio: string;
  let fin: string;
  if (periodo === "hoy") {
    inicio = fin = sumarDias(hoy, -atras);
  } else if (periodo === "semana") {
    inicio = sumarDias(lunesDe(hoy), -7 * atras);
    fin = sumarDias(inicio, 6);
  } else {
    ({ inicio, fin } = mesDe(hoy, atras));
  }

  const recortado = !!registro && inicio < registro;
  const desde = recortado && registro ? registro : inicio;
  // Mientras no se sepa la fecha de registro no se ofrece ir hacia atrás
  const hayAnterior = registro === undefined ? false : registro === null || inicio > registro;
  // El actual completo se pide igual que antes (la semana y el mes llegan hasta su último día)
  if (atras === 0 && !recortado) {
    return { desde, hasta: fin, periodo, hayAnterior, haySiguiente: false };
  }
  return {
    desde,
    hasta: fin > hoy ? hoy : fin,
    periodo: "rango",
    hayAnterior,
    haySiguiente: atras > 0,
  };
}

// "20 de octubre de 2026", "13 – 19 de octubre de 2026" o "28 de septiembre – 4 de octubre de 2026"
export function textoRango(desde: string, hasta: string) {
  const [y1, m1, d1] = partes(desde);
  const [y2, m2, d2] = partes(hasta);
  const mes = (m: number) => MESES_LARGOS[m - 1].toLowerCase();
  if (desde === hasta) return `${d1} de ${mes(m1)} de ${y1}`;
  if (y1 === y2 && m1 === m2) return `${d1} – ${d2} de ${mes(m2)} de ${y2}`;
  if (y1 === y2) return `${d1} de ${mes(m1)} – ${d2} de ${mes(m2)} de ${y2}`;
  return `${d1} de ${mes(m1)} de ${y1} – ${d2} de ${mes(m2)} de ${y2}`;
}
