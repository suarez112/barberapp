import * as ImagePicker from "expo-image-picker";
import { avisar } from "./dialogos";

// Foto elegida con expo-image-picker. En web llega además como File.
export type FotoElegida = {
  uri: string;
  nombre: string;
  tipo: string; // "image/jpeg"
  archivo?: Blob;
};

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const PESO_MAXIMO = 5 * 1024 * 1024;

type Opciones = { aspecto: [number, number]; calidad?: number };

// Abre la galería y revisa formato y peso como el backend (JPG/PNG/WEBP, 5 MB).
// Devuelve undefined si se cancela o la foto no sirve (ya avisado).
export const elegirFoto = async ({
  aspecto,
  calidad = 0.7,
}: Opciones): Promise<FotoElegida | undefined> => {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: aspecto,
    quality: calidad,
  });
  if (r.canceled || !r.assets?.length) return undefined;
  const foto = r.assets[0];
  const tipo = foto.mimeType ?? "image/jpeg";

  // El backend vuelve a revisar el contenido; aquí se avisa antes de subir
  if (!TIPOS_PERMITIDOS.includes(tipo)) {
    avisar("Formato no válido", "La foto debe ser una imagen JPG, PNG o WEBP");
    return undefined;
  }
  if (foto.fileSize && foto.fileSize > PESO_MAXIMO) {
    avisar("Foto muy pesada", "La foto no puede pesar más de 5 MB");
    return undefined;
  }
  return {
    uri: foto.uri,
    nombre: foto.fileName ?? `foto.${tipo.split("/")[1]}`,
    tipo,
    archivo: foto.file ?? undefined,
  };
};

// Cuerpo multipart/form-data con la foto en el campo "foto"
export const formularioFoto = (foto: FotoElegida) => {
  const datos = new FormData();
  if (foto.archivo) datos.append("foto", foto.archivo, foto.nombre);
  else
    // En Android/iOS, React Native lee el archivo desde la uri
    datos.append("foto", {
      uri: foto.uri,
      name: foto.nombre,
      type: foto.tipo,
    } as unknown as Blob);
  return datos;
};
