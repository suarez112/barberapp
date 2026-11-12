import Constants from "expo-constants";
import { Platform } from "react-native";

const PUERTO_BACKEND = 4000;

// Durante el desarrollo, el celular ya sabe la IP del PC: es la misma del
// servidor de Expo (Metro). Así no hay que escribir la IP a mano.
const hostDelServidorDeDesarrollo = (): string | undefined =>
  Constants.expoConfig?.hostUri?.split(":")[0];

// Fuera de desarrollo no hay valores por defecto: sin una URL https válida
// la app falla al arrancar con un mensaje claro, en vez de llamar a localhost
// o enviar tokens y contraseñas por http.
const resolverUrlProduccion = (): string => {
  const desdeEntorno = process.env.EXPO_PUBLIC_API_URL;
  if (!desdeEntorno) {
    throw new Error(
      "Falta EXPO_PUBLIC_API_URL. Define la URL https:// del backend antes de generar el build.",
    );
  }
  if (!desdeEntorno.startsWith("https://")) {
    throw new Error(
      "EXPO_PUBLIC_API_URL debe empezar por https:// fuera de desarrollo.",
    );
  }
  return desdeEntorno.replace(/\/$/, "");
};

const resolverUrlBase = (): string => {
  if (!__DEV__) return resolverUrlProduccion();

  // 1. Prioridad: variable de entorno (ver .env.example)
  const desdeEntorno = process.env.EXPO_PUBLIC_API_URL;
  if (desdeEntorno) return desdeEntorno.replace(/\/$/, "");

  if (Platform.OS === "web") return `http://localhost:${PUERTO_BACKEND}`;

  // 2. Misma máquina que sirve el bundle de Expo
  const host = hostDelServidorDeDesarrollo();
  if (host) return `http://${host}:${PUERTO_BACKEND}`;

  // 3. Emulador de Android: 10.0.2.2 es el "localhost" del PC
  return Platform.OS === "android"
    ? `http://10.0.2.2:${PUERTO_BACKEND}`
    : `http://localhost:${PUERTO_BACKEND}`;
};

export const API_BASE_URL = resolverUrlBase();
