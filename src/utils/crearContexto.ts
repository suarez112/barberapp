import { createContext, use } from "react";

// Crea un contexto y su hook. El hook falla con un mensaje claro si se usa
// fuera de su Provider, en vez de devolver undefined en silencio.
export function crearContexto<T>(nombre: string) {
  const Contexto = createContext<T | null>(null);
  Contexto.displayName = nombre;

  const useContexto = (): T => {
    const valor = use(Contexto);
    if (valor === null) {
      throw new Error(`use${nombre} debe usarse dentro de <${nombre}Provider>`);
    }
    return valor;
  };

  return [Contexto, useContexto] as const;
}
