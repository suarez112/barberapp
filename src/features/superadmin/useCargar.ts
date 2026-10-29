import { useEffect, useState } from "react";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useSuperadmin } from "./SuperadminContext";

type Resultado<T> = { peticion: string; datos?: T; error?: string };

// Carga datos del panel con el token. `clave` resume los filtros: al cambiar, vuelve a
// pedir. Mientras llega la respuesta nueva se siguen mostrando los datos anteriores,
// y una respuesta vieja nunca pisa a una más reciente.
export function useCargar<T>(
  consulta: (token: string, signal: AbortSignal) => Promise<T>,
  clave: string,
) {
  const { token, cerrarSiVencio } = useSuperadmin();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const peticion = `${clave}#${version}`;

  useEffect(() => {
    const control = new AbortController();
    consulta(token, control.signal)
      .then((datos) => setResultado({ peticion, datos }))
      .catch((e) => {
        if (esCancelada(e) || control.signal.aborted || cerrarSiVencio(e)) return;
        registrarCausa("Panel superadmin", e);
        const aviso = describirError(e, { titulo: "Error", porDefecto: "No se pudieron cargar los datos." });
        // Se conservan los datos anteriores: solo cambia el error
        setResultado((previo) => ({ peticion, datos: previo?.datos, error: aviso.mensaje }));
      });
    return () => control.abort();
    // consulta y cerrarSiVencio cambian en cada render; basta la petición y el token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, peticion]);

  const alDia = resultado?.peticion === peticion;
  return {
    datos: resultado?.datos ?? null,
    cargando: !alDia,
    error: alDia ? (resultado?.error ?? null) : null,
    recargar: () => setVersion((v) => v + 1),
  };
}
