import { request } from "../../services/api/http";

// Política de Tratamiento de Datos y Términos y Condiciones vigentes (Ley 1581 de 2012)

export type TipoDocumento = "politica-datos" | "terminos";

export type DocumentoLegal = {
  tipo: "politica_datos" | "terminos";
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
