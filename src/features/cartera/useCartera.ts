import { useCallback, useEffect, useState } from "react";
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
  // Sube al actualizar: vuelve a pedir lo mismo sin borrar lo que ya se ve
  const [version, setVersion] = useState(0);

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
  }, [token, desde, hasta, barberoId, activo, clave, version]);

  // Mientras llega la respuesta del rango actual, cartera y error son null ("cargando")
  const vigente = activo && resultado?.clave === clave ? resultado : null;
  const refrescar = useCallback(() => {
    setVersion((v) => v + 1);
    return new Promise<void>((listo) => setTimeout(listo, 700));
  }, []);
  return { cartera: vigente?.cartera ?? null, error: vigente?.error ?? null, refrescar };
}
