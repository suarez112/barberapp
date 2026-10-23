import { request } from "../../services/api/http";

// Política de Tratamiento de Datos, Términos y Condiciones y Aviso de privacidad corto
// vigentes (Ley 1581 de 2012)

export type TipoDocumento = "politica-datos" | "terminos" | "aviso-privacidad";

export type DocumentoLegal = {
  tipo: "politica_datos" | "terminos" | "aviso_privacidad";
  version: string;
  titulo: string;
  contenido: string; // markdown
  publicadoEn: string;
};

// Lo que exige el backend en el registro y en la reserva como invitado
export type Aceptacion = { aceptaPoliticaDatos: true; aceptaTerminos: true };

export const ACEPTACION: Aceptacion = { aceptaPoliticaDatos: true, aceptaTerminos: true };

// Si el servidor no contesta en 10 s se muestra el error con "Reintentar"
const TIEMPO_LIMITE_MS = 10_000;

export const obtenerDocumentoLegal = (tipo: TipoDocumento, signal?: AbortSignal) =>
  request<DocumentoLegal>(`/api/v1/legal/${tipo}`, { signal, tiempoLimiteMs: TIEMPO_LIMITE_MS });

// Estado de la aceptación de quien tiene sesión (administrador, equipo o cliente)
export type EstadoLegal = {
  vigente: boolean;
  versionPolitica: string;
  versionTerminos: string;
};

export const obtenerEstadoLegal = (token: string, signal?: AbortSignal) =>
  request<EstadoLegal>("/api/v1/legal/estado", { token, signal, tiempoLimiteMs: TIEMPO_LIMITE_MS });

export const aceptarVersionVigente = (token: string) =>
  request<EstadoLegal & { mensaje: string }>("/api/v1/legal/aceptar", {
    method: "POST",
    body: ACEPTACION,
    token,
  });
