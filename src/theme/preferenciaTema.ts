import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Cómo se elige el tema: seguir al teléfono (por defecto), siempre claro o siempre oscuro.
// Se guarda en el celular; en web no hay almacenamiento seguro y queda solo en memoria.
export type PreferenciaTema = "sistema" | "claro" | "oscuro";

const CLAVE = "tema";

export async function leerPreferenciaTema(): Promise<PreferenciaTema> {
  if (Platform.OS === "web") return "sistema";
  try {
    const valor = await SecureStore.getItemAsync(CLAVE);
    return valor === "claro" || valor === "oscuro" ? valor : "sistema";
  } catch {
    return "sistema";
  }
}

export async function guardarPreferenciaTema(preferencia: PreferenciaTema) {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.setItemAsync(CLAVE, preferencia);
  } catch (e) {
    console.log("No se pudo guardar el tema", String(e));
  }
}
