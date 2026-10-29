import type { Paleta } from "@/theme/paleta";

// Aspecto común de los botones "Anterior / Siguiente" y de las flechas de paginación:
// borde y fondo de botón; apagado, se ve claramente inactivo (sin borde de color, más tenue).
export const estiloBotonPagina = (colors: Paleta, habilitado: boolean) => ({
  borderWidth: 1,
  borderRadius: 8,
  borderColor: habilitado ? colors.inputBorder : colors.cardBorder,
  backgroundColor: habilitado ? colors.cardBg : colors.bg,
  opacity: habilitado ? 1 : 0.45,
});

export const colorIconoPagina = (colors: Paleta, habilitado: boolean) =>
  habilitado ? colors.primaryText : colors.textSecondary;
