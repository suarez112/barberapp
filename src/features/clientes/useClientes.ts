import { useCallback, useEffect, useState } from "react";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { esCancelada } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { useAvisarError } from "../sesion/useAvisarError";
import {
  agregarAListaNegra,
  Cliente,
  listarClientes,
  quitarDeListaNegra,
} from "./api";

// Clientes del negocio (con su bloqueo), leídos del servidor
export function useClientes(token: string) {
  const avisarError = useAvisarError();
  const senal = useSenalDeSalida();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El estado cambia solo cuando responde el servidor
  const cargar = useCallback(
    () =>
      listarClientes(token, senal())
        .then((c) => {
          setClientes(c);
          setError(null);
        })
        .catch((e) => {
          // Se salió de la pestaña antes de que respondiera: nada que mostrar
          if (esCancelada(e)) return;
          setError("No se pudieron cargar los clientes.");
          avisarError(e, { titulo: "No se pudieron cargar los clientes" });
        })
        .finally(() => setCargando(false)),
    // avisarError cambia en cada render; basta el token
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, senal],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Actualización silenciosa (sin cargando ni avisos); el que la llama decide qué hacer con un error
  const refrescar = useCallback(
    () => listarClientes(token).then((c) => setClientes(c)),
    [token],
  );

  const recargar = () => {
    setCargando(true);
    setError(null);
    return cargar();
  };

  const bloquear = async (cliente: Cliente) => {
    try {
      await agregarAListaNegra(token, cliente.id);
      avisar("Cliente bloqueado", `${cliente.nombre} ya no podrá agendar.`, "exito");
      await recargar();
      return true;
    } catch (e) {
      avisarError(e, { titulo: "No se pudo bloquear" });
      return false;
    }
  };

  // id = id del registro en la lista negra
  const desbloquear = async (id: string, nombre: string) => {
    try {
      await quitarDeListaNegra(token, id);
      avisar("Desbloqueado", `${nombre} ya puede agendar citas.`, "exito");
      await recargar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo desbloquear" });
    }
  };

  return { clientes, cargando, error, recargar, refrescar, bloquear, desbloquear };
}

export type EstadoClientes = ReturnType<typeof useClientes>;
