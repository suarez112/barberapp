import { useEffect, useState } from "react";
import { describirError } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { obtenerResumenCartera, PeriodoResumen, ResumenCartera } from "./api";

type Resultado = { clave: string; resumen: ResumenCartera | null; error: string | null };

// Resumen de la cartera de un período (con rango: desde y hasta).
// Al cambiar de período o salir de la pantalla, la petición anterior se cancela.
export function useResumenCartera(
  token: string,
  periodo: PeriodoResumen,
  desde: string,
  hasta: string,
) {
  const clave = periodo === "rango" ? `rango|${desde}|${hasta}` : periodo;
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerResumenCartera(
      token,
      periodo,
      periodo === "rango" ? { desde, hasta } : null,
      controlador.signal,
    )
      .then((resumen) => setResultado({ clave, resumen, error: null }))
      .catch((e) => {
        if (esCancelada(e)) return;
        setResultado({
          clave,
          resumen: null,
          error: describirError(e, { titulo: "", porDefecto: "No se pudo cargar la cartera." })
            .mensaje,
        });
      });
    return () => controlador.abort();
  }, [token, periodo, desde, hasta, clave]);

  // Mientras llega la respuesta del período actual, resumen y error son null ("cargando")
  const vigente = resultado?.clave === clave ? resultado : null;
  return { resumen: vigente?.resumen ?? null, error: vigente?.error ?? null };
}
