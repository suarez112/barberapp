import { useCallback, useEffect, useState } from "react";
import { ApiError, ErrorDeConexion, mensajeDeError } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import {
  DatosEmpresa,
  EstadoPrueba,
  FotoElegida,
  PerfilEmpresa,
  actualizarMiEmpresa,
  obtenerEstadoPrueba,
  obtenerMiEmpresa,
  subirFotoEmpresa,
} from "../cuenta/api";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useCerrarSesion } from "../sesion/useCerrarSesion";

const MENSAJE_PRUEBA_VENCIDA =
  "Tu prueba gratuita de 15 días terminó. Activa tu suscripción para seguir usando las funciones de administrador.";

// Estado del panel de la empresa: prueba gratuita, perfil y sus acciones
export function useMiEmpresa() {
  const { token } = useCuenta();
  const cerrarSesion = useCerrarSesion();
  const [prueba, setPrueba] = useState<EstadoPrueba | null>(null);
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  // Mensaje del backend cuando la suscripción no está vigente (402)
  const [bloqueo, setBloqueo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // 402: la prueba o la suscripción terminó. 401: el token ya no sirve.
  // Devuelve true si el error se resolvió aquí.
  const manejarErrorDeAcceso = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiError)) return false;
      if (error.status === 402) {
        setBloqueo(error.message || MENSAJE_PRUEBA_VENCIDA);
        return true;
      }
      if (error.status === 401 || error.status === 403) {
        avisar(
          "Sesión finalizada",
          mensajeDeError(error, "Vuelve a iniciar sesión."),
        );
        cerrarSesion();
        return true;
      }
      return false;
    },
    // cerrarSesion cambia en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Pide prueba y perfil; el estado cambia cuando responde el servidor
  const cargar = useCallback(
    () =>
      obtenerEstadoPrueba(token)
        .then(async (estado) => {
          setPrueba(estado);
          if (estado.pruebaVencida) {
            setBloqueo(MENSAJE_PRUEBA_VENCIDA);
            return;
          }
          setPerfil(await obtenerMiEmpresa(token));
        })
        .catch((error) => {
          if (manejarErrorDeAcceso(error)) return;
          setErrorCarga(
            error instanceof ErrorDeConexion
              ? "No se pudo conectar con el servidor."
              : mensajeDeError(error, "No se pudieron cargar los datos del negocio."),
          );
        })
        .finally(() => setCargando(false)),
    [token, manejarErrorDeAcceso],
  );

  useEffect(() => {
    if (token) cargar();
  }, [token, cargar]);

  const recargar = () => {
    setCargando(true);
    setErrorCarga(null);
    cargar();
  };

  // Aviso común para guardar datos o foto; true si se guardó
  const ejecutar = async (accion: () => Promise<void>, porDefecto: string) => {
    try {
      await accion();
      return true;
    } catch (error) {
      if (manejarErrorDeAcceso(error)) return false;
      if (error instanceof ErrorDeConexion) {
        avisar("Error de conexión", "No se pudo conectar con el servidor.");
      } else {
        avisar("No se pudo guardar", mensajeDeError(error, porDefecto));
      }
      return false;
    }
  };

  const guardarDatos = (cambios: Partial<DatosEmpresa>) =>
    ejecutar(async () => {
      setPerfil(await actualizarMiEmpresa(token, cambios));
      avisar("Datos guardados", "La información del negocio se actualizó.");
    }, "No se pudieron guardar los datos.");

  const guardarFoto = (foto: FotoElegida) =>
    ejecutar(async () => {
      const { fotoUrl, mensaje } = await subirFotoEmpresa(token, foto);
      setPerfil((p) => (p ? { ...p, fotoUrl } : p));
      avisar(mensaje);
    }, "No se pudo subir la foto.");

  return {
    prueba,
    perfil,
    bloqueo,
    cargando,
    errorCarga,
    recargar,
    guardarDatos,
    guardarFoto,
  };
}
