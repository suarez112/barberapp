import { useCallback, useEffect, useRef } from "react";

// Señal que se cancela cuando el componente se desmonta (ej. al salir de la
// pantalla o cambiar de pestaña). Las peticiones que la usan se cortan solas
// y lanzan PeticionCancelada, que nunca se muestra como error.
export function useSenalDeSalida() {
  const controlador = useRef<AbortController | null>(null);

  useEffect(() => {
    const actual = new AbortController();
    controlador.current = actual;
    return () => actual.abort();
  }, []);

  // Se lee al llamar (no al renderizar): el efecto ya creó el controlador
  return useCallback(() => controlador.current?.signal, []);
}
