import { API_BASE_URL } from "./config";

// El servidor respondió, pero con un error (4xx / 5xx)
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Por qué no hubo una respuesta válida del servidor
export type MotivoConexion =
  | "sin-conexion" // apagado, sin red, IP incorrecta
  | "tiempo-agotado" // el servidor no respondió a tiempo
  | "respuesta-invalida"; // respondió algo que no es la API (ej. portal cautivo)

export class ErrorDeConexion extends Error {
  constructor(
    readonly causa: unknown,
    readonly motivo: MotivoConexion = "sin-conexion",
  ) {
    super("No se pudo conectar con el servidor.");
    this.name = "ErrorDeConexion";
  }
}

// La app no pudo armar la solicitud (ej. un archivo que no se pudo leer).
// No es un problema de red: no se debe decir "sin conexión".
export class ErrorDeEnvio extends Error {
  constructor(readonly causa: unknown) {
    super("No se pudo preparar el envío.");
    this.name = "ErrorDeEnvio";
  }
}

type Opciones = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
};

const TIEMPO_LIMITE_MS = 15_000;
// Una foto en una red lenta tarda más que un JSON
const TIEMPO_LIMITE_ARCHIVOS_MS = 60_000;

// Los fallos de red llegan como TypeError (web: "Failed to fetch") o como
// FetchError de expo/fetch ("fetch failed: ..."). Cualquier otro error ocurrió
// antes de enviar, al preparar el cuerpo.
const esFalloDeRed = (error: unknown) =>
  error instanceof TypeError ||
  (error instanceof Error && /fetch failed|network/i.test(error.message));

export async function request<T>(
  ruta: string,
  { method = "GET", body, token }: Opciones = {},
): Promise<T> {
  // Un FormData (ej. una foto) se envía tal cual: fetch arma su Content-Type
  const esFormulario = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (body !== undefined && !esFormulario)
    headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  // Un servidor que no responde se corta en lugar de dejar la pantalla esperando
  const controlador = new AbortController();
  const temporizador = setTimeout(
    () => controlador.abort(),
    esFormulario ? TIEMPO_LIMITE_ARCHIVOS_MS : TIEMPO_LIMITE_MS,
  );

  let response: Response;
  let texto: string;
  try {
    response = await fetch(`${API_BASE_URL}${ruta}`, {
      method,
      headers,
      body: esFormulario
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
      signal: controlador.signal,
    });
    texto = await response.text();
  } catch (error) {
    if (controlador.signal.aborted) throw new ErrorDeConexion(error, "tiempo-agotado");
    if (esFalloDeRed(error)) throw new ErrorDeConexion(error, "sin-conexion");
    throw new ErrorDeEnvio(error);
  } finally {
    clearTimeout(temporizador);
  }

  const data = leerJSON(texto);
  if (!response.ok) {
    // Un error sin JSON (ej. página de un proxy) conserva su código de estado
    const mensaje = (data as { error?: unknown } | undefined)?.error;
    throw new ApiError(typeof mensaje === "string" ? mensaje : "", response.status);
  }
  // Una respuesta exitosa que no es JSON (ej. portal cautivo) no viene del backend
  if (data === NO_ES_JSON) throw new ErrorDeConexion(texto, "respuesta-invalida");
  return data as T;
}

const NO_ES_JSON = Symbol("NO_ES_JSON");

// Cuerpo vacío (ej. 204 No Content) → undefined
function leerJSON(texto: string): unknown {
  if (!texto.trim()) return undefined;
  try {
    return JSON.parse(texto);
  } catch {
    return NO_ES_JSON;
  }
}

// Mensaje del servidor si lo hay; si no, el texto por defecto de la pantalla
export const mensajeDeError = (error: unknown, porDefecto: string) =>
  error instanceof ApiError && error.message ? error.message : porDefecto;
