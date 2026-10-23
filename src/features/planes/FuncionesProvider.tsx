import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { Suscripcion } from "../cuenta/api";
import { obtenerFunciones, RespuestaFunciones } from "./api";
import { FuncionesContext, Valor } from "./funcionesContexto";
import PlanesModal from "./PlanesModal";

type Props = {
  token: string;
  suscripcion: Suscripcion | null;
  children: ReactNode;
};

// Funciones que incluye el plan del negocio (una sola consulta para todo el panel del administrador)
// y la pantalla de planes a la que llevan los candados.
export function FuncionesProvider({ token, suscripcion, children }: Props) {
  const [datos, setDatos] = useState<RespuestaFunciones | null>(null);
  const [cargada, setCargada] = useState(false);
  const [verPlanes, setVerPlanes] = useState(false);
  const planId = suscripcion?.planEquipo.id;

  // Se vuelve a pedir cuando cambia el plan del negocio
  useEffect(() => {
    const controlador = new AbortController();
    obtenerFunciones(token, controlador.signal)
      .then(setDatos)
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Funciones del plan", e);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargada(true);
      });
    return () => controlador.abort();
  }, [token, planId]);

  const funcion = useCallback((id: string) => datos?.funciones.find((f) => f.id === id), [datos]);
  const abrirPlanes = useCallback(() => setVerPlanes(true), []);

  const valor = useMemo<Valor>(
    () => ({
      cargada,
      datos,
      funcion,
      incluida: (id) => funcion(id)?.incluida ?? true,
      abrirPlanes,
    }),
    [cargada, datos, funcion, abrirPlanes],
  );

  return (
    <FuncionesContext.Provider value={valor}>
      {children}
      <PlanesModal visible={verPlanes} onCerrar={() => setVerPlanes(false)} suscripcion={suscripcion} />
    </FuncionesContext.Provider>
  );
}
