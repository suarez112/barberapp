import { useEffect, useState } from "react";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { EstadoYoAtiendo, obtenerYoAtiendo } from "./api";

// "Yo también atiendo clientes" de la cuenta de administración (la de correo).
// `activo` en false (otro tipo de sesión) no consulta nada: el backend respondería 403.
export function useYoAtiendo(token: string, activo: boolean) {
  const [estado, setEstado] = useState<EstadoYoAtiendo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!activo) return;
    const controlador = new AbortController();
    obtenerYoAtiendo(token, controlador.signal)
      .then((e) => {
        setEstado(e);
        setError(null);
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Yo también atiendo", e);
        setError(describirError(e, { titulo: "", porDefecto: "No se pudo cargar tu perfil." }).mensaje);
      });
    return () => controlador.abort();
  }, [token, activo, intento]);

  return {
    estado,
    setEstado,
    error,
    reintentar: () => {
      setError(null);
      setIntento((n) => n + 1);
    },
  };
}
