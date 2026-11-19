import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { COLORES, textoSobre } from "../../theme/paleta";

type Variante = "primario" | "secundario" | "peligro";

type Props = {
  titulo: string;
  onPress: () => void;
  // Qué pasa al tocarlo, para TalkBack / VoiceOver
  ayuda: string;
  // Nombre para el lector de pantalla (por defecto el título en minúsculas)
  etiqueta?: string;
  variante?: Variante;
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// "ENTRAR AL NEGOCIO" -> "Entrar al negocio": los lectores no deletrean las mayúsculas
export const comoFrase = (texto: string) =>
  texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

export default function Boton({
  titulo,
  onPress,
  ayuda,
  etiqueta,
  variante = "primario",
  deshabilitado = false,
  style,
  textStyle,
}: Props) {
  const { colors } = useAppTheme();
  const estilos = {
    primario: { backgroundColor: colors.primary, color: colors.onPrimary },
    secundario: {
      backgroundColor: colors.secundarioBg,
      color: colors.secundarioTexto,
      borderWidth: 1.5,
      borderColor: colors.secundarioBorde,
    },
    peligro: { backgroundColor: COLORES.rojo, color: textoSobre(COLORES.rojo) },
  }[variante];
  const { color: colorTexto, ...fondo } = estilos;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? comoFrase(titulo)}
      accessibilityHint={ayuda}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.boton,
        Platform.OS === "web" && !deshabilitado && styles.webInteractivo,
        fondo,
        !deshabilitado && hovered && styles.hover,
        !deshabilitado && pressed && styles.presionado,
        deshabilitado && styles.deshabilitado,
        style,
      ]}
    >
      <Text style={[styles.texto, { color: colorTexto }, textStyle]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  webInteractivo: {
    cursor: "pointer",
    transitionProperty: "transform, opacity, background-color, border-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease-out",
  } as any,
  hover: {
    opacity: 0.9,
  },
  presionado: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  deshabilitado: {
    opacity: 0.5,
  },
  texto: {
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
