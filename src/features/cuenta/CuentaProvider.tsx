import { ReactNode, useState } from "react";
import { crearContexto } from "../../utils/crearContexto";
import { UsuarioCuenta } from "./api";

type ValorCuenta = {
  // Cuenta de empresa (admin) o de cliente; null si no hay sesión de cuenta
  usuario: UsuarioCuenta | null;
  token: string;
  iniciarCuenta: (usuario: UsuarioCuenta, token: string) => void;
  cerrarCuenta: () => void;
};

const [CuentaContext, useCuenta] = crearContexto<ValorCuenta>("Cuenta");
export { useCuenta };

// Sesión de /api/v1/cuentas. Es distinta a la del personal (SesionProvider):
// el backend no acepta un token en los endpoints del otro.
// Como la del personal, vive solo en memoria: recargar la app la cierra.
export function CuentaProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioCuenta | null>(null);
  const [token, setToken] = useState("");

  const iniciarCuenta = (nuevo: UsuarioCuenta, nuevoToken: string) => {
    setUsuario(nuevo);
    setToken(nuevoToken);
  };

  const cerrarCuenta = () => {
    setUsuario(null);
    setToken("");
  };

  return (
    <CuentaContext value={{ usuario, token, iniciarCuenta, cerrarCuenta }}>
      {children}
    </CuentaContext>
  );
}
