import { describirError } from "@/services/api/errores";
import { ErrorDeConexion } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { useCuenta } from "../cuenta/CuentaProvider";
import { loginBarbero } from "./api";
import { useSesion } from "./SesionProvider";

// Valida credenciales del personal y abre (y guarda) la sesión.
// El panel carga después el negocio y la agenda.
export function useIniciarSesion() {
  const { iniciarSesion } = useSesion();
  const { cerrarCuenta } = useCuenta();

  return async (usuario: string, clave: string): Promise<boolean> => {
    if (!usuario.trim() || !clave.trim()) {
      avisar("Campos requeridos", "Por favor ingresa usuario y contraseña.");
      return false;
    }

    try {
      const login = await loginBarbero(usuario.trim(), clave);
      // Solo una sesión a la vez
      await cerrarCuenta();
      await iniciarSesion(login.barbero, login.token);
      return true;
    } catch (error) {
      if (error instanceof ErrorDeConexion) console.error("Error en login:", error.causa);
      const aviso = describirError(error, {
        titulo: "Error de acceso",
        porDefecto: "Credenciales incorrectas.",
      });
      avisar(aviso.titulo, aviso.mensaje);
      return false;
    }
  };
}
