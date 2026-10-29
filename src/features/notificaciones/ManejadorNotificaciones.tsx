import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { useSesion } from "../sesion/SesionProvider";
import { cargarNotificaciones } from "./nativo";
import { useNotificaciones } from "./NotificacionesProvider";

// Avisos para el negocio (profesional y administradores) y para el cliente
const TIPOS_NEGOCIO = ["cita_nueva", "cita_cancelada_por_cliente", "cita_reprogramada"];
const TIPOS_CLIENTE = ["cita_cancelada", "recordatorio", "recordatorio_2h"];
// Resumen del día 10 y 14 de la prueba gratuita (no trae cita): lleva a Planes
const TIPO_PRUEBA = "prueba_resumen";

// Al tocar una notificación abre la cita: el negocio la ve en su agenda
// y el cliente en "Mis citas"; los avisos de la prueba abren Planes. No pinta nada.
export default function ManejadorNotificaciones() {
  const router = useRouter();
  const { lista } = useSesionLista();
  const { barbero } = useSesion();
  const { usuario } = useCuenta();
  const { abrirCitaEnPanel, abrirPlanesEnPanel } = useNotificaciones();

  // El oyente se crea una vez y lee siempre quién tiene la sesión abierta
  const actual = useRef({ router, barbero, usuario, abrirCitaEnPanel, abrirPlanesEnPanel });
  useEffect(() => {
    actual.current = { router, barbero, usuario, abrirCitaEnPanel, abrirPlanesEnPanel };
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
        const {
          router: r,
          barbero: personal,
          usuario: cuenta,
          abrirCitaEnPanel: abrirPanel,
          abrirPlanesEnPanel: abrirPlanes,
        } = actual.current;

        if (tipo === TIPO_PRUEBA) {
          // Solo los administradores ven Planes; a otra persona no se le abre nada
          if (!personal?.esAdmin && cuenta?.rol !== "admin") return;
          abrirPlanes();
          r.navigate(personal ? "/panel" : "/admin");
          N.clearLastNotificationResponseAsync();
          return;
        }
        if (!citaId) return;
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
