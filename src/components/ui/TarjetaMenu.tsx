import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { estilosTexto } from "./estilosTexto";
import Tocable from "./Tocable";

type Props = {
  icono: ComponentProps<typeof Ionicons>["name"];
  titulo: string;
  descripcion: string;
  onPress: () => void;
  // Versión más alta y con letra mayor (pantallas de celular con franja de marca)
  grande?: boolean;
};

// Opción grande de un menú (ícono, título, descripción y flecha)
export default function TarjetaMenu({ icono, titulo, descripcion, onPress, grande = false }: Props) {
  const { colors } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={descripcion}
      style={[styles.tarjeta, grande && styles.tarjetaGrande, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      onPress={onPress}
    >
      <Ionicons name={icono} size={grande ? 40 : 32} color={colors.primaryText} />
      <View style={styles.textos}>
        <Text style={[estilosTexto.titulo, grande && styles.tituloGrande, { color: colors.textPrimary }]}>{titulo}</Text>
        <Text style={[estilosTexto.subtitulo, grande && styles.descripcionGrande, { color: colors.textSecondary }]}>
          {descripcion}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Tocable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
  },
  tarjetaGrande: { paddingVertical: 26, paddingHorizontal: 20, borderRadius: 14, minHeight: 104 },
  tituloGrande: { fontSize: 17 },
  descripcionGrande: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  textos: { marginLeft: 14, flex: 1 },
});
