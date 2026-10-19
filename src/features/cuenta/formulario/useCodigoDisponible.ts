import { useEffect, useState } from "react";
import { consultarCodigoDisponible } from "../api";

export type EstadoCodigo =
  | "vacio"
  | "actual" // el mismo código que ya tiene el negocio (en "Mi negocio")
  | "verificando"
  | "disponible"
  | "en-uso"
  | "sin-verificar"; // no se pudo consultar (ej. sin conexión)

const ESPERA_MS = 500;

// Revisa con el backend, mientras se escribe, si el código del negocio está libre.
// Espera a que la persona deje de escribir para no consultar en cada letra.
export function useCodigoDisponible(codigo: string, codigoActual?: string) {
  const [resultado, setResultado] = useState<{ codigo: string; estado: EstadoCodigo } | null>(
    null,
  );

  const sinConsulta = !codigo || codigo === codigoActual;

  useEffect(() => {
    if (sinConsulta) return;
    let vigente = true;
    const temporizador = setTimeout(() => {
      consultarCodigoDisponible(codigo)
        .then((r) => {
          if (vigente) setResultado({ codigo, estado: r.disponible ? "disponible" : "en-uso" });
        })
        .catch(() => {
          if (vigente) setResultado({ codigo, estado: "sin-verificar" });
        });
    }, ESPERA_MS);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [codigo, sinConsulta]);

  if (!codigo) return "vacio";
  if (codigo === codigoActual) return "actual";
  // Mientras no llegue la respuesta de este mismo código, se está verificando
  return resultado?.codigo === codigo ? resultado.estado : "verificando";
}
