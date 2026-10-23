import { ApiError, ErrorDeConexion, ErrorDeEnvio, MotivoConexion, esCancelada, esFuncionNoIncluida } from "./http";

export type Aviso = { titulo: string; mensaje: string };

type Opciones = {
  // Título para los errores de datos (400) y los que no se reconocen
  titulo: string;
  // Mensaje si el servidor no envió uno
  porDefecto: string;
  // Título para 409 (ej. "Horario no disponible"); por defecto "No disponible"
  tituloConflicto?: string;
  // Título para 401: en un login son datos incorrectos, no una sesión vencida
  tituloNoAutorizado?: string;
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

// Convierte un error de la API en un aviso claro para la persona. El título
// siempre sale del tipo de error (sin red, 401, 402, 403, 409, 5xx…), y el
// mensaje del servidor o de la pantalla, para que los dos digan lo mismo.
export function describirError(
  error: unknown,
  { titulo, porDefecto, tituloConflicto, tituloNoAutorizado }: Opciones,
): Aviso {
  if (error instanceof ErrorDeConexion) return AVISOS_DE_CONEXION[error.motivo];
  if (error instanceof ErrorDeEnvio) {
    return {
      titulo: "No se pudo enviar",
      mensaje: "La app no pudo leer el archivo para enviarlo. Elige la foto de nuevo e intenta otra vez.",
    };
  }
  // Un fallo de la app (no del servidor): nunca se adivina la causa
  if (!(error instanceof ApiError)) {
    return { titulo: "Algo salió mal", mensaje: "No se pudo completar la acción. Intenta de nuevo." };
  }

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
      return {
        titulo: tituloNoAutorizado ?? "Sesión vencida",
        mensaje: error.message || "Inicia sesión de nuevo.",
      };
    case 402:
      // A un empleado el backend siempre le dice que el negocio está inactivo
      return {
        titulo: mensaje.startsWith("Este negocio está inactivo")
          ? "Negocio inactivo"
          : "Suscripción vencida",
        mensaje,
      };
    case 403:
      // El nivel no incluye la función: el título dice desde qué nivel se puede usar
      if (esFuncionNoIncluida(error)) {
        return {
          titulo: error.datos?.planRequerido
            ? `Disponible desde el nivel ${error.datos.planRequerido.nombre}`
            : "Función no incluida",
          mensaje,
        };
      }
      return {
        titulo: "Sin permiso",
        mensaje: error.message || "No tienes permiso para hacer esto.",
      };
    case 404:
      return { titulo: "No encontrado", mensaje };
    case 409:
      return { titulo: tituloConflicto ?? "No disponible", mensaje };
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
