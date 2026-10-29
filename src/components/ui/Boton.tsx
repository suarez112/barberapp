import {
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
const comoFrase = (texto: string) =>
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
  // Secundario: fondo y borde del tema (Cancelar, acciones de apoyo); no es negro ni amarillo
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
      style={({ pressed }) => [
        styles.boton,
        fondo,
        pressed && styles.presionado,
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  presionado: { opacity: 0.7 },
  deshabilitado: { opacity: 0.5 },
  texto: { fontWeight: "bold", fontSize: 14, letterSpacing: 1, textAlign: "center" },
});
