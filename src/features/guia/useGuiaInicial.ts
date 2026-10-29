import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAvisarError } from "../sesion/useAvisarError";
import { Guia, marcarEnlaceCompartido, mostrarGuia, obtenerGuia, ocultarGuia } from "./api";
import { ValorGuia } from "./guiaContexto";

// Avance de la guía inicial. Un fallo al consultarla no molesta: la tarjeta simplemente no sale.
export function useGuiaInicial(token: string): ValorGuia {
  const avisarError = useAvisarError();
  const [guia, setGuia] = useState<Guia | null>(null);
  const vigente = useRef(true);
  // avisarError cambia en cada render: se lee desde aquí para no rehacer los callbacks
  const avisarRef = useRef(avisarError);
  useEffect(() => {
    avisarRef.current = avisarError;
  });

  useEffect(() => {
    vigente.current = true;
    return () => {
      vigente.current = false;
    };
  }, []);

  const refrescar = useCallback(() => {
    obtenerGuia(token)
      .then((g) => vigente.current && setGuia(g))
      .catch((e) => {
        if (!esCancelada(e)) registrarCausa("Guía inicial", e);
      });
  }, [token]);

  useEffect(() => {
    refrescar();
    // También al volver a la app: pudo crear el servicio o guardar el horario en otra pantalla
    const oyente = AppState.addEventListener("change", (estado) => {
      if (estado === "active") refrescar();
    });
    return () => oyente.remove();
  }, [refrescar]);

  const marcarEnlace = useCallback(() => {
    marcarEnlaceCompartido(token)
      .then((g) => vigente.current && setGuia(g))
      .catch((e) => {
        if (!esCancelada(e)) registrarCausa("Marcar enlace compartido", e);
      });
  }, [token]);

  const cambiarVisibilidad = useCallback(
    async (accion: typeof ocultarGuia, titulo: string) => {
      try {
        const g = await accion(token);
        if (vigente.current) setGuia(g);
      } catch (e) {
        avisarRef.current(e, { titulo });
      }
    },
    [token],
  );

  return useMemo(
    () => ({
      guia,
      refrescar,
      marcarEnlace,
      ocultar: () => cambiarVisibilidad(ocultarGuia, "No se pudo ocultar la guía"),
      mostrar: () => cambiarVisibilidad(mostrarGuia, "No se pudo mostrar la guía"),
    }),
    [guia, refrescar, marcarEnlace, cambiarVisibilidad],
  );
}
