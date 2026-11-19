import { Platform, Pressable, PressableProps, StyleSheet } from "react-native";

// Pressable con retroalimentación táctil (escala + opacidad) y hover en web.
export default function Tocable({ style, disabled, ...props }: PressableProps) {
  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={(estado) => [
        Platform.OS === "web" && !disabled && styles.webInteractivo,
        typeof style === "function" ? style(estado) : style,
        !disabled && estado.hovered && styles.hover,
        !disabled && estado.pressed && styles.presionado,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  webInteractivo: {
    cursor: "pointer",
    transitionProperty: "transform, opacity, background-color, border-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease-out",
  } as any,
  hover: {
    opacity: 0.88,
  },
  presionado: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
