import { ReactNode, useState } from "react";
import { Barbero } from "../../types";
import { crearContexto } from "../../utils/crearContexto";

type ValorSesion = {
  barbero: Barbero | null;
  token: string;
  empleadoSupervisado: Barbero | null;
  // El admin puede mirar la agenda de otro integrante; si no, es el propio
  profesionalActivo: Barbero | null;
  iniciarSesion: (barbero: Barbero, token: string) => void;
  cerrarSesion: () => void;
  supervisar: (empleado: Barbero | null) => void;
  actualizarBarberoLogueado: (cambios: Partial<Barbero>) => void;
};

const [SesionContext, useSesion] = crearContexto<ValorSesion>("Sesion");
export { useSesion };

export function SesionProvider({ children }: { children: ReactNode }) {
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [token, setToken] = useState("");
  const [empleadoSupervisado, setEmpleadoSupervisado] =
    useState<Barbero | null>(null);

  const profesionalActivo =
    barbero?.esAdmin && empleadoSupervisado ? empleadoSupervisado : barbero;

  const iniciarSesion = (nuevo: Barbero, nuevoToken: string) => {
    setBarbero(nuevo);
    setToken(nuevoToken);
    setEmpleadoSupervisado(null);
  };

  const cerrarSesion = () => {
    setBarbero(null);
    setEmpleadoSupervisado(null);
    setToken("");
  };

  const actualizarBarberoLogueado = (cambios: Partial<Barbero>) =>
    setBarbero((actual) => (actual ? { ...actual, ...cambios } : actual));

  return (
    <SesionContext
      value={{
        barbero,
        token,
        empleadoSupervisado,
        profesionalActivo,
        iniciarSesion,
        cerrarSesion,
        supervisar: setEmpleadoSupervisado,
        actualizarBarberoLogueado,
      }}
    >
      {children}
    </SesionContext>
  );
}
