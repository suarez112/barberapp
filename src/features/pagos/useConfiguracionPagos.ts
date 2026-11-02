import { useEffect, useState } from "react";
import { esCancelada } from "@/services/api/http";
import { ConfiguracionPagos, obtenerConfiguracionPagos } from "./api";

// Qué proveedor de pagos usa el backend ("manual" o una pasarela) y si está en modo de
// prueba. Se pregunta al abrir la página, sin sesión. `null` = todavía no se sabe o no se
// pudo saber (entonces no se muestra el aviso de prueba ni el flujo manual).
export function useConfiguracionPagos(activo = true): { config: ConfiguracionPagos | null; cargando: boolean } {
  const [estado, setEstado] = useState<{ config: ConfiguracionPagos | null; listo: boolean }>({
    config: null,
    listo: false,
  });

  useEffect(() => {
    if (!activo) return;
    const controlador = new AbortController();
    obtenerConfiguracionPagos(controlador.signal)
      .then((config) => setEstado({ config, listo: true }))
      .catch((e) => {
        if (esCancelada(e)) return;
        setEstado({ config: null, listo: true });
      });
    return () => controlador.abort();
  }, [activo]);

  return { config: estado.config, cargando: activo && !estado.listo };
}
