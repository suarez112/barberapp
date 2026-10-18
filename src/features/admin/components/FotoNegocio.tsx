import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { FotoElegida } from "../../cuenta/api";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const PESO_MAXIMO = 5 * 1024 * 1024;

type Props = {
  fotoUrl: string | null;
  onGuardar: (foto: FotoElegida) => Promise<boolean>;
};

// Foto del negocio: se elige de la galería, se ve antes de guardar y luego se sube
export default function FotoNegocio({ fotoUrl, onGuardar }: Props) {
  const { colors } = useAppTheme();
  const [pendiente, setPendiente] = useState<FotoElegida | null>(null);
  const [guardando, setGuardando] = useState(false);

  const elegir = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (r.canceled || !r.assets?.length) return;
    const foto = r.assets[0];
    const tipo = foto.mimeType ?? "image/jpeg";

    // El backend vuelve a revisar el contenido; aquí se avisa antes de subir
    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      avisar("Formato no válido", "La foto debe ser una imagen JPG, PNG o WEBP");
      return;
    }
    if (foto.fileSize && foto.fileSize > PESO_MAXIMO) {
      avisar("Foto muy pesada", "La foto no puede pesar más de 5 MB");
      return;
    }

    setPendiente({
      uri: foto.uri,
      nombre: foto.fileName ?? `foto.${tipo.split("/")[1]}`,
      tipo,
      archivo: foto.file ?? undefined,
    });
  };

  const guardar = async () => {
    if (!pendiente || guardando) return;
    setGuardando(true);
    const ok = await onGuardar(pendiente);
    setGuardando(false);
    if (ok) setPendiente(null);
  };

  const mostrada = pendiente?.uri ?? fotoUrl;

  return (
    <View>
      <TituloSeccion>FOTO DEL NEGOCIO</TituloSeccion>
      <View
        style={[
          styles.marco,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          pendiente && { borderColor: colors.primary },
        ]}
      >
        {mostrada ? (
          <Image
            source={{ uri: mostrada }}
            style={styles.foto}
            contentFit="cover"
            accessibilityLabel="Foto del negocio"
          />
        ) : (
          <View style={styles.vacia}>
            <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary }}>
              Tu negocio aún no tiene foto
            </Text>
          </View>
        )}
      </View>

      {pendiente ? (
        <>
          <Text style={[styles.aviso, { color: colors.primary }]}>
            Vista previa: la foto aún no se ha guardado.
          </Text>
          <Boton
            titulo={guardando ? "GUARDANDO…" : "GUARDAR FOTO"}
            onPress={guardar}
          />
          <Boton
            titulo="CANCELAR"
            variante="neutro"
            onPress={() => setPendiente(null)}
          />
        </>
      ) : (
        <Boton
          titulo={fotoUrl ? "CAMBIAR FOTO" : "SUBIR FOTO"}
          variante="neutro"
          onPress={elegir}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    aspectRatio: 4 / 3,
    marginBottom: 8,
  },
  foto: { width: "100%", height: "100%" },
  vacia: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  aviso: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
});
