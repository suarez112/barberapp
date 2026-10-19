import { ApiError, ErrorDeConexion, ErrorDeEnvio, MotivoConexion, esCancelada } from "./http";

export type Aviso = { titulo: string; mensaje: string };

type Opciones = {
  // Título si el error no es uno de los conocidos
  titulo: string;
  // Mensaje si el servidor no envió uno
  porDefecto: string;
  // Título para 409 (ej. "Horario no disponible")
  tituloConflicto?: string;
};

const AVISOS_DE_CONEXION: Record<MotivoConexion, Aviso> = {
  "sin-conexion": {
    titulo: "Sin conexión",
    mensaje:
      "No se pudo conectar con el servidor. Revisa tu internet; si el problema sigue, puede que el servidor esté apagado. Intenta de nuevo en un momento.",
  },
  "tiempo-agotado": {
    titulo: "El servidor no responde",
    mensaje:
      "El servidor tardó demasiado en responder. Revisa tu conexión a internet e intenta de nuevo en un momento.",
  },
  "respuesta-invalida": {
    titulo: "Respuesta inesperada",
    mensaje:
      "La respuesta no llegó del servidor de la app. Si usas un wifi público, inicia sesión en él e intenta de nuevo.",
  },
};

// Convierte un error de la API en un aviso claro para la persona
export function describirError(
  error: unknown,
  { titulo, porDefecto, tituloConflicto }: Opciones,
): Aviso {
  if (error instanceof ErrorDeConexion) return AVISOS_DE_CONEXION[error.motivo];
  if (error instanceof ErrorDeEnvio) {
    return {
      titulo: "No se pudo enviar",
      mensaje: "La app no pudo leer el archivo para enviarlo. Elige la foto de nuevo e intenta otra vez.",
    };
  }
  if (!(error instanceof ApiError)) return { titulo, mensaje: porDefecto };

  const mensaje = error.message || porDefecto;
  if (error.status >= 500) {
    return {
      titulo: "Error del servidor",
      mensaje: "El servidor tuvo un problema y no pudo completar la acción. Intenta de nuevo en unos minutos.",
    };
  }
  switch (error.status) {
    case 400:
      // Ej. "La foto debe ser una imagen JPG, PNG o WEBP"
      return { titulo, mensaje };
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
    case 413:
      return {
        titulo: "Archivo muy grande",
        mensaje: error.message || "El archivo pesa más de lo permitido (máximo 5 MB).",
      };
    case 429:
      return {
        titulo: "Demasiados intentos",
        mensaje: error.message || "Espera unos minutos e intenta de nuevo.",
      };
    default:
      return { titulo, mensaje };
  }
}

export const esEstado = (error: unknown, status: number) =>
  error instanceof ApiError && error.status === status;

// Registra en la terminal lo que no viene del servidor, para poder diagnosticarlo.
// console.log y no console.error: en desarrollo console.error abre la pantalla
// roja de Expo con el texto técnico ("fetch failed: ..."), y la persona ya ve el
// aviso claro. Una petición cancelada a propósito no se registra.
export const registrarCausa = (contexto: string, error: unknown) => {
  if (esCancelada(error)) return;
  if (error instanceof ErrorDeConexion) console.log(contexto, error.motivo, String(error.causa));
  else if (error instanceof ErrorDeEnvio) console.error(contexto, error.causa);
};
