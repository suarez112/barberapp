import { useEffect, useState } from "react";
import { describirError } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { Cartera, obtenerCartera } from "./api";

type Resultado = { clave: string; cartera: Cartera | null; error: string | null };

// Cartera de un rango (y de un integrante si se da barberoId). activo = false no pide nada.
// Al cambiar de rango o salir de la pantalla, la petición anterior se cancela.
export function useCartera(
  token: string,
  desde: string,
  hasta: string,
  barberoId: string | null,
  activo = true,
) {
  const clave = `${desde}|${hasta}|${barberoId ?? ""}`;
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!activo) return;
    const controlador = new AbortController();
    obtenerCartera(token, desde, hasta, barberoId, controlador.signal)
      .then((cartera) => setResultado({ clave, cartera, error: null }))
      .catch((e) => {
        if (esCancelada(e)) return;
        setResultado({
          clave,
          cartera: null,
          error: describirError(e, { titulo: "", porDefecto: "No se pudo cargar la cartera." })
            .mensaje,
        });
      });
    return () => controlador.abort();
  }, [token, desde, hasta, barberoId, activo, clave]);

  // Mientras llega la respuesta del rango actual, cartera y error son null ("cargando")
  const vigente = activo && resultado?.clave === clave ? resultado : null;
  return { cartera: vigente?.cartera ?? null, error: vigente?.error ?? null };
}
