import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";

// Aviso corto en rojo (lista vacía, paso pendiente)
export default function TextoInfo({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.texto, { color: colors.peligroTexto }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  texto: { fontSize: 13, marginVertical: 10 },
});
