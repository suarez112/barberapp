import { StyleSheet, Text } from "react-native";
import { COLORES } from "../../theme/paleta";

// Aviso corto en rojo (lista vacía, paso pendiente)
export default function TextoInfo({ children }: { children: React.ReactNode }) {
  return <Text style={styles.texto}>{children}</Text>;
}

const styles = StyleSheet.create({
  texto: { color: COLORES.peligro, fontSize: 13, marginVertical: 10 },
});
