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

// No se pudo hablar con el servidor (apagado, sin red, IP incorrecta)
export class ErrorDeConexion extends Error {
  constructor(readonly causa: unknown) {
    super("No se pudo conectar con el servidor.");
    this.name = "ErrorDeConexion";
  }
}

type Opciones = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
};

export async function request<T>(
  ruta: string,
  { method = "GET", body, token }: Opciones = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ErrorDeConexion(error);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      typeof data?.error === "string" ? data.error : "",
      response.status,
    );
  }
  return data as T;
}

// Mensaje del servidor si lo hay; si no, el texto por defecto de la pantalla
export const mensajeDeError = (error: unknown, porDefecto: string) =>
  error instanceof ApiError && error.message ? error.message : porDefecto;
