import { requireOptionalNativeModule } from "expo";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export type ModuloNotificaciones = typeof import("expo-notifications");

// Expo Go no trae las notificaciones push (Android, desde el SDK 53) y la web no
// las usa: en esos casos el módulo ni se carga, así la app sigue abriendo igual.
// Se detecta por tres señales; con una basta (la app instalada no cumple ninguna).
export const enExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  // En Android, expo-notifications necesita este módulo nativo y Expo Go no lo trae
  (Platform.OS === "android" && !requireOptionalNativeModule("ExpoTopicSubscriptionModule"));

export const notificacionesDisponibles = Platform.OS !== "web" && !enExpoGo;

let carga: Promise<ModuloNotificaciones | null> | null = null;

// Carga expo-notifications la primera vez que se pide (null si no está disponible
// o si falla al cargar: nunca rompe la app)
export function cargarNotificaciones(): Promise<ModuloNotificaciones | null> {
  if (!notificacionesDisponibles) return Promise.resolve(null);
  carga ??= import("expo-notifications")
    .then((N) => {
      // Con la app abierta también se muestra el aviso
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return N;
    })
    .catch((e) => {
      console.log("No se pudo cargar expo-notifications", String(e));
      return null;
    });
  return carga;
}

export type ResultadoToken =
  | { estado: "listo"; token: string }
  // La persona no dio permiso en el celular
  | { estado: "sin-permiso" }
  // Expo Go, web, sin internet o la app sin configurar (projectId)
  | { estado: "no-disponible" };

// Obtiene el token push del celular. Con pedirPermiso muestra el aviso de permiso
// del sistema si todavía no se había decidido; sin él solo usa el permiso actual.
export async function obtenerTokenPush(pedirPermiso: boolean): Promise<ResultadoToken> {
  try {
    const N = await cargarNotificaciones();
    if (!N) return { estado: "no-disponible" };

    // Android 13 pide que exista el canal antes de preguntar por el permiso
    if (Platform.OS === "android") {
      await N.setNotificationChannelAsync("default", {
        name: "Citas",
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    let permiso = await N.getPermissionsAsync();
    if (permiso.status !== "granted" && pedirPermiso && permiso.canAskAgain) {
      permiso = await N.requestPermissionsAsync();
    }
    if (permiso.status !== "granted") return { estado: "sin-permiso" };

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.log("Notificaciones: falta el projectId de EAS (ejecuta `eas init`).");
      return { estado: "no-disponible" };
    }
    const { data } = await N.getExpoPushTokenAsync({ projectId });
    return { estado: "listo", token: data };
  } catch (e) {
    // Sin internet o sin Firebase configurado: no es un error de la persona
    console.log("No se pudo obtener el token de notificaciones", String(e));
    return { estado: "no-disponible" };
  }
}
