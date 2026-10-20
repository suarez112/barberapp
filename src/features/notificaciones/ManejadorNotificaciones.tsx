import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { useSesion } from "../sesion/SesionProvider";
import { cargarNotificaciones } from "./nativo";
import { useNotificaciones } from "./NotificacionesProvider";

// Avisos para el negocio (profesional y administradores) y para el cliente
const TIPOS_NEGOCIO = ["cita_nueva", "cita_cancelada_por_cliente"];
const TIPOS_CLIENTE = ["cita_cancelada", "recordatorio"];

// Al tocar una notificación abre la cita: el negocio la ve en su agenda
// y el cliente en "Mis citas". No pinta nada.
export default function ManejadorNotificaciones() {
  const router = useRouter();
  const { lista } = useSesionLista();
  const { barbero } = useSesion();
  const { usuario } = useCuenta();
  const { abrirCitaEnPanel } = useNotificaciones();

  // El oyente se crea una vez y lee siempre quién tiene la sesión abierta
  const actual = useRef({ router, barbero, usuario, abrirCitaEnPanel });
  useEffect(() => {
    actual.current = { router, barbero, usuario, abrirCitaEnPanel };
  });

  useEffect(() => {
    // Hay que esperar la sesión guardada: sin ella no se sabe adónde ir
    if (!lista) return;
    let vigente = true;
    let quitar = () => {};

    cargarNotificaciones().then((N) => {
      if (!N || !vigente) return;

      const abrir = (respuesta: import("expo-notifications").NotificationResponse) => {
        if (respuesta.actionIdentifier !== N.DEFAULT_ACTION_IDENTIFIER) return;
        const datos = respuesta.notification.request.content.data;
        const tipo = typeof datos?.tipo === "string" ? datos.tipo : "";
        const citaId = typeof datos?.citaId === "string" ? datos.citaId : "";
        if (!citaId) return;

        const { router: r, barbero: personal, usuario: cuenta, abrirCitaEnPanel: abrirPanel } =
          actual.current;
        if (TIPOS_NEGOCIO.includes(tipo) && (personal || cuenta?.rol === "admin")) {
          abrirPanel(citaId);
          r.navigate(personal ? "/panel" : "/admin");
        } else if (TIPOS_CLIENTE.includes(tipo) && cuenta?.rol === "cliente") {
          r.navigate({ pathname: "/mis-citas", params: { citaId } });
        } else {
          // Otra persona tiene la sesión abierta: ese aviso no es para ella
          return;
        }
        // Para no abrirla dos veces si la app se reinicia
        N.clearLastNotificationResponseAsync();
      };

      // La app se abrió tocando la notificación (estaba cerrada)
      N.getLastNotificationResponseAsync().then((r) => {
        if (r && vigente) abrir(r);
      });
      // La app ya estaba abierta o en segundo plano
      const suscripcion = N.addNotificationResponseReceivedListener(abrir);
      quitar = () => suscripcion.remove();
    });

    return () => {
      vigente = false;
      quitar();
    };
  }, [lista]);

  return null;
}
