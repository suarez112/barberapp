import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useMemo } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { registrarCausa } from "@/services/api/errores";
import { avisar } from "@/utils/dialogos";
import { aBase64, qrPng } from "@/utils/qr";

type Props = {
  enlace: string;
  // Para el nombre del archivo, ej. "qr-CENTRAL10.png"
  codigo: string;
};

const TAMANO = 220;

// En el navegador el PNG se descarga; en el celular se abre "Compartir" para guardarlo
// (Archivos, Drive, WhatsApp...)
async function guardarPng(png: Uint8Array, nombre: string) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([png as BlobPart], { type: "image/png" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Compartir archivos no está disponible en este celular");
  }
  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.create();
  archivo.write(png);
  await Sharing.shareAsync(archivo.uri, {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle: "Guardar código QR",
  });
}

// Código QR del enlace del negocio con el botón "Descargar QR"
export default function CodigoQr({ enlace, codigo }: Props) {
  const png = useMemo(() => qrPng(enlace), [enlace]);
  const uri = useMemo(() => `data:image/png;base64,${aBase64(png)}`, [png]);

  const descargar = async () => {
    try {
      await guardarPng(png, `qr-${codigo}.png`);
    } catch (error) {
      registrarCausa("Descargar QR", error);
      avisar("No se pudo guardar el QR", "Intenta de nuevo en unos segundos.", "error");
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* Fondo blanco fijo: el QR se lee mal sobre un fondo oscuro */}
      <View style={styles.marco}>
        <Image
          source={{ uri }}
          style={styles.imagen}
          accessibilityLabel="Código QR del enlace de tu negocio"
        />
      </View>
      <Boton
        titulo="DESCARGAR QR"
        ayuda="Guarda la imagen del código QR para imprimirla o compartirla"
        variante="secundario"
        onPress={descargar}
        style={styles.boton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", marginTop: 12 },
  marco: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 6 },
  imagen: { width: TAMANO, height: TAMANO },
  boton: { alignSelf: "stretch", marginTop: 10 },
});
