import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { descargarConToken, ErrorDeEnvio } from "@/services/api/http";
import { FormatoExportacion } from "./api";

const TIPOS: Record<FormatoExportacion, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

const TIEMPO_LIMITE_MS = 60_000;

// Descarga el reporte con la sesión del administrador y lo comparte (Android/iOS) o lo baja (web).
// Lanza ApiError / ErrorDeConexion / ErrorDeEnvio como `request()`, para mostrarlos igual
// (la descarga usa descargarConToken de http.ts).
export async function descargarReporte(
  ruta: string,
  token: string,
  nombre: string,
  formato: FormatoExportacion,
) {
  const bytes = await descargarConToken(
    ruta,
    { token, tiempoLimiteMs: TIEMPO_LIMITE_MS },
    async (respuesta) => new Uint8Array(await respuesta.arrayBuffer()),
  );

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
