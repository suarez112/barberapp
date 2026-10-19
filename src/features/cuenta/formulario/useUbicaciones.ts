import { useEffect, useState } from "react";
import { describirError } from "@/services/api/errores";
import { Departamento, listarUbicaciones } from "../api";

// La lista casi nunca cambia: se pide una sola vez mientras la app está abierta
let enCache: Departamento[] | null = null;

// Departamentos de Colombia con sus municipios, desde el backend
export function useUbicaciones() {
  const [departamentos, setDepartamentos] = useState<Departamento[] | null>(enCache);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (enCache) return;
    let vigente = true;
    listarUbicaciones()
      .then((lista) => {
        enCache = lista;
        if (vigente) setDepartamentos(lista);
      })
      .catch((e) => {
        if (vigente)
          setError(
            describirError(e, { titulo: "", porDefecto: "No se pudieron cargar los departamentos." })
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

  return { departamentos, error, reintentar };
}
