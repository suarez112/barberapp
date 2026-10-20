import { Empresa } from "../types";

export type Tema = "OSCURO" | "CLARO";

export type Paleta = {
  bg: string;
  headerBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  primary: string;
  // Color del negocio ajustado para leerse como texto sobre el fondo (contraste 4.5:1)
  primaryText: string;
  // Texto sobre un fondo del color del negocio (negro o blanco, el que más contraste)
  onPrimary: string;
  // Textos de estado y apagados que se leen (4.5:1) sobre el fondo y las tarjetas del tema
  peligroTexto: string;
  exitoTexto: string;
  avisoTexto: string;
  apagadoTexto: string;
  infoTexto: string;
  // Pestaña activa: fondo y texto (claro: amarillo con texto negro; oscuro: sin fondo, texto del negocio)
  seleccionBg: string;
  seleccionTexto: string;
  // Botón secundario (Cancelar, Usar mi ubicación…): fondo, borde y texto
  secundarioBg: string;
  secundarioBorde: string;
  secundarioTexto: string;
  // Borde de los campos (contraste 3:1 con el fondo)
  inputBorder: string;
  // Mensajes de error bajo los campos
  error: string;
  cardSelectedBg: string;
  inputBg: string;
  bottomBarBg: string;
};

// Colores fijos que no dependen del negocio ni del tema
export const COLORES = {
  primarioPorDefecto: "#EAB308",
  secundarioPorDefecto: "#0D0D0D",
  textoSobrePrimario: "#000",
  blanco: "#FFF",
  // Colores de estado como relleno (etiquetas, botones, celdas). Los mismos en ambos temas:
  // el texto encima sale de textoSobre() y siempre cumple 4.5:1
  rojo: "#DC2626", // bloqueado, error, cancelado, vencido
  verde: "#15803D", // activo, completado, ok
  naranja: "#F97316", // pendiente, advertencia
  azul: "#1D4ED8", // información
  neutro: "#374151", // inactivo, cerrado, suspendido
  whatsapp: "#25D366",
} as const;

// Contraste WCAG entre dos colores "#RRGGBB" o "#RGB"
const aRgb = (hex: string): number[] | null => {
  const h = hex.replace("#", "");
  const completo = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(completo)) return null;
  return completo.match(/../g)!.map((x) => parseInt(x, 16));
};
const luminancia = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a: number[], b: number[]) => {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const aHex = (rgb: number[]) =>
  `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

// Oscurece (fondo claro) o aclara (fondo oscuro) el color hasta leerse sobre el fondo
export const colorLegible = (color: string, fondo: string, minimo = 4.5) => {
  const c = aRgb(color);
  const f = aRgb(fondo);
  if (!c || !f) return color;
  const destino = luminancia(f) > 0.5 ? 0 : 255;
  for (let paso = 0; paso <= 20; paso++) {
    const mezcla = c.map((v) => v + (destino - v) * (paso / 20));
    if (contraste(mezcla, f) >= minimo) return aHex(mezcla);
  }
  return destino === 0 ? "#000000" : "#FFFFFF";
};

// Negro o blanco, el que más se lea sobre el color
export const textoSobre = (fondo: string) => {
  const f = aRgb(fondo);
  if (!f) return COLORES.textoSobrePrimario;
  return contraste([0, 0, 0], f) >= contraste([255, 255, 255], f) ? "#000000" : "#FFFFFF";
};

// Mezcla `color` con `fondo`: t = 0 deja el fondo, t = 1 deja el color
const mezclar = (color: string, fondo: string, t: number) => {
  const c = aRgb(color);
  const f = aRgb(fondo);
  if (!c || !f) return fondo;
  return aHex(f.map((v, i) => v + (c[i] - v) * t));
};

// Tema claro: fondo claro, tarjetas blancas, textos y enlaces en negro o gris oscuro;
// el color del negocio (amarillo) solo se usa como fondo de botones, pestañas y selección.
// Tema oscuro: el color del negocio también se usa como texto (ajustado a 4.5:1).
// Todos los colores del tema viven aquí: para cambiarlos, se edita solo esta función.
export const crearPaleta = (
  tema: Tema,
  empresa: Pick<Empresa, "colorPrimario" | "colorSecundario"> | null,
): Paleta => {
  const esOscuro = tema === "OSCURO";
  const primary = empresa?.colorPrimario ?? COLORES.primarioPorDefecto;
  const onPrimary = textoSobre(primary);
  const fondo = esOscuro
    ? (empresa?.colorSecundario ?? COLORES.secundarioPorDefecto)
    : "#F3F4F6";
  return {
    bg: fondo,
    headerBg: esOscuro ? "#1A1A1A" : "#FFFFFF",
    cardBg: esOscuro ? "#171717" : "#FFFFFF",
    cardBorder: esOscuro ? "#262626" : "#E5E7EB",
    textPrimary: esOscuro ? "#FFFFFF" : "#111827",
    textSecondary: esOscuro ? "#A3A3A3" : "#4B5563",
    primary,
    primaryText: esOscuro ? colorLegible(primary, "#171717") : "#111827",
    onPrimary,
    peligroTexto: esOscuro ? "#F87171" : "#B91C1C",
    exitoTexto: esOscuro ? "#4ADE80" : "#15803D",
    avisoTexto: esOscuro ? "#FB923C" : "#B45309",
    infoTexto: esOscuro ? "#60A5FA" : "#1D4ED8",
    apagadoTexto: esOscuro ? "#9CA3AF" : "#5B6470",
    inputBorder: esOscuro ? "#737373" : "#868E96",
    error: esOscuro ? "#F87171" : "#B91C1C",
    cardSelectedBg: esOscuro ? "#262419" : mezclar(primary, "#FFFFFF", 0.3),
    seleccionBg: esOscuro ? "transparent" : primary,
    seleccionTexto: esOscuro ? colorLegible(primary, "#141414") : onPrimary,
    secundarioBg: esOscuro ? "#262626" : "#FFFFFF",
    secundarioBorde: esOscuro ? "#737373" : "#6B7280",
    secundarioTexto: esOscuro ? "#FFFFFF" : "#111827",
    inputBg: esOscuro ? "#171717" : "#FFFFFF",
    bottomBarBg: esOscuro ? "#141414" : "#FFFFFF",
  };
};
