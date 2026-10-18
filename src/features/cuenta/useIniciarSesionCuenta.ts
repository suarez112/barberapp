import { ErrorDeConexion, mensajeDeError } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { loginCuenta, RolCuenta } from "./api";
import { useCuenta } from "./CuentaProvider";

// Login de administradores de empresa y clientes. Devuelve el rol (o null si falló)
export function useIniciarSesionCuenta() {
  const { iniciarCuenta } = useCuenta();

  return async (correo: string, clave: string): Promise<RolCuenta | null> => {
    if (!correo.trim() || !clave) {
      avisar("Campos requeridos", "Por favor ingresa correo y contraseña.");
      return null;
    }
    try {
      const { usuario, token } = await loginCuenta(correo.trim(), clave);
      iniciarCuenta(usuario, token);
      return usuario.rol;
    } catch (error) {
      if (error instanceof ErrorDeConexion) {
        console.error("Error en login de cuenta:", error.causa);
        avisar("Error de conexión", "No se pudo conectar con el servidor.");
      } else {
        avisar(
          "Error de acceso",
          mensajeDeError(error, "Correo o contraseña incorrectos"),
        );
      }
      return null;
    }
  };
}
