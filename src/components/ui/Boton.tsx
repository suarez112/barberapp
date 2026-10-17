import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { COLORES } from "../../theme/paleta";

type Variante = "primario" | "neutro" | "peligro";

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function Boton({
  titulo,
  onPress,
  variante = "primario",
  style,
  textStyle,
}: Props) {
  const { colors } = useAppTheme();
  const fondo = {
    primario: colors.primary,
    neutro: COLORES.neutro,
    peligro: COLORES.peligroOscuro,
  }[variante];
  const colorTexto =
    variante === "primario" ? COLORES.textoSobrePrimario : COLORES.blanco;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: fondo },
        pressed && styles.presionado,
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
  boton: { padding: 16, borderRadius: 8, alignItems: "center", marginTop: 5 },
  presionado: { opacity: 0.7 },
  texto: { fontWeight: "bold", fontSize: 14, letterSpacing: 1 },
});
