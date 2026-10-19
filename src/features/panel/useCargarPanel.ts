import { useCallback, useEffect, useState } from "react";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { describirError, esEstado } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { listarAgenda } from "../agenda/api";
import { useAgenda } from "../agenda/AgendaProvider";
import { obtenerNegocioActual } from "../negocio/api";
import { useNegocio } from "../negocio/NegocioProvider";
import { useCerrarSesion } from "../sesion/useCerrarSesion";

// Carga el negocio (colores, equipo, servicios) y la agenda con el token
// del personal o de la cuenta admin. Si el token venció, cierra la sesión.
export function useCargarPanel(token: string) {
  const { abrirNegocio } = useNegocio();
  const { setCitas } = useAgenda();
  const cerrarSesion = useCerrarSesion();
  const senal = useSenalDeSalida();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El estado cambia solo cuando responde el servidor
  const cargar = useCallback(
    () =>
      Promise.all([obtenerNegocioActual(token, senal()), listarAgenda(token, senal())])
        .then(([negocio, agenda]) => {
          abrirNegocio(negocio);
          setCitas(agenda);
        })
        .catch((e) => {
          if (esCancelada(e)) return;
          const aviso = describirError(e, {
            titulo: "Error",
            porDefecto: "No se pudieron cargar los datos del negocio.",
          });
          if (esEstado(e, 401)) {
            avisar(aviso.titulo, aviso.mensaje, "error");
            cerrarSesion();
            return;
          }
          setError(aviso.mensaje);
        })
        .finally(() => setCargando(false)),
    // abrirNegocio, setCitas y cerrarSesion cambian en cada render; basta el token
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, senal],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const recargar = () => {
    setCargando(true);
    setError(null);
    cargar();
  };

  return { cargando, error, recargar };
}
