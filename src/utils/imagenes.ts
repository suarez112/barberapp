import * as ImagePicker from "expo-image-picker";

// Abre la galería para elegir una foto cuadrada. Devuelve la URI o undefined si se cancela.
export const elegirImagenCuadrada = async (): Promise<string | undefined> => {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  return !r.canceled && r.assets?.length ? r.assets[0].uri : undefined;
};
