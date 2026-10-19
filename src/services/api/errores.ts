import { ApiError, ErrorDeConexion } from "./http";

export type Aviso = { titulo: string; mensaje: string };

type Opciones = {
  // Título si el error no es uno de los conocidos
  titulo: string;
  // Mensaje si el servidor no envió uno
  porDefecto: string;
  // Título para 409 (ej. "Horario no disponible")
  tituloConflicto?: string;
};

// Convierte un error de la API en un aviso claro para la persona
export function describirError(
  error: unknown,
  { titulo, porDefecto, tituloConflicto }: Opciones,
): Aviso {
  if (error instanceof ErrorDeConexion) {
    return {
      titulo: "Error de conexión",
      mensaje: "No se pudo conectar con el servidor. Revisa tu internet e intenta de nuevo.",
    };
  }
  if (!(error instanceof ApiError)) return { titulo, mensaje: porDefecto };

  const mensaje = error.message || porDefecto;
  switch (error.status) {
    case 401:
      return { titulo: "Sesión vencida", mensaje: error.message || "Inicia sesión de nuevo." };
    case 402:
      return { titulo: "Prueba gratuita terminada", mensaje };
    case 403:
      return {
        titulo: "Sin permiso",
        mensaje: error.message || "No tienes permiso para hacer esto.",
      };
    case 409:
      return { titulo: tituloConflicto ?? titulo, mensaje };
    default:
      return { titulo, mensaje };
  }
}

export const esEstado = (error: unknown, status: number) =>
  error instanceof ApiError && error.status === status;
