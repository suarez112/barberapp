// Tipografía común de los gráficos. El texto dentro de un <svg> no hereda la fuente de la app,
// así que se fija aquí la misma que usa react-native-web en sus <Text>.
export const FUENTE_GRAFICO =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// Tamaño de las etiquetas de los ejes y de las barras (igual que los datos de la tarjeta, 13)
export const TAM_ETIQUETA = 13;

// Ancho aproximado de un texto de ejes, para reservarle sitio y que no se corte
export const anchoTexto = (texto: string) => Math.ceil(texto.length * TAM_ETIQUETA * 0.6);
