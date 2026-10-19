import { useCallback, useEffect, useState } from "react";
import { avisar } from "@/utils/dialogos";
import { useAvisarError } from "../sesion/useAvisarError";
import {
  agregarAListaNegra,
  Bloqueado,
  Cliente,
  listarClientes,
  listarListaNegra,
  quitarDeListaNegra,
} from "./api";

// Clientes y lista negra del negocio, leídos del servidor
export function useClientes(token: string) {
  const avisarError = useAvisarError();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [listaNegra, setListaNegra] = useState<Bloqueado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El estado cambia solo cuando responde el servidor
  const cargar = useCallback(
    () =>
      Promise.all([listarClientes(token), listarListaNegra(token)])
        .then(([c, l]) => {
          setClientes(c);
          setListaNegra(l);
          setError(null);
        })
        .catch((e) => {
          setError("No se pudieron cargar los clientes.");
          avisarError(e, { titulo: "No se pudieron cargar los clientes" });
        })
        .finally(() => setCargando(false)),
    // avisarError cambia en cada render; basta el token
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const recargar = () => {
    setCargando(true);
    setError(null);
    return cargar();
  };

  const bloquear = async (cliente: Cliente) => {
    try {
      await agregarAListaNegra(token, cliente.id);
      avisar("Cliente bloqueado", `${cliente.nombre} ya no podrá agendar.`);
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
      avisar("Desbloqueado", `${nombre} ya puede agendar citas.`);
      await recargar();
    } catch (e) {
      avisarError(e, { titulo: "No se pudo desbloquear" });
    }
  };

  return { clientes, listaNegra, cargando, error, recargar, bloquear, desbloquear };
}

export type EstadoClientes = ReturnType<typeof useClientes>;
