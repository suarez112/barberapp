import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
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
// Antes de subirla, la foto se reduce a este lado máximo y se comprime en el celular
const LADO_MAXIMO = 1080;
const CALIDAD_SUBIDA = 0.75;

type Opciones = { aspecto: [number, number]; calidad?: number };

// Peso real del archivo cuando el selector no lo informa (Android a veces no lo hace)
const pesoDe = (foto: ImagePicker.ImagePickerAsset) => {
  if (foto.fileSize) return foto.fileSize;
  if (Platform.OS === "web") return foto.file?.size;
  try {
    return new File(foto.uri).size;
  } catch {
    return undefined;
  }
};

// Reduce la foto a LADO_MAXIMO px (sin agrandar las pequeñas) y la guarda como JPG comprimido
const reducirFoto = async (foto: ImagePicker.ImagePickerAsset): Promise<FotoElegida> => {
  const contexto = ImageManipulator.manipulate(foto.uri);
  if (Math.max(foto.width, foto.height) > LADO_MAXIMO) {
    contexto.resize(foto.width >= foto.height ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO });
  }
  const imagen = await contexto.renderAsync();
  const resultado = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: CALIDAD_SUBIDA });
  return {
    uri: resultado.uri,
    nombre: "foto.jpg",
    tipo: "image/jpeg",
    // En web el formulario necesita los bytes; en el celular se lee el archivo
    archivo: Platform.OS === "web" ? await (await fetch(resultado.uri)).blob() : undefined,
  };
};

// Abre la galería, revisa formato y peso como el backend (JPG/PNG/WEBP, 5 MB) y deja la foto lista
// para subir: máximo 1080 px de lado y comprimida.
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
    avisar("Formato no permitido", "La foto debe ser una imagen JPG, PNG o WEBP.", "error");
    return undefined;
  }
  const peso = pesoDe(foto);
  if (peso && peso > PESO_MAXIMO) {
    const megas = (peso / 1024 / 1024).toFixed(1).replace(".", ",");
    avisar("Archivo muy grande", `La foto pesa ${megas} MB y el máximo es 5 MB.`, "error");
    return undefined;
  }
  try {
    return await reducirFoto(foto);
  } catch {
    avisar("No se pudo preparar la foto", "Intenta con otra imagen.", "error");
    return undefined;
  }
};

// Cuerpo multipart/form-data con la foto en el campo "foto".
// En Android/iOS el fetch de Expo (expo/fetch) solo acepta archivos que sepan
// leer sus bytes: el File de expo-file-system. El formato antiguo de React Native
// ({ uri, name, type }) falla con "Unsupported FormDataPart implementation".
export const formularioFoto = (foto: FotoElegida) => {
  const datos = new FormData();
  if (foto.archivo) datos.append("foto", foto.archivo, foto.nombre);
  else datos.append("foto", new File(foto.uri) as unknown as Blob);
  return datos;
};
