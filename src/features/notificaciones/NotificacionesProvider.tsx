import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import { registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { avisar, confirmar } from "@/utils/dialogos";
import { crearContexto } from "@/utils/crearContexto";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { useSesion } from "../sesion/SesionProvider";
import { borrarDispositivo, registrarDispositivo } from "./api";
import { notificacionesDisponibles, obtenerTokenPush } from "./nativo";
import { guardarPreferencia, leerPreferencia } from "./preferencia";

type ValorNotificaciones = {
  // Hay una sesión abierta en un celular: se puede mostrar la opción del menú
  visible: boolean;
  // La persona las quiere y el celular dio el permiso
  activas: boolean;
  // Activa o desactiva los avisos de este celular (opción del menú)
  alternar: () => Promise<void>;
  // Borra el token de este celular en el servidor; se llama antes de cerrar la sesión
  desregistrar: () => Promise<void>;
  // Cita que se tocó en una notificación y el panel del negocio debe abrir
  citaPendiente: string | null;
  abrirCitaEnPanel: (citaId: string) => void;
  limpiarCitaPendiente: () => void;
};

const [NotificacionesContext, useNotificaciones] =
  crearContexto<ValorNotificaciones>("Notificaciones");
export { useNotificaciones };

type Registrado = { tokenPush: string; tokenSesion: string };

// Avisos push del celular: pide el permiso al iniciar sesión (no al abrir la app),
// registra el token en el servidor y lo borra al cerrar sesión.
export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const { token: tokenPersonal } = useSesion();
  const { token: tokenCuenta } = useCuenta();
  const { lista } = useSesionLista();
  const tokenSesion = tokenPersonal || tokenCuenta;

  // null = todavía se está leyendo
  const [preferencia, setPreferencia] = useState<boolean | null>(null);
  const [permiso, setPermiso] = useState(false);
  const [citaPendiente, setCitaPendiente] = useState<string | null>(null);
  const registrado = useRef<Registrado | null>(null);
  // La sesión que ya estaba guardada al abrir la app: allí no se vuelve a preguntar
  const tokenRestaurado = useRef<string | null | undefined>(undefined);
  // Los efectos y el AppState leen siempre lo último sin volver a suscribirse
  const actual = useRef({ tokenSesion, preferencia });
  useEffect(() => {
    actual.current = { tokenSesion, preferencia };
  });

  useEffect(() => {
    leerPreferencia().then(setPreferencia);
  }, []);

  // Pide el token del celular y lo registra con la sesión abierta
  const registrar = useCallback(async (sesion: string, pedirPermiso: boolean) => {
    const resultado = await obtenerTokenPush(pedirPermiso);
    setPermiso(resultado.estado === "listo");
    if (resultado.estado !== "listo") return resultado;
    try {
      await registrarDispositivo(sesion, resultado.token);
      registrado.current = { tokenPush: resultado.token, tokenSesion: sesion };
    } catch (e) {
      // Un fallo aquí no debe molestar: se reintenta al volver a abrir la app
      if (!esCancelada(e)) registrarCausa("Registro de notificaciones", e);
    }
    return resultado;
  }, []);

  const desregistrar = useCallback(async () => {
    const guardado = registrado.current;
    registrado.current = null;
    setCitaPendiente(null);
    if (!guardado) return;
    try {
      await borrarDispositivo(guardado.tokenSesion, guardado.tokenPush);
    } catch (e) {
      // Con la sesión vencida (401) o sin internet igual se sigue cerrando la sesión
      registrarCausa("Baja de notificaciones", e);
    }
  }, []);

  // Con una sesión nueva se registra el celular. Si la sesión ya estaba guardada
  // al abrir la app solo se actualiza el token (sin preguntar el permiso otra vez).
  useEffect(() => {
    if (!lista || preferencia === null) return;
    if (tokenRestaurado.current === undefined) tokenRestaurado.current = tokenSesion || null;
    if (!tokenSesion || !preferencia) return;
    registrar(tokenSesion, tokenSesion !== tokenRestaurado.current);
  }, [lista, preferencia, tokenSesion, registrar]);

  // Al volver a la app (por ejemplo desde los ajustes del celular) se revisa el permiso
  useEffect(() => {
    if (!notificacionesDisponibles) return;
    const oyente = AppState.addEventListener("change", (estado) => {
      const { tokenSesion: sesion, preferencia: quiere } = actual.current;
      if (estado === "active" && sesion && quiere) registrar(sesion, false);
    });
    return () => oyente.remove();
  }, [registrar]);

  const alternar = async () => {
    if (!tokenSesion) return;
    if (preferencia && permiso) {
      setPreferencia(false);
      await guardarPreferencia(false);
      await desregistrar();
      return;
    }
    if (!notificacionesDisponibles) {
      avisar(
        "Notificaciones no disponibles",
        Platform.OS === "web"
          ? "Los avisos solo funcionan en la app del celular."
          : "Los avisos no funcionan en Expo Go. Instala la versión de desarrollo de la app para probarlos.",
        "aviso",
      );
      return;
    }
    setPreferencia(true);
    await guardarPreferencia(true);
    const resultado = await registrar(tokenSesion, true);
    if (resultado.estado === "sin-permiso") {
      const ir = await confirmar({
        titulo: "Permiso desactivado",
        mensaje:
          "Las notificaciones están bloqueadas en tu celular. ¿Quieres abrir los ajustes para permitirlas?",
        textoAceptar: "Abrir ajustes",
      });
      if (ir) Linking.openSettings();
    } else if (resultado.estado === "no-disponible") {
      avisar(
        "No se pudieron activar",
        "No se pudo conectar el celular con el servicio de avisos. Revisa tu conexión e intenta de nuevo.",
        "aviso",
      );
    }
  };

  return (
    <NotificacionesContext
      value={{
        visible: Platform.OS !== "web" && !!tokenSesion,
        activas: !!preferencia && permiso && !!tokenSesion,
        alternar,
        desregistrar,
        citaPendiente,
        abrirCitaEnPanel: setCitaPendiente,
        limpiarCitaPendiente: () => setCitaPendiente(null),
      }}
    >
      {children}
    </NotificacionesContext>
  );
}
