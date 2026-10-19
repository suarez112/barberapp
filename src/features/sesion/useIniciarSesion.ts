import { describirError, esEstado, registrarCausa } from "@/services/api/errores";
import { avisar } from "@/utils/dialogos";
import { loginCuenta } from "../cuenta/api";
import { useCuenta } from "../cuenta/CuentaProvider";
import { loginUnico } from "./api";
import { useSesion } from "./SesionProvider";

// Adónde va cada quien después de entrar
export type Destino = "/admin" | "/panel" | "/cliente";

// Login único con correo o usuario. Abre (y guarda) la sesión que corresponde:
// cuenta de la administradora o sesión del personal. Solo una a la vez.
// Devuelve la pantalla de destino, o null si no se pudo entrar.
export function useIniciarSesion() {
  const { iniciarSesion, cerrarSesion } = useSesion();
  const { iniciarCuenta, cerrarCuenta } = useCuenta();

  return async (usuario: string, clave: string): Promise<Destino | null> => {
    const acceso = usuario.trim();
    if (!acceso || !clave) {
      avisar("Campos requeridos", "Escribe tu correo o usuario y tu contraseña.");
      return null;
    }

    try {
      const login = await loginUnico(acceso, clave);
      if (login.tipo === "admin") {
        await cerrarSesion();
        await iniciarCuenta(login.usuario, login.token);
        return "/admin";
      }
      await cerrarCuenta();
      await iniciarSesion(login.barbero, login.token);
      return "/panel";
    } catch (error) {
      // 403: es una cuenta de cliente. Los clientes siguen entrando con su correo
      // por el login de cuentas, que los lleva a su apartado.
      if (esEstado(error, 403) && acceso.includes("@")) return entrarComoCliente(acceso, clave);
      registrarCausa("Error en login:", error);
      const aviso = describirError(error, {
        titulo: "Error de acceso",
        porDefecto: "Correo, usuario o contraseña incorrectos",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
      return null;
    }
  };

  async function entrarComoCliente(correo: string, clave: string): Promise<Destino | null> {
    try {
      const { usuario, token } = await loginCuenta(correo, clave);
      await cerrarSesion();
      await iniciarCuenta(usuario, token);
      return "/cliente";
    } catch (error) {
      const aviso = describirError(error, {
        titulo: "Error de acceso",
        porDefecto: "Correo o contraseña incorrectos",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
      return null;
    }
  }
}
