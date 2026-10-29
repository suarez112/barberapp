import { useEffect, useState } from "react";
import { esCancelada } from "@/services/api/http";
import { obtenerConfiguracionPagos } from "./api";

// ¿La pasarela está en modo de prueba? Se pregunta al abrir la página, sin sesión.
// Si no se puede saber, no se muestra el aviso.
export function useModoPrueba(): boolean {
  const [esDePrueba, setEsDePrueba] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerConfiguracionPagos(controlador.signal)
      .then((c) => setEsDePrueba(c.esDePrueba))
      .catch((e) => {
        if (esCancelada(e)) return;
        setEsDePrueba(false);
      });
    return () => controlador.abort();
  }, []);

  return esDePrueba;
}
