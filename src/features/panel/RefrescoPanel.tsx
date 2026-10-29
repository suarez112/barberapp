import { createContext, ReactNode, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { registrarCausa } from "@/services/api/errores";
import { useNotificaciones } from "../notificaciones/NotificacionesProvider";

// Cada cuánto se actualiza solo la pantalla abierta
const CADA_MS = 30_000;

type Registrar = (funcion: (() => Promise<unknown>) | null) => void;

const RefrescoContext = createContext<Registrar | null>(null);

// Guarda la función de la pestaña abierta para que "deslizar hacia abajo" la use
export function RefrescoPanelProvider({
  registrar,
  children,
}: {
  registrar: Registrar;
  children: ReactNode;
}) {
  return <RefrescoContext value={registrar}>{children}</RefrescoContext>;
}

// Mantiene al día la pestaña abierta (Agenda, Bloqueos, Clientes, Cartera). `refrescar`
// vuelve a pedir los datos sin mostrar el cargando. Se llama:
// - al deslizar hacia abajo (el panel la pide y muestra sus errores),
// - al volver a la app,
// - cada 30 segundos mientras la pantalla está abierta,
// - al llegar una notificación de cita.
export function useRefrescoPanel(refrescar: () => Promise<unknown>) {
  const registrar = useContext(RefrescoContext);
  const { avisosRecibidos } = useNotificaciones();
  const ultima = useRef(refrescar);
  const enCurso = useRef(false);
  useEffect(() => {
    ultima.current = refrescar;
  });

  // Para el deslizar hacia abajo
  useEffect(() => {
    if (!registrar) return;
    registrar(() => ultima.current());
    return () => registrar(null);
  }, [registrar]);

  // Actualización silenciosa: si falla (sin internet) se queda lo que ya se veía
  const silenciosa = useRef(() => {
    if (enCurso.current) return;
    enCurso.current = true;
    ultima
      .current()
      .catch((e) => registrarCausa("Actualización automática", e))
      .finally(() => {
        enCurso.current = false;
      });
  });

  useEffect(() => {
    const actualizar = silenciosa.current;
    const reloj = setInterval(() => {
      if (AppState.currentState === "active") actualizar();
    }, CADA_MS);
    const oyente = AppState.addEventListener("change", (estado) => {
      if (estado === "active") actualizar();
    });
    return () => {
      clearInterval(reloj);
      oyente.remove();
    };
  }, []);

  // Llegó una notificación de cita (no se repite al abrir la pestaña)
  const vistos = useRef(avisosRecibidos);
  useEffect(() => {
    if (vistos.current === avisosRecibidos) return;
    vistos.current = avisosRecibidos;
    silenciosa.current();
  }, [avisosRecibidos]);
}
