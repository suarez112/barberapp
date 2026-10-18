import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, ReactNode } from "react";
import { StyleSheet } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  icono: ComponentProps<typeof Ionicons>["name"];
  etiqueta: string;
  onPress: () => void;
  children?: ReactNode; // ej. punto de "sin leer"
};

// Botón cuadrado pequeño de la cabecera
export default function BotonCabecera({ icono, etiqueta, onPress, children }: Props) {
  const { colors } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={[
        styles.boton,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icono} size={16} color={colors.primary} />
      {children}
    </Tocable>
  );
}

const styles = StyleSheet.create({
  boton: { padding: 6, borderRadius: 6, borderWidth: 1, position: "relative" },
});
