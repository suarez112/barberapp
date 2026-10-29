import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type VistaAgenda = "lista" | "linea";

// Última vista elegida en la agenda. En web no hay almacenamiento seguro:
// se recuerda mientras la página siga abierta.
const CLAVE = "vistaAgenda";
let enMemoria: VistaAgenda = "lista";

export async function leerVistaAgenda(): Promise<VistaAgenda> {
  if (Platform.OS === "web") return enMemoria;
  try {
    return (await SecureStore.getItemAsync(CLAVE)) === "linea" ? "linea" : "lista";
  } catch {
    return "lista";
  }
}

export async function guardarVistaAgenda(vista: VistaAgenda) {
  enMemoria = vista;
  if (Platform.OS === "web") return;
  try {
    await SecureStore.setItemAsync(CLAVE, vista);
  } catch (e) {
    console.log("No se pudo guardar la vista de la agenda", String(e));
  }
}
