import { useEffect, useState } from "react";
import { describirError, esEstado, registrarCausa } from "@/services/api/errores";
import { DocumentoLegal, TipoDocumento, obtenerDocumentoLegal } from "./api";
import { guardarDocumento, leerDocumentoGuardado } from "./documentosGuardados";

// Los textos casi nunca cambian: se piden una vez por cada vez que se abre la app
const cache = new Map<TipoDocumento, DocumentoLegal>();

// Lo que se sabe de un intento de carga ("politica-datos:0", "terminos:1"…)
type Estado = {
  clave: string;
  documento: DocumentoLegal | null;
  // El documento es la copia guardada en el celular, no la recién descargada
  guardado: boolean;
  error: string | null;
  // El backend contestó 404: ese documento todavía no está publicado
  noPublicado: boolean;
};

export type ResultadoDocumento = {
  documento: DocumentoLegal | null;
  guardado: boolean;
  error: string | null;
  noPublicado: boolean;
  reintentar: () => void;
};

// Descarga un documento legal (tipo null = no cargar nada). Mientras llega muestra la
// copia guardada en el celular; si no hay conexión se queda con esa copia y el error.
export function useDocumentoLegal(tipo: TipoDocumento | null): ResultadoDocumento {
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState<Estado | null>(null);

  const clave = tipo ? `${tipo}:${intento}` : "";
  const actual = estado?.clave === clave ? estado : null;
  const enMemoria = tipo ? cache.get(tipo) : undefined;

  useEffect(() => {
    if (!tipo || cache.has(tipo)) return;
    const esteIntento = `${tipo}:${intento}`;
    const controlador = new AbortController();
    let vigente = true;
    const actualizar = (cambios: (previo: Estado) => Partial<Estado>) =>
      vigente &&
      setEstado((e) => {
        const previo =
          e?.clave === esteIntento
            ? e
            : { clave: esteIntento, documento: null, guardado: false, error: null, noPublicado: false };
        return { ...previo, ...cambios(previo) };
      });

    // La copia guardada se muestra de inmediato mientras llega la versión al día
    leerDocumentoGuardado(tipo).then((doc) => {
      if (doc && !cache.has(tipo))
        actualizar((p) => (p.documento ? {} : { documento: doc, guardado: true }));
    });

    obtenerDocumentoLegal(tipo, controlador.signal)
      .then((doc) => {
        cache.set(tipo, doc);
        guardarDocumento(tipo, doc);
        actualizar(() => ({ documento: doc, guardado: false, error: null, noPublicado: false }));
      })
      .catch((e) => {
        if (controlador.signal.aborted) return;
        registrarCausa("Documento legal", e);
        actualizar(() => ({
          noPublicado: esEstado(e, 404),
          error: describirError(e, {
            titulo: "",
            porDefecto: "No se pudo cargar el documento.",
          }).mensaje,
        }));
      });
    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [tipo, intento]);

  return {
    documento: enMemoria ?? actual?.documento ?? null,
    guardado: !enMemoria && !!actual?.guardado,
    error: enMemoria ? null : (actual?.error ?? null),
    noPublicado: !enMemoria && !!actual?.noPublicado,
    reintentar: () => setIntento((n) => n + 1),
  };
}
