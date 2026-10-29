import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Barbero } from "@/types";
import { UsuarioCuenta } from "../cuenta/api";

// La sesión se guarda cifrada en el celular (Keychain en iOS, Keystore en Android).
// En web no hay almacenamiento seguro: allí la sesión vive solo en memoria.

const CLAVE = "sesion";

export type SesionGuardada =
  | { tipo: "personal"; token: string; barbero: Barbero }
  | { tipo: "cuenta"; token: string; usuario: UsuarioCuenta };

const disponible = Platform.OS !== "web";

export async function leerSesion(): Promise<SesionGuardada | null> {
  if (!disponible) return null;
  try {
    const texto = await SecureStore.getItemAsync(CLAVE);
    return texto ? (JSON.parse(texto) as SesionGuardada) : null;
  } catch (error) {
    console.error("No se pudo leer la sesión guardada:", error);
    return null;
  }
}

// Si falla, la sesión sigue abierta; solo habrá que iniciarla de nuevo al reabrir
export async function guardarSesion(sesion: SesionGuardada) {
  if (!disponible) return;
  try {
    await SecureStore.setItemAsync(CLAVE, JSON.stringify(sesion));
  } catch (error) {
    console.error("No se pudo guardar la sesión:", error);
  }
}

export async function borrarSesion() {
  if (!disponible) return;
  try {
    await SecureStore.deleteItemAsync(CLAVE);
  } catch (error) {
    console.error("No se pudo borrar la sesión guardada:", error);
  }
}
