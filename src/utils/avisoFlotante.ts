// Aviso corto que flota abajo y se va solo (ej. "Copiado"); no pide tocar nada.
// AvisoFlotanteHost, montado una sola vez en AppProviders, lo muestra.

export type AvisoFlotante = { id: number; texto: string };

const DURACION_MS = 2000;

let actual: AvisoFlotante | null = null;
let siguienteId = 1;
let temporizador: ReturnType<typeof setTimeout> | null = null;
const oyentes = new Set<() => void>();

const notificar = () => oyentes.forEach((oyente) => oyente());

export const suscribirAvisoFlotante = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

export const avisoFlotanteActual = () => actual;

// Muestra el texto unos segundos; uno nuevo reemplaza al anterior
export const mostrarAvisoFlotante = (texto: string) => {
  if (temporizador) clearTimeout(temporizador);
  actual = { id: siguienteId++, texto };
  notificar();
  temporizador = setTimeout(() => {
    actual = null;
    temporizador = null;
    notificar();
  }, DURACION_MS);
};
