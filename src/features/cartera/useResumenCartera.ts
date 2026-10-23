import { useCallback, useEffect, useState } from "react";
import { describirError } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { Comparar, obtenerResumenCartera, PeriodoResumen, ResumenCartera } from "./api";

type Resultado = { base: string; clave: string; resumen: ResumenCartera | null; error: string | null };

// Resumen de la cartera de un período (con rango: desde y hasta), comparado con lo
// que elija `comparar`. Al cambiar de período o salir de la pantalla, la petición
// anterior se cancela.
export function useResumenCartera(
  token: string,
  periodo: PeriodoResumen,
  desde: string,
  hasta: string,
  // null: el plan no incluye comparar períodos
  comparar: Comparar | null,
  // Falso mientras no se sabe qué funciones incluye el plan
  habilitado = true,
) {
  const base = periodo === "rango" ? `rango|${desde}|${hasta}` : periodo;
  const clave = comparar ? `${base}|${comparar.tipo}|${comparar.desde}|${comparar.hasta}` : `${base}|sin-comparar`;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  // Último resumen recibido bien, para no dejar la pantalla vacía si falla una comparación
  const [bueno, setBueno] = useState<Resultado | null>(null);
  // Sube al actualizar: vuelve a pedir lo mismo sin borrar lo que ya se ve
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    const controlador = new AbortController();
    obtenerResumenCartera(
      token,
      periodo,
      periodo === "rango" ? { desde, hasta } : null,
      comparar && { tipo: comparar.tipo, desde: comparar.desde, hasta: comparar.hasta },
      controlador.signal,
    )
      .then((resumen) => {
        const recibido = { base, clave, resumen, error: null };
        setResultado(recibido);
        setBueno(recibido);
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        setResultado({
          base,
          clave,
          resumen: null,
          error: describirError(e, { titulo: "", porDefecto: "No se pudo cargar la cartera." })
            .mensaje,
        });
      });
    return () => controlador.abort();
  // `comparar` se compara por sus tres campos (el objeto cambia en cada render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, periodo, desde, hasta, base, clave, comparar?.tipo, comparar?.desde, comparar?.hasta, version, habilitado]);

  // Mientras llega la respuesta, resumen y error son null ("cargando"). Si solo cambió
  // la comparación se sigue mostrando el resumen anterior del mismo período, para que
  // las tarjetas abiertas no se cierren ni la pantalla parpadee.
  const vigente = resultado?.clave === clave ? resultado : null;
  const delMismoPeriodo = bueno?.base === base ? bueno : null;
  const refrescar = useCallback(() => {
    setVersion((v) => v + 1);
    return new Promise<void>((listo) => setTimeout(listo, 700));
  }, []);
  return {
    refrescar,
    resumen: vigente?.resumen ?? delMismoPeriodo?.resumen ?? null,
    error: vigente?.error ?? null,
    // true mientras llega la respuesta de lo que se pidió ahora
    cargando: vigente === null,
  };
}
