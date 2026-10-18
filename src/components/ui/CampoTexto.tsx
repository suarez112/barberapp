import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";

// TextInput con los colores del tema. Acepta todas las props de TextInput.
export default function CampoTexto({ style, ...props }: TextInputProps) {
  const { colors } = useAppTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      {...props}
      style={[
        styles.campo,
        {
          backgroundColor: colors.inputBg,
          borderColor: colors.cardBorder,
          color: colors.textPrimary,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  campo: { padding: 14, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
});
