import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES_GRAFICOS } from "@/theme/paleta";

// Colores de los gráficos del superadmin (definidos en la paleta). Cada barra o columna además
// lleva su nombre escrito, así que el color nunca es lo único que la identifica.

export function useColoresGrafico() {
  const { esOscuro } = useAppTheme();
  const paleta: readonly string[] = esOscuro ? COLORES_GRAFICOS.oscuro : COLORES_GRAFICOS.claro;
  // Se repite si hay más series que colores
  return { paleta, color: (i: number) => paleta[i % paleta.length] };
}
