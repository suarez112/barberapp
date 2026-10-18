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
  peligro: "#EF4444",
  peligroOscuro: "#7F1D1D",
  peligroSuave: "#FECACA",
  exito: "#166534",
  info: "#1E3A8A",
  cancelado: "#991B1B",
  advertencia: "#F59E0B",
  inactivo: "#854D0E",
  neutro: "#333",
  apagado: "#737373",
  whatsapp: "#25D366",
} as const;

export const crearPaleta = (
  tema: Tema,
  empresa: Pick<Empresa, "colorPrimario" | "colorSecundario"> | null,
): Paleta => {
  const esOscuro = tema === "OSCURO";
  return {
    bg: esOscuro
      ? (empresa?.colorSecundario ?? COLORES.secundarioPorDefecto)
      : "#F3F4F6",
    headerBg: esOscuro ? "#1A1A1A" : "#FFFFFF",
    cardBg: esOscuro ? "#171717" : "#FFFFFF",
    cardBorder: esOscuro ? "#262626" : "#E5E7EB",
    textPrimary: esOscuro ? "#FFFFFF" : "#111827",
    textSecondary: esOscuro ? "#A3A3A3" : "#6B7280",
    primary: empresa?.colorPrimario ?? COLORES.primarioPorDefecto,
    cardSelectedBg: esOscuro ? "#262419" : "#FEF9C3",
    inputBg: esOscuro ? "#171717" : "#FFFFFF",
    bottomBarBg: esOscuro ? "#141414" : "#FFFFFF",
  };
};
