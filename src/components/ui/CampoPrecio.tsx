import { StyleSheet, Text, TextInputProps, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { formatearPrecioEscrito } from "../../utils/formato";
import CampoTexto from "./CampoTexto";

type Props = Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> & {
  // Texto con puntos de miles ("35.000"); se lee con leerPrecio()
  value: string;
  onChangeText: (texto: string) => void;
};

// Precio en pesos: agrega los puntos de miles mientras se escribe (35.000)
export default function CampoPrecio({ value, onChangeText, style, ...props }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.contenedor}>
      {/* El campo tiene marginBottom 10: el signo se centra en el espacio del texto */}
      <View style={styles.signo} pointerEvents="none">
        <Text style={{ color: colors.textSecondary }}>$</Text>
      </View>
      <CampoTexto
        keyboardType="number-pad"
        maxLength={13}
        {...props}
        value={value}
        onChangeText={(texto) => onChangeText(formatearPrecioEscrito(texto))}
        style={[styles.campo, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { justifyContent: "center" },
  signo: { position: "absolute", left: 14, top: 0, bottom: 10, justifyContent: "center", zIndex: 1 },
  campo: { paddingLeft: 28 },
});
