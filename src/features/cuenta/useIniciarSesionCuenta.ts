import { describirError } from "@/services/api/errores";
import { ErrorDeConexion } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { useSesion } from "../sesion/SesionProvider";
import { loginCuenta, RolCuenta } from "./api";
import { useCuenta } from "./CuentaProvider";

// Login de administradores de empresa y clientes. Devuelve el rol (o null si falló)
export function useIniciarSesionCuenta() {
  const { iniciarCuenta } = useCuenta();
  const { cerrarSesion } = useSesion();

  return async (correo: string, clave: string): Promise<RolCuenta | null> => {
    if (!correo.trim() || !clave) {
      avisar("Campos requeridos", "Por favor ingresa correo y contraseña.");
      return null;
    }
    try {
      const { usuario, token } = await loginCuenta(correo.trim(), clave);
      // Solo una sesión a la vez
      await cerrarSesion();
      await iniciarCuenta(usuario, token);
      return usuario.rol;
    } catch (error) {
      if (error instanceof ErrorDeConexion) {
        console.error("Error en login de cuenta:", error.causa);
      }
      const aviso = describirError(error, {
        titulo: "Error de acceso",
        porDefecto: "Correo o contraseña incorrectos",
      });
      avisar(aviso.titulo, aviso.mensaje);
      return null;
    }
  };
}
