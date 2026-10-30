import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import FotoImagen from "@/components/ui/FotoImagen";
import ZonaFoto from "@/components/ui/ZonaFoto";
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
      {mostrada ? (
        <View
          style={[
            styles.marco,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            pendiente && { borderColor: colors.primary },
          ]}
        >
          <FotoImagen uri={mostrada} style={styles.foto} accessibilityLabel="Foto del negocio" />
          {guardando ? (
          <View style={styles.subiendo} accessibilityLabel="Subiendo la foto" accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.textoSubiendo}>Subiendo foto…</Text>
          </View>
          ) : null}
        </View>
      ) : (
        <ZonaFoto
          etiqueta="Elegir foto del negocio"
          ayuda="Abre tu galería para elegir la foto del negocio"
          onPress={elegir}
          style={styles.zonaVacia}
        />
      )}

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
  zonaVacia: { aspectRatio: 4 / 3, marginBottom: 8 },
  subiendo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  textoSubiendo: { color: "#fff", fontWeight: "bold" },
  aviso: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
});
