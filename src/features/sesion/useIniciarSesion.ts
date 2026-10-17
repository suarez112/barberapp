import { ApiError, ErrorDeConexion, mensajeDeError } from "@/services/api/http";
import { Cita } from "@/types";
import { avisar } from "@/utils/dialogos";
import { listarAgenda } from "../agenda/api";
import { useAgenda } from "../agenda/AgendaProvider";
import { validarCodigoEmpresa } from "../negocio/api";
import { useNegocio } from "../negocio/NegocioProvider";
import { loginBarbero } from "./api";
import { useSesion } from "./SesionProvider";

// Valida credenciales, carga el negocio y la agenda, y abre la sesión
export function useIniciarSesion() {
  const { abrirNegocio } = useNegocio();
  const { setCitas } = useAgenda();
  const { iniciarSesion } = useSesion();

  return async (usuario: string, clave: string): Promise<boolean> => {
    if (!usuario.trim() || !clave.trim()) {
      avisar("Campos requeridos", "Por favor ingresa usuario y contraseña.");
      return false;
    }

    try {
      // 1. ¿Usuario y clave correctos?
      let login;
      try {
        login = await loginBarbero(usuario, clave);
      } catch (error) {
        if (error instanceof ApiError) {
          avisar(
            "Error de acceso",
            mensajeDeError(error, "Credenciales incorrectas."),
          );
          return false;
        }
        throw error;
      }

      // 2. Con el código del negocio, traemos sus colores, equipo y servicios
      let negocio;
      try {
        negocio = await validarCodigoEmpresa(login.barbero.empresaCodigo);
      } catch (error) {
        if (error instanceof ApiError) {
          avisar(
            "Error",
            mensajeDeError(error, "No se pudieron cargar los datos del negocio."),
          );
          return false;
        }
        throw error;
      }

      // 3. Citas reales: el servidor solo las entrega con el token
      let agenda: Cita[] = [];
      try {
        agenda = await listarAgenda(login.token);
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
      }

      setCitas(agenda);
      abrirNegocio(negocio);
      iniciarSesion(login.barbero, login.token);
      avisar("¡Bienvenido!", `Hola, ${login.barbero.nombre}`);
      return true;
    } catch (error) {
      console.error(
        "Error en login:",
        error instanceof ErrorDeConexion ? error.causa : error,
      );
      avisar("Error de conexión", "No se pudo conectar con el servidor.");
      return false;
    }
  };
}
