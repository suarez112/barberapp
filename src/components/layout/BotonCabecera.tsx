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
  // Sobre una franja siempre oscura: fondo oscuro semitransparente e icono amarillo (ambos temas)
  sobreOscuro?: boolean;
};

// Botón cuadrado pequeño de la cabecera
export default function BotonCabecera({ icono, etiqueta, ayuda, onPress, children, sobreOscuro = false }: Props) {
  const { colors } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda ?? etiqueta}
      style={[
        styles.boton,
        sobreOscuro
          ? { backgroundColor: "rgba(0, 0, 0, 0.35)", borderColor: "rgba(250, 204, 21, 0.45)" }
          : { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icono} size={24} color={sobreOscuro ? "#FACC15" : colors.primaryText} />
      {children}
    </Tocable>
  );
}

const styles = StyleSheet.create({
  boton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    position: "relative",
  },
});
