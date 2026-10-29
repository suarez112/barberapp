import { PAGOS_EN_APP } from "@/config/pagos";
import { describirError, registrarCausa } from "@/services/api/errores";
import { ApiError, esCancelada, esFuncionNoIncluida } from "@/services/api/http";
import { avisar, confirmar } from "@/utils/dialogos";
import { useFunciones } from "../planes/funcionesContexto";
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
  const { abrirPlanes } = useFunciones();

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
    // El plan no incluye la función: el mismo aviso del backend, con un botón a los planes
    if (PAGOS_EN_APP && esFuncionNoIncluida(error)) {
      void confirmar({
        titulo: aviso.titulo,
        mensaje: aviso.mensaje,
        textoAceptar: "VER PLANES",
        textoCancelar: "CERRAR",
      }).then((ver) => ver && abrirPlanes());
      return;
    }
    avisar(aviso.titulo, aviso.mensaje, "error");
    if (error instanceof ApiError && error.status === 401) cerrarSesion();
  };
}
