import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { formatearPrecioEscrito } from "../../utils/formato";
import CampoTexto, { PropsCampo } from "./CampoTexto";

type Props = Omit<PropsCampo, "value" | "onChangeText" | "keyboardType" | "izquierda"> & {
  // Texto con puntos de miles ("35.000"); se lee con leerPrecio()
  value: string;
  onChangeText: (texto: string) => void;
};

// Precio en pesos: agrega los puntos de miles mientras se escribe (35.000)
export default function CampoPrecio({ value, onChangeText, ...props }: Props) {
  const { colors } = useAppTheme();
  return (
    <CampoTexto
      keyboardType="number-pad"
      maxLength={13}
      {...props}
      value={value}
      onChangeText={(texto) => onChangeText(formatearPrecioEscrito(texto))}
      estiloTexto={styles.texto}
      izquierda={
        <Text style={[styles.signo, { color: colors.textSecondary }]} importantForAccessibility="no">
          $
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  signo: { paddingLeft: 14, fontSize: 15 },
  texto: { paddingLeft: 6 },
});
