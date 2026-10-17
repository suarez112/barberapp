import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";

type Props = { children: React.ReactNode; style?: StyleProp<TextStyle> };

export default function TituloSeccion({ children, style }: Props) {
  const { colors } = useAppTheme();
  return (
    <Text style={[styles.titulo, { color: colors.primary }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 1,
  },
});
