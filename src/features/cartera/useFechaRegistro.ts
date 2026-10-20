import { useEffect, useState } from "react";
import { registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { obtenerSuscripcion } from "../cuenta/api";

// Día en que se registró el negocio (límite hacia atrás de la cartera).
// undefined mientras se consulta; null si el negocio no la tiene o la consulta falló.
export function useFechaRegistro(token: string) {
  const [fecha, setFecha] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerSuscripcion(token, controlador.signal)
      .then((s) => setFecha(s.fechaRegistro ?? null))
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Fecha de registro", e);
        setFecha(null);
      });
    return () => controlador.abort();
  }, [token]);

  return fecha;
}
