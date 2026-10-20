import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import CampoTexto, { PropsCampo } from "./CampoTexto";

// Campo de contraseña con un ojo para mostrar u ocultar lo escrito
type Props = Omit<PropsCampo, "secureTextEntry" | "derecha">;

export default function CampoClave(props: Props) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);

  return (
    <CampoTexto
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      {...props}
      secureTextEntry={!visible}
      derecha={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          accessibilityHint={
            visible ? "Vuelve a esconder lo que escribiste" : "Muestra lo que escribiste"
          }
          onPress={() => setVisible((v) => !v)}
          style={styles.ojo}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  ojo: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
});
