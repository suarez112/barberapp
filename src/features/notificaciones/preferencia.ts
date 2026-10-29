import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Si la persona quiere recibir avisos en este celular (opción del menú).
// Por defecto sí; en web no hay almacenamiento seguro y no hay avisos.
const CLAVE = "notificaciones";

export async function leerPreferencia(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return (await SecureStore.getItemAsync(CLAVE)) !== "no";
  } catch {
    return true;
  }
}

export async function guardarPreferencia(activas: boolean) {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.setItemAsync(CLAVE, activas ? "si" : "no");
  } catch (e) {
    console.log("No se pudo guardar la preferencia de notificaciones", String(e));
  }
}
