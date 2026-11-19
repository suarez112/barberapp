import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";

type Props = {
  children: React.ReactNode;
  esError?: boolean;
};

// Aviso informativo neutro (lista vacía, paso pendiente) o de error explícito
export default function TextoInfo({ children, esError = false }: Props) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={[
        styles.texto,
        { color: esError ? colors.peligroTexto : colors.textSecondary },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  texto: { fontSize: 13, marginVertical: 10 },
});
