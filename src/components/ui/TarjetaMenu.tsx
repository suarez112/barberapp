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
};

// Opción grande de un menú (ícono, título, descripción y flecha)
export default function TarjetaMenu({ icono, titulo, descripcion, onPress }: Props) {
  const { colors } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={descripcion}
      style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      onPress={onPress}
    >
      <Ionicons name={icono} size={32} color={colors.primaryText} />
      <View style={styles.textos}>
        <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
        <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
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
  textos: { marginLeft: 14, flex: 1 },
});
