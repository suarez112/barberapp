// Datos de la app en un solo lugar: el nombre y el lema se cambian aquí y se ven en la
// animación de inicio, la barra superior, "Acerca de" y el panel del superadministrador.
export const APP_NOMBRE = "Agendality";
export const APP_LEMA = "Citas simples, negocios eficientes";

// Página web de cada negocio: <base>/<CÓDIGO> (ej. https://agendality.com/INFINITY)
export const ENLACE_PUBLICO_BASE = "https://agendality.com";
export const enlacePublicoDe = (codigo: string) =>
  `${ENLACE_PUBLICO_BASE}/${codigo}`;

// "Contacto" en Ayuda. Reemplaza el valor de ejemplo por el correo real del desarrollador.
// Un correo vacío ("") oculta la sección.
export const CONTACTO = {
  correo: "soporte@agendality.com",
};
