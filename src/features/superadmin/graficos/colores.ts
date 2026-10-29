import { useAppTheme } from "@/theme/ThemeProvider";

// Paleta de varios colores para los gráficos del superadmin, una versión por tema.
// Tonos de fuerza parecida para que ninguno domine; cada barra o columna además lleva su
// nombre escrito, así que el color nunca es lo único que la identifica.
const CLARO = ["#2563EB", "#0D9488", "#D97706", "#7C3AED", "#DB2777", "#16A34A", "#0891B2", "#64748B"];
const OSCURO = ["#60A5FA", "#2DD4BF", "#FBBF24", "#A78BFA", "#F472B6", "#4ADE80", "#22D3EE", "#94A3B8"];

export function useColoresGrafico() {
  const { esOscuro } = useAppTheme();
  const paleta = esOscuro ? OSCURO : CLARO;
  // Se repite si hay más series que colores
  return { paleta, color: (i: number) => paleta[i % paleta.length] };
}
