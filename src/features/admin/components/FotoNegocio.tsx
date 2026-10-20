import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { elegirFoto, FotoElegida } from "@/utils/imagenes";

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
    const foto = await elegirFoto({ aspecto: [4, 3], calidad: 0.8 });
    if (foto) setPendiente(foto);
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
          <Text style={[styles.aviso, { color: colors.primaryText }]}>
            Vista previa: la foto aún no se ha guardado.
          </Text>
          <Boton
            titulo={guardando ? "GUARDANDO…" : "GUARDAR FOTO"}
            ayuda="Sube la foto elegida como foto del negocio"
            onPress={guardar}
          />
          <Boton
            titulo="CANCELAR"
            ayuda="Descarta la foto elegida"
            variante="secundario"
            onPress={() => setPendiente(null)}
          />
        </>
      ) : (
        <Boton
          titulo={fotoUrl ? "CAMBIAR FOTO" : "SUBIR FOTO"}
          ayuda="Abre tu galería para elegir la foto del negocio"
          variante="secundario"
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
