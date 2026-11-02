import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useImagenProtegida } from "@/hooks/useImagenProtegida";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  // Ruta de la imagen en el backend (exige el token)
  ruta: string;
  token: string;
  // Texto para el lector de pantalla y el pie de la imagen
  etiqueta: string;
  // Cambia al subir un QR nuevo para descargarlo otra vez
  version?: number;
  // Lado máximo en px; en pantallas angostas se encoge
  tamano?: number;
};

// Código QR descargado con el token. Va sobre fondo blanco aunque el tema sea oscuro:
// un QR necesita contraste para que la cámara lo lea.
export default function ImagenQr({ ruta, token, etiqueta, version = 0, tamano = 320 }: Props) {
  const { colors } = useAppTheme();
  const { uri, fallo, cargando } = useImagenProtegida(ruta, token, version);

  return (
    <View style={styles.contenedor}>
      <View style={[styles.marco, { maxWidth: tamano, borderColor: colors.cardBorder }]}>
        {uri ? (
          <Image
            source={{ uri }}
            accessibilityRole="image"
            accessibilityLabel={etiqueta}
            resizeMode="contain"
            style={styles.imagen}
          />
        ) : cargando ? (
          <ActivityIndicator accessibilityLabel="Cargando el código QR" color="#111" />
        ) : (
          <Text style={styles.fallo}>{fallo ? "No se pudo cargar el código QR." : ""}</Text>
        )}
      </View>
      <Text style={[styles.pie, { color: colors.textSecondary }]}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", gap: 8 },
  marco: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  imagen: { width: "100%", height: "100%" },
  fallo: { color: "#111", fontSize: 14, textAlign: "center" },
  pie: { fontSize: 13, fontWeight: "600" },
});
