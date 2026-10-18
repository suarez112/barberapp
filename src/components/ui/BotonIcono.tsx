import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

type Props = {
  icono: ComponentProps<typeof Ionicons>["name"];
  color: string;
  onPress: () => void;
  etiqueta: string; // lectores de pantalla
  tamano?: number;
  style?: StyleProp<ViewStyle>;
};

const AREA_TOQUE = { top: 8, bottom: 8, left: 8, right: 8 };

export default function BotonIcono({
  icono,
  color,
  onPress,
  etiqueta,
  tamano = 20,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      hitSlop={AREA_TOQUE}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icono} size={tamano} color={color} />
    </Pressable>
  );
}
