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

const esObjeto = (dato: unknown): dato is Record<string, unknown> =>
  typeof dato === "object" && dato !== null;
const esTexto = (dato: unknown): dato is string => typeof dato === "string" && dato !== "";

// Lo guardado puede venir de una versión anterior de la app o estar dañado:
// se revisa lo mínimo que la app usa antes de abrir la sesión
const esSesionGuardada = (dato: unknown): dato is SesionGuardada => {
  if (!esObjeto(dato) || !esTexto(dato.token)) return false;
  if (dato.tipo === "personal") {
    return esObjeto(dato.barbero) && esTexto(dato.barbero.id) && esTexto(dato.barbero.nombre);
  }
  if (dato.tipo === "cuenta") {
    return esObjeto(dato.usuario) && esTexto(dato.usuario.id) && esTexto(dato.usuario.rol);
  }
  return false;
};

export async function leerSesion(): Promise<SesionGuardada | null> {
  if (!disponible) return null;
  try {
    const texto = await SecureStore.getItemAsync(CLAVE);
    if (!texto) return null;
    const dato: unknown = JSON.parse(texto);
    if (esSesionGuardada(dato)) return dato;
    console.error("La sesión guardada no tiene la forma esperada; se descarta.");
    await borrarSesion();
    return null;
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
