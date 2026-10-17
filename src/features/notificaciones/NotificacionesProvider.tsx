import { ReactNode, useState } from "react";
import { NotificacionCliente } from "../../types";
import { crearContexto } from "../../utils/crearContexto";

type ValorNotificaciones = {
  notificaciones: NotificacionCliente[];
  hayNoLeidas: boolean;
  notificar: (n: Omit<NotificacionCliente, "id">) => void;
  marcarComoLeidas: () => void;
  eliminar: (id: string) => void;
  limpiar: () => void;
};

const [NotificacionesContext, useNotificaciones] =
  crearContexto<ValorNotificaciones>("Notificaciones");
export { useNotificaciones };

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<NotificacionCliente[]>(
    [],
  );
  const [hayNoLeidas, setHayNoLeidas] = useState(false);

  const notificar = (n: Omit<NotificacionCliente, "id">) => {
    setNotificaciones((prev) => [{ id: Date.now().toString(), ...n }, ...prev]);
    setHayNoLeidas(true);
  };

  return (
    <NotificacionesContext
      value={{
        notificaciones,
        hayNoLeidas,
        notificar,
        marcarComoLeidas: () => setHayNoLeidas(false),
        eliminar: (id) =>
          setNotificaciones((prev) => prev.filter((n) => n.id !== id)),
        limpiar: () => setNotificaciones([]),
      }}
    >
      {children}
    </NotificacionesContext>
  );
}
