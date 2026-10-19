import { describirError, registrarCausa } from "@/services/api/errores";
import { avisar } from "@/utils/dialogos";
import { useCuenta } from "../cuenta/CuentaProvider";
import { loginUnico } from "./api";
import { useSesion } from "./SesionProvider";

// Adónde va cada quien después de entrar
export type Destino = "/admin" | "/panel" | "/mis-negocios";

// Login único con correo o usuario. Abre (y guarda) la sesión que corresponde:
// cuenta de la administradora, cuenta de cliente o sesión del personal. Solo una a la vez.
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
      if (login.tipo === "personal") {
        await cerrarCuenta();
        await iniciarSesion(login.barbero, login.token);
        return "/panel";
      }
      await cerrarSesion();
      if (login.tipo === "admin") {
        await iniciarCuenta(login.usuario, login.token);
        return "/admin";
      }
      // Cliente: recuerda si debe aceptar una versión nueva de los documentos
      await iniciarCuenta(
        { ...login.usuario, debeAceptarDocumentos: login.debeAceptarDocumentos },
        login.token,
      );
      return "/mis-negocios";
    } catch (error) {
      registrarCausa("Error en login:", error);
      // 402 a un empleado: "Este negocio está inactivo por ahora…"
      const aviso = describirError(error, {
        titulo: "Error de acceso",
        porDefecto: "Correo, usuario o contraseña incorrectos",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
      return null;
    }
  };
}
