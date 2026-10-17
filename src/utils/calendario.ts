import { Linking } from "react-native";

// Datos que ya guarda la ventana de confirmación de la cita
export interface DatosCalendario {
  negocio: string;
  profesional: string;
  servicio: string;
  duracionMin: number;
  fecha: string; // "2026-10-15"
  hora: string; // "12:20 PM"
}

const dosDigitos = (n: number) => String(n).padStart(2, "0");

// Convierte fecha + hora en el formato que pide Google Calendar: 20261015T122000
const formatoCalendario = (d: Date) =>
  `${d.getFullYear()}${dosDigitos(d.getMonth() + 1)}${dosDigitos(d.getDate())}` +
  `T${dosDigitos(d.getHours())}${dosDigitos(d.getMinutes())}00`;

export const urlAgregarAlCalendario = (datos: DatosCalendario) => {
  const [h12, resto] = datos.hora.split(":");
  const [min, ampm] = resto.split(" ");
  let h = parseInt(h12) % 12;
  if (ampm === "PM") h += 12;
  const [y, m, d] = datos.fecha.split("-").map(Number);

  const inicio = new Date(y, m - 1, d, h, parseInt(min));
  const fin = new Date(inicio.getTime() + (datos.duracionMin || 30) * 60000);

  const parametros = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(`${datos.servicio} - ${datos.negocio}`)}`,
    `dates=${formatoCalendario(inicio)}/${formatoCalendario(fin)}`,
    `details=${encodeURIComponent(`Cita con ${datos.profesional}`)}`,
    `location=${encodeURIComponent(datos.negocio)}`,
  ].join("&");

  return `https://calendar.google.com/calendar/render?${parametros}`;
};

export const agregarAlCalendario = (datos: DatosCalendario) =>
  Linking.openURL(urlAgregarAlCalendario(datos));
