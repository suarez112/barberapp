import { describirError, registrarCausa } from "@/services/api/errores";
import { ApiError, esCancelada } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { useCerrarSesion } from "./useCerrarSesion";

type Opciones = {
  titulo?: string;
  porDefecto?: string;
  tituloConflicto?: string;
};

// Muestra el error de una acción del panel. Con 401 (sesión vencida) además
// cierra la sesión, y la pantalla vuelve al ingreso. Una petición cancelada al
// salir de la pantalla no es un error y no se muestra.
export function useAvisarError() {
  const cerrarSesion = useCerrarSesion();

  return (
    error: unknown,
    {
      titulo = "No se pudo completar",
      porDefecto = "Intenta de nuevo.",
      tituloConflicto,
    }: Opciones = {},
  ) => {
    if (esCancelada(error)) return;
    registrarCausa(titulo, error);
    const aviso = describirError(error, { titulo, porDefecto, tituloConflicto });
    avisar(aviso.titulo, aviso.mensaje, "error");
    if (error instanceof ApiError && error.status === 401) cerrarSesion();
  };
}
