const FORMATO_PESOS = new Intl.NumberFormat("es-CO");

// 25000 -> "25.000", 5000 -> "5.000" (sin el signo; la vista decide si antepone "$").
// Los enteros se agrupan a mano: Intl en español no separa los miles de 4 cifras.
export const formatearPesos = (valor: number) =>
  Number.isInteger(valor)
    ? String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : FORMATO_PESOS.format(valor);

// "Ana" -> "ana" sin espacios extremos, para comparar textos que escriben personas
export const normalizar = (texto: string) => texto.trim().toLowerCase();

const NOMBRES_DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// [1, 2, 3, 4, 5, 6] (0 = domingo) -> "Lun, Mar, Mié, Jue, Vie, Sáb"
export const textoDiasAtencion = (dias: number[]) =>
  [...dias]
    // De lunes a domingo
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d) => NOMBRES_DIAS[d])
    .join(", ") || "—";

// Precio escrito por una persona -> número de pesos. Solo cuentan los dígitos:
// "35.000" y "$ 35000" -> 35000 (los puntos son de miles, no decimales). Vacío -> NaN
export const leerPrecio = (texto: string) => {
  const digitos = texto.replace(/\D/g, "");
  return digitos ? Number(digitos) : NaN;
};

// Lo que se ve mientras se escribe un precio: "35000" -> "35.000"
export const formatearPrecioEscrito = (texto: string) => {
  const valor = leerPrecio(texto);
  return isNaN(valor) ? "" : formatearPesos(valor);
};

// 90 -> "1 h 30 min", 60 -> "1 hora", 45 -> "45 min"
export const textoDuracion = (minutos: number) => {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  const textoHoras = resto === 0 ? (horas === 1 ? "1 hora" : `${horas} horas`) : `${horas} h`;
  return resto === 0 ? textoHoras : `${textoHoras} ${resto} min`;
};
