import { useCallback, useEffect, useState } from "react";
import { describirError } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { obtenerReportesAvanzados, PeriodoResumen, ReportesAvanzados } from "./api";

type Resultado = { clave: string; reportes: ReportesAvanzados | null; error: string | null };

// Mejores clientes, retención y tendencia de un período. Se piden solo si el plan los incluye
// (`habilitado`). Mientras llega un período nuevo, se siguen viendo los últimos recibidos.
export function useReportesAvanzados(
  token: string,
  periodo: PeriodoResumen,
  desde: string,
  hasta: string,
  habilitado: boolean,
) {
  const clave = periodo === "rango" ? `rango|${desde}|${hasta}` : periodo;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [bueno, setBueno] = useState<ReportesAvanzados | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    const controlador = new AbortController();
    obtenerReportesAvanzados(
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
          error: describirError(e, { titulo: "", porDefecto: "No se pudieron cargar los reportes." }).mensaje,
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
