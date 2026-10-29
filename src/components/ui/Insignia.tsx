import { StyleSheet, Text } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { textoSobre } from "../../theme/paleta";

type Props = {
  texto: string;
  color: string;
  // Discreta: borde y fondo suaves en vez de relleno de color
  suave?: boolean;
};

export default function Insignia({ texto, color, suave = false }: Props) {
  const { colors } = useAppTheme();
  if (suave) {
    return (
      <Text
        style={[
          styles.insignia,
          styles.suave,
          { borderColor: colors.cardBorder, backgroundColor: colors.inputBg, color: colors.textSecondary },
        ]}
      >
        {texto}
      </Text>
    );
  }
  return <Text style={[styles.insignia, { backgroundColor: color, color: textoSobre(color) }]}>{texto}</Text>;
}

const styles = StyleSheet.create({
  insignia: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  suave: { borderWidth: 1, fontWeight: "600", letterSpacing: 0.5 },
});
