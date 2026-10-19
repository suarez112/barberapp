import { ReactNode, useState } from "react";
import { Barbero } from "../../types";
import { crearContexto } from "../../utils/crearContexto";
import { borrarSesion, guardarSesion } from "./sesionGuardada";

type ValorSesion = {
  barbero: Barbero | null;
  token: string;
  // Abre la sesión y la guarda en el celular
  iniciarSesion: (barbero: Barbero, token: string) => Promise<void>;
  // Cierra la sesión y la borra del celular
  cerrarSesion: () => Promise<void>;
  actualizarBarberoLogueado: (cambios: Partial<Barbero>) => void;
};

const [SesionContext, useSesion] = crearContexto<ValorSesion>("Sesion");
export { useSesion };

// Sesión del personal (/api/v1/auth/login)
export function SesionProvider({ children }: { children: ReactNode }) {
  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [token, setToken] = useState("");

  const iniciarSesion = (nuevo: Barbero, nuevoToken: string) => {
    setBarbero(nuevo);
    setToken(nuevoToken);
    return guardarSesion({ tipo: "personal", token: nuevoToken, barbero: nuevo });
  };

  const cerrarSesion = () => {
    setBarbero(null);
    setToken("");
    return borrarSesion();
  };

  const actualizarBarberoLogueado = (cambios: Partial<Barbero>) =>
    setBarbero((actual) => {
      if (!actual) return actual;
      const nuevo = { ...actual, ...cambios };
      guardarSesion({ tipo: "personal", token, barbero: nuevo });
      return nuevo;
    });

  return (
    <SesionContext
      value={{
        barbero,
        token,
        iniciarSesion,
        cerrarSesion,
        actualizarBarberoLogueado,
      }}
    >
      {children}
    </SesionContext>
  );
}
