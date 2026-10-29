import { Pressable, PressableProps, StyleSheet } from "react-native";

// Pressable que se atenúa al tocarlo, como el TouchableOpacity que reemplaza.
// Usar en lugar de Pressable para que todos los botones den la misma respuesta visual.
export default function Tocable({ style, ...props }: PressableProps) {
  return (
    <Pressable
      {...props}
      style={(estado) => [
        typeof style === "function" ? style(estado) : style,
        estado.pressed && styles.presionado,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  presionado: { opacity: 0.6 },
});
