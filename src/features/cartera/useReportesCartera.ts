import { useCallback, useEffect, useState } from "react";
import { describirError } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { obtenerReportesCartera, PeriodoResumen, ReportesCartera } from "./api";

type Resultado = { clave: string; reportes: ReportesCartera | null; error: string | null };

// Ocupación, servicios rentables y demanda de un período. Al cambiar de período o salir
// de la pantalla, la petición anterior se cancela. Mientras llega la nueva, la pantalla
// sigue con los últimos reportes recibidos.
export function useReportesCartera(
  token: string,
  periodo: PeriodoResumen,
  desde: string,
  hasta: string,
  // Falso (ej. el filtro "Día"): no se piden los reportes
  habilitado: boolean,
) {
  const clave = periodo === "rango" ? `rango|${desde}|${hasta}` : periodo;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [bueno, setBueno] = useState<ReportesCartera | null>(null);
  // Sube al actualizar: vuelve a pedir lo mismo sin borrar lo que ya se ve
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    const controlador = new AbortController();
    obtenerReportesCartera(
      token,
      periodo,
      periodo === "rango" ? { desde, hasta } : null,
      controlador.signal,
    )
      .then((reportes) => {
        setResultado({ clave, reportes, error: null });
        setBueno(reportes);
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        setResultado({
          clave,
          reportes: null,
          error: describirError(e, { titulo: "", porDefecto: "No se pudieron cargar los reportes." })
            .mensaje,
        });
      });
    return () => controlador.abort();
  }, [token, periodo, desde, hasta, clave, version, habilitado]);

  const refrescar = useCallback(() => {
    setVersion((v) => v + 1);
    return new Promise<void>((listo) => setTimeout(listo, 700));
  }, []);

  const vigente = resultado?.clave === clave ? resultado : null;
  return {
    refrescar,
    reportes: vigente?.reportes ?? bueno,
    error: vigente?.error ?? null,
    cargando: vigente === null,
  };
}
