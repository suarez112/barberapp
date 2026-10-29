import { useEffect, useState } from "react";
import { describirError } from "@/services/api/errores";
import { Categoria, listarCategorias } from "./api";

// La lista cambia muy poco: se pide al abrir el formulario y se reutiliza mientras la app está abierta
let enCache: Categoria[] | null = null;

// Categorías activas de GET /categorias
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(enCache);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (enCache) return;
    let vigente = true;
    listarCategorias()
      .then((lista) => {
        enCache = lista;
        if (vigente) setCategorias(lista);
      })
      .catch((e) => {
        if (vigente)
          setError(
            describirError(e, { titulo: "", porDefecto: "No se pudieron cargar las categorías." })
              .mensaje,
          );
      });
    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentar = () => {
    setError(null);
    setIntento((n) => n + 1);
  };

  return { categorias, error, reintentar };
}
