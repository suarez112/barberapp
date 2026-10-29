import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

type Props = {
  icono: ComponentProps<typeof Ionicons>["name"];
  color: string;
  onPress: () => void;
  etiqueta: string; // lectores de pantalla
  ayuda?: string; // qué pasa al tocarlo
  tamano?: number;
  style?: StyleProp<ViewStyle>;
};

// Botón de solo ícono: la zona táctil mide al menos 44 x 44
export default function BotonIcono({
  icono,
  color,
  onPress,
  etiqueta,
  ayuda,
  tamano = 20,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda}
      onPress={onPress}
      style={({ pressed }) => [styles.boton, style, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icono} size={tamano} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
