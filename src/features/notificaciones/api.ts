import { Platform } from "react-native";
import { request } from "../../services/api/http";

// Token de notificaciones push del celular (Expo Push). Sirve cualquier sesión:
// personal, administradora o cliente con cuenta. El dueño sale de la sesión.

// tokenSesion: el de la sesión abierta; tokenPush: "ExponentPushToken[...]"
export const registrarDispositivo = (tokenSesion: string, tokenPush: string) =>
  request<{ mensaje: string }>("/api/v1/dispositivos", {
    method: "PUT",
    body: { token: tokenPush, plataforma: Platform.OS === "ios" ? "ios" : "android" },
    token: tokenSesion,
  });

// Se llama antes de descartar el token de la sesión. Responde igual si no existía.
// Con poco tiempo de espera: cerrar sesión sin internet no debe quedarse esperando.
export const borrarDispositivo = (tokenSesion: string, tokenPush: string) =>
  request<{ mensaje: string }>("/api/v1/dispositivos", {
    method: "DELETE",
    body: { token: tokenPush },
    token: tokenSesion,
    tiempoLimiteMs: 5_000,
  });
