import { useCallback, useEffect, useState } from "react";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { describirError, registrarCausa } from "@/services/api/errores";
import { ApiError, esCancelada, mensajeDeError } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import {
  DatosEmpresa,
  FotoElegida,
  PerfilEmpresa,
  Suscripcion,
  actualizarMiEmpresa,
  obtenerMiEmpresa,
  obtenerSuscripcion,
  subirFotoEmpresa,
} from "../cuenta/api";
import { useCerrarSesion } from "../sesion/useCerrarSesion";

// Estado de "Mi negocio": suscripción, perfil y sus acciones. Los dos responden
// aunque la suscripción haya vencido.
// token: el de la cuenta admin o el de un integrante con rol Administrador.
export function useMiEmpresa(token: string) {
  const cerrarSesion = useCerrarSesion();
  const senal = useSenalDeSalida();
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [perfil, setPerfil] = useState<PerfilEmpresa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // 401: el token ya no sirve. Devuelve true si el error se resolvió aquí
  // (o si fue una cancelación).
  const manejarErrorDeAcceso = useCallback(
    (error: unknown) => {
      if (esCancelada(error)) return true;
      // 403 (ej. le quitaron el rol de administrador) se muestra como error de carga
      if (error instanceof ApiError && error.status === 401) {
        avisar(
          "Sesión finalizada",
          mensajeDeError(error, "Vuelve a iniciar sesión."),
          "error",
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

  // Pide suscripción y perfil; el estado cambia cuando responde el servidor
  const cargar = useCallback(
    () =>
      Promise.all([obtenerSuscripcion(token, senal()), obtenerMiEmpresa(token, senal())])
        .then(([estado, datos]) => {
          setSuscripcion(estado);
          setPerfil(datos);
        })
        .catch((error) => {
          if (manejarErrorDeAcceso(error)) return;
          registrarCausa("Mi negocio", error);
          setErrorCarga(
            describirError(error, {
              titulo: "",
              porDefecto: "No se pudieron cargar los datos del negocio.",
            }).mensaje,
          );
        })
        .finally(() => setCargando(false)),
    [token, senal, manejarErrorDeAcceso],
  );

  useEffect(() => {
    if (token) cargar();
  }, [token, cargar]);

  const recargar = () => {
    setCargando(true);
    setErrorCarga(null);
    cargar();
  };

  // Vuelve a consultar solo la suscripción (cada día, al volver a la app o
  // cuando otra pantalla recibe 402). Si falla se queda con la anterior.
  const actualizarSuscripcion = useCallback(() => {
    obtenerSuscripcion(token, senal())
      .then(setSuscripcion)
      .catch((error) => {
        if (manejarErrorDeAcceso(error)) return;
        registrarCausa("Suscripción", error);
      });
  }, [token, senal, manejarErrorDeAcceso]);

  // Aviso común para guardar datos o foto; true si se guardó
  const ejecutar = async (accion: () => Promise<void>, porDefecto: string) => {
    try {
      await accion();
      return true;
    } catch (error) {
      if (manejarErrorDeAcceso(error)) return false;
      registrarCausa(porDefecto, error);
      const aviso = describirError(error, { titulo: "No se pudo guardar", porDefecto });
      avisar(aviso.titulo, aviso.mensaje, "error");
      return false;
    }
  };

  const guardarDatos = (cambios: Partial<DatosEmpresa>) =>
    ejecutar(async () => {
      setPerfil(await actualizarMiEmpresa(token, cambios));
      avisar("Datos guardados", "La información del negocio se actualizó.", "exito");
    }, "No se pudieron guardar los datos.");

  const guardarFoto = (foto: FotoElegida) =>
    ejecutar(async () => {
      const { fotoUrl, mensaje } = await subirFotoEmpresa(token, foto);
      setPerfil((p) => (p ? { ...p, fotoUrl } : p));
      avisar(mensaje, undefined, "exito");
    }, "No se pudo subir la foto.");

  return {
    suscripcion,
    perfil,
    cargando,
    errorCarga,
    recargar,
    actualizarSuscripcion,
    guardarDatos,
    guardarFoto,
  };
}
