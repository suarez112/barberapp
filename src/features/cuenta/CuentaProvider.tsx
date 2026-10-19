import { ReactNode, useState } from "react";
import { crearContexto } from "../../utils/crearContexto";
import { borrarSesion, guardarSesion } from "../sesion/sesionGuardada";
import { UsuarioCuenta } from "./api";

type ValorCuenta = {
  // Cuenta de empresa (admin) o de cliente; null si no hay sesión de cuenta
  usuario: UsuarioCuenta | null;
  token: string;
  // Abre la sesión y la guarda en el celular
  iniciarCuenta: (usuario: UsuarioCuenta, token: string) => Promise<void>;
  // Cierra la sesión y la borra del celular
  cerrarCuenta: () => Promise<void>;
  // Cambia datos de la cuenta abierta (ej. debeAceptarDocumentos) y los guarda
  actualizarUsuario: (cambios: Partial<UsuarioCuenta>) => void;
};

const [CuentaContext, useCuenta] = crearContexto<ValorCuenta>("Cuenta");
export { useCuenta };

// Sesión de /api/v1/cuentas. La cuenta admin también sirve en los endpoints
// del personal (agenda, equipo, servicios…) como administradora de su empresa;
// la de un cliente, en /api/v1/mi-cuenta y al reservar.
export function CuentaProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioCuenta | null>(null);
  const [token, setToken] = useState("");

  const iniciarCuenta = (nuevo: UsuarioCuenta, nuevoToken: string) => {
    setUsuario(nuevo);
    setToken(nuevoToken);
    return guardarSesion({ tipo: "cuenta", token: nuevoToken, usuario: nuevo });
  };

  const cerrarCuenta = () => {
    setUsuario(null);
    setToken("");
    return borrarSesion();
  };

  const actualizarUsuario = (cambios: Partial<UsuarioCuenta>) =>
    setUsuario((actual) => {
      if (!actual) return actual;
      const nuevo = { ...actual, ...cambios };
      guardarSesion({ tipo: "cuenta", token, usuario: nuevo });
      return nuevo;
    });

  return (
    <CuentaContext value={{ usuario, token, iniciarCuenta, cerrarCuenta, actualizarUsuario }}>
      {children}
    </CuentaContext>
  );
}
