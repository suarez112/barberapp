import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { urlBandera } from "@/utils/telefonos";

type Props = { pais: string; ancho?: number };

// Bandera del país como imagen pequeña (3:2). Es decorativa: el país ya se lee en el texto.
// Si no se puede descargar, muestra el código del país ("CO") en su lugar.
export default function Bandera({ pais, ancho = 24 }: Props) {
  const { colors } = useAppTheme();
  const [fallo, setFallo] = useState(false);
  const alto = Math.round((ancho * 2) / 3);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.marco, { width: ancho, height: alto, borderColor: colors.cardBorder }]}
    >
      {fallo ? (
        <Text style={[styles.codigo, { color: colors.textSecondary }]}>{pais.toUpperCase()}</Text>
      ) : (
        <Image
          source={{ uri: urlBandera(pais) }}
          style={styles.imagen}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setFallo(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imagen: { width: "100%", height: "100%" },
  codigo: { fontSize: 9, fontWeight: "bold" },
});
