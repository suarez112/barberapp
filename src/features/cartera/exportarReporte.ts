import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { API_BASE_URL } from "@/services/api/config";
import { ApiError, ErrorDeConexion, ErrorDeEnvio } from "@/services/api/http";
import { FormatoExportacion } from "./api";

const TIPOS: Record<FormatoExportacion, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

const TIEMPO_LIMITE_MS = 60_000;

// Descarga el reporte con la sesión del administrador y lo comparte (Android/iOS) o lo baja (web).
// Lanza ApiError / ErrorDeConexion / ErrorDeEnvio como `request()`, para mostrarlos igual.
export async function descargarReporte(
  ruta: string,
  token: string,
  nombre: string,
  formato: FormatoExportacion,
) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);
  let bytes: Uint8Array;
  try {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controlador.signal,
      });
    } catch (e) {
      throw new ErrorDeConexion(e, controlador.signal.aborted ? "tiempo-agotado" : "sin-conexion");
    }
    if (!respuesta.ok) {
      // Los errores del backend son JSON: { error, codigo?, funcion?, planRequerido? }
      const cuerpo = await respuesta.json().catch(() => undefined);
      throw new ApiError(
        typeof cuerpo?.error === "string" ? cuerpo.error : "",
        respuesta.status,
        typeof cuerpo?.codigo === "string"
          ? { codigo: cuerpo.codigo, funcion: cuerpo.funcion, planRequerido: cuerpo.planRequerido }
          : undefined,
      );
    }
    try {
      bytes = new Uint8Array(await respuesta.arrayBuffer());
    } catch (e) {
      throw new ErrorDeConexion(e, controlador.signal.aborted ? "tiempo-agotado" : "sin-conexion");
    }
  } finally {
    clearTimeout(temporizador);
  }

  try {
    if (Platform.OS === "web") {
      const enlace = document.createElement("a");
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: TIPOS[formato] }));
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(url);
      return;
    }
    const archivo = new File(Paths.cache, nombre);
    archivo.create({ overwrite: true });
    archivo.write(bytes);
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error("Este celular no puede compartir archivos.");
    }
    await Sharing.shareAsync(archivo.uri, {
      mimeType: TIPOS[formato],
      dialogTitle: "Reporte de la cartera",
      UTI: formato === "pdf" ? "com.adobe.pdf" : "org.openxmlformats.spreadsheetml.sheet",
    });
  } catch (e) {
    throw new ErrorDeEnvio(e);
  }
}
