import { StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";
import { telefonoMostrado } from "@/utils/telefonos";
import Bandera from "./Bandera";

type Props = {
  telefono?: string | null;
  indicativo?: string | null;
  style?: StyleProp<TextStyle>;
  // Texto después del número (ej. " · Reservas con tu cuenta")
  sufijo?: string;
};

// Teléfono guardado con la bandera de su país: "🇨🇴 +57 316 278 1393" pero con imagen
export default function TelefonoConBandera({ telefono, indicativo, style, sufijo }: Props) {
  const { pais, texto } = telefonoMostrado(telefono, indicativo);
  return (
    <View style={styles.fila}>
      {pais ? <Bandera pais={pais} ancho={20} /> : null}
      <Text style={[style, styles.texto]}>
        {texto}
        {sufijo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  texto: { flexShrink: 1 },
});
