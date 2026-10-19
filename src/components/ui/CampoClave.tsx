import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleProp, StyleSheet, TextInputProps, View, ViewStyle } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import CampoTexto from "./CampoTexto";

// Campo de contraseña con un ojo para mostrar u ocultar lo escrito
type Props = Omit<TextInputProps, "secureTextEntry" | "style"> & {
  // Estilo del contenedor (márgenes, ancho)
  style?: StyleProp<ViewStyle>;
};

export default function CampoClave({ style, ...props }: Props) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.contenedor, style]}>
      <CampoTexto
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        secureTextEntry={!visible}
        style={styles.campo}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        hitSlop={8}
        onPress={() => setVisible((v) => !v)}
        style={styles.ojo}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { justifyContent: "center" },
  // Deja espacio para el ojo a la derecha
  campo: { paddingRight: 48 },
  // El campo tiene marginBottom 10: el ojo se centra en el espacio del texto
  ojo: { position: "absolute", right: 14, top: 0, bottom: 10, justifyContent: "center" },
});
