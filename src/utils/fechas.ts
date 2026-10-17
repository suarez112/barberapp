const dosDigitos = (n: number) => String(n).padStart(2, "0");

// Date -> "2026-10-11" (según la hora local del celular)
export const fechaISO = (d: Date) =>
  `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;

export const hoyISO = () => fechaISO(new Date());

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
export const formatearHora = (iso: string | Date) =>
  FORMATO_HORA.format(typeof iso === "string" ? new Date(iso) : iso);

// Días completos entre "2026-10-01" y la fecha de referencia (nunca negativo)
export const diasTranscurridos = (fechaStr: string, referencia: Date) => {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const diferenciaMS = referencia.getTime() - new Date(y, m - 1, d).getTime();
  return Math.max(0, Math.floor(diferenciaMS / (1000 * 60 * 60 * 24)));
};
