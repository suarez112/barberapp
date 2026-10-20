import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, ReactNode } from "react";
import { StyleSheet } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  icono: ComponentProps<typeof Ionicons>["name"];
  etiqueta: string;
  // Qué pasa al tocarlo
  ayuda?: string;
  onPress: () => void;
  children?: ReactNode; // ej. punto de "sin leer"
};

// Botón cuadrado pequeño de la cabecera
export default function BotonCabecera({ icono, etiqueta, ayuda, onPress, children }: Props) {
  const { colors } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda ?? etiqueta}
      style={[
        styles.boton,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icono} size={20} color={colors.primaryText} />
      {children}
    </Tocable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
});
