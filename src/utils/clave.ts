// Reglas de una contraseña nueva: las mismas del backend (claveNueva)
export const CLAVE_MIN = 8;
export const CLAVE_MAX = 64;

export const MENSAJE_CLAVE =
  "La contraseña debe tener entre 8 y 64 caracteres e incluir una mayúscula, una minúscula, un número y un carácter especial.";

export const REQUISITOS_CLAVE: { texto: string; cumple: (clave: string) => boolean }[] = [
  { texto: "8 caracteres o más", cumple: (c) => c.length >= CLAVE_MIN },
  { texto: "Una letra mayúscula", cumple: (c) => /\p{Lu}/u.test(c) },
  { texto: "Una letra minúscula", cumple: (c) => /\p{Ll}/u.test(c) },
  { texto: "Un número", cumple: (c) => /\p{N}/u.test(c) },
  // Especial = ni letra, ni número, ni espacio
  { texto: "Un carácter especial (ej: ! @ # $ ?)", cumple: (c) => /[^\p{L}\p{N}\s]/u.test(c) },
];

export const claveValida = (clave: string) =>
  clave.length <= CLAVE_MAX && REQUISITOS_CLAVE.every((r) => r.cumple(clave));
