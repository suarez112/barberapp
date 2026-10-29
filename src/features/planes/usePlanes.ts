import { useCallback, useEffect, useState } from "react";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { obtenerPlanes, RespuestaPlanes } from "./api";

// Carga el cobro por profesional (público). `error` trae el texto para mostrar.
export function usePlanes() {
  const [planes, setPlanes] = useState<RespuestaPlanes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerPlanes(controlador.signal)
      .then(setPlanes)
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Planes", e);
        setError(describirError(e, { titulo: "", porDefecto: "No se pudieron cargar los planes." }).mensaje);
      });
    return () => controlador.abort();
  }, [intento]);

  const reintentar = useCallback(() => {
    setError(null);
    setIntento((n) => n + 1);
  }, []);

  return { planes, error, reintentar };
}
