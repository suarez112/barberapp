import { Dia } from "@/types";

const dosDigitos = (n: number) => String(n).padStart(2, "0");

// Date -> "2026-10-11" (según la hora local del celular)
export const fechaISO = (d: Date) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;

export const hoyISO = () => fechaISO(new Date());

// Hoy en Colombia (UTC-5, sin horario de verano), como lo calcula el backend
export const hoyColombiaISO = () =>
  new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

// "2026-10-19" + 14 -> "2026-11-02"
export const sumarDias = (fecha: string, dias: number) => {
  const [y, m, d] = fecha.split("-").map(Number);
  return fechaISO(new Date(y, m - 1, d + dias));
};

// Las reservas van de hoy a 14 días después (15 días contando hoy)
export const DIAS_MAXIMOS_RESERVA = 14;

// "2026-10-15" + "09:40 AM" -> Date local
export const fechaHoraCita = (fecha: string, hora: string) => {
  const [h12, resto] = hora.split(":");
  const [min, ampm] = resto.split(" ");
  let h = parseInt(h12, 10) % 12;
  if (ampm === "PM") h += 12;
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d, h, parseInt(min, 10));
};

const FORMATO_HORA = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
});

// "2026-10-15T14:05:00Z" -> "09:05 a. m." (hora local)
export const formatearHora = (iso: string | Date) => {
  const fecha = typeof iso === "string" ? new Date(iso) : iso;
  // Intl lanza un error con fechas inválidas; toLocaleTimeString no
  return isNaN(fecha.getTime()) ? String(fecha) : FORMATO_HORA.format(fecha);
};

// Días completos entre "2026-10-01" y la fecha de referencia (nunca negativo)
export const diasTranscurridos = (fechaStr: string, referencia: Date) => {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const diferenciaMS = referencia.getTime() - new Date(y, m - 1, d).getTime();
  return Math.max(0, Math.floor(diferenciaMS / (1000 * 60 * 60 * 24)));
};

// Calendario real: los días se generan para cualquier mes, no para uno fijo
const NOMBRES_DIA = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SÁB"];
export const MESES_CORTOS = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];
export const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "2026-10-15" -> día del selector
export const crearDia = (fecha: string): Dia => {
  const [y, m, d] = fecha.split("-").map(Number);
  return {
    id: fecha,
    diaNom: NOMBRES_DIA[new Date(y, m - 1, d).getDay()],
    num: String(d),
    fechaFull: fecha,
    diaNumero: d,
  };
};

export const diaDeHoy = () => crearDia(hoyISO());

// "2026-10-15" -> "OCT"
export const mesCorto = (fecha: string) =>
  MESES_CORTOS[Number(fecha.slice(5, 7)) - 1];

export type Mes = { anio: number; mes: number }; // mes: 0 = enero

export const mesDeFecha = (fecha: string): Mes => ({
  anio: Number(fecha.slice(0, 4)),
  mes: Number(fecha.slice(5, 7)) - 1,
});

export const sumarMeses = ({ anio, mes }: Mes, cantidad: number): Mes => {
  const d = new Date(anio, mes + cantidad, 1);
  return { anio: d.getFullYear(), mes: d.getMonth() };
};

// Todos los días del mes, del 1 al último
export const diasDelMes = ({ anio, mes }: Mes): Dia[] => {
  const total = new Date(anio, mes + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) =>
    crearDia(fechaISO(new Date(anio, mes, i + 1))),
  );
};
