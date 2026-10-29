import { ReactNode, useEffect, useState } from "react";
import { crearContexto } from "../../utils/crearContexto";
import { useCuenta } from "../cuenta/CuentaProvider";
import { leerSesion } from "./sesionGuardada";
import { useSesion } from "./SesionProvider";

const [RestauracionContext, useSesionLista] =
  crearContexto<{ lista: boolean }>("RestaurarSesion");
// lista = true cuando ya se revisó si había una sesión guardada
export { useSesionLista };

// Al abrir la app, recupera la sesión guardada en el celular.
// Si el token ya venció, la primera llamada al servidor responde 401 y se cierra.
export function RestaurarSesionProvider({ children }: { children: ReactNode }) {
  const { iniciarSesion } = useSesion();
  const { iniciarCuenta } = useCuenta();
  const [lista, setLista] = useState(false);

  useEffect(() => {
    leerSesion()
      .then((guardada) => {
        if (guardada?.tipo === "personal") iniciarSesion(guardada.barbero, guardada.token);
        if (guardada?.tipo === "cuenta") iniciarCuenta(guardada.usuario, guardada.token);
      })
      .finally(() => setLista(true));
    // Solo una vez, al abrir la app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <RestauracionContext value={{ lista }}>{children}</RestauracionContext>;
}
