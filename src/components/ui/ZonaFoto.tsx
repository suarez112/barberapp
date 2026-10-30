import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import Tocable from "./Tocable";

type Props = {
  etiqueta: string;
  ayuda: string;
  onPress: () => void;
  // Foto ya elegida o guardada: reemplaza el aviso vacío
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Zona para subir una foto: caja con borde punteado amarillo, fondo suave y cámara grande.
// Se lee en tema claro (fondo crema) y oscuro (amarillo translúcido sobre el fondo oscuro).
export default function ZonaFoto({ etiqueta, ayuda, onPress, children, style }: Props) {
  const { colors, esOscuro } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda}
      onPress={onPress}
      style={[
        styles.zona,
        {
          borderColor: "#EAB308",
          backgroundColor: esOscuro ? "rgba(234, 179, 8, 0.10)" : "#FFFBEB",
        },
        children ? styles.conFoto : null,
        style,
      ]}
    >
      {children ?? (
        <>
          <Ionicons name="camera-outline" size={44} color={esOscuro ? "#FACC15" : "#A16207"} />
          <Text style={[styles.texto, { color: esOscuro ? colors.textPrimary : "#713F12" }]}>
            Toca para agregar una foto (opcional)
          </Text>
        </>
      )}
    </Tocable>
  );
}

const styles = StyleSheet.create({
  zona: {
    minHeight: 140,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    marginBottom: 6,
    overflow: "hidden",
  },
  conFoto: { padding: 0, borderStyle: "solid" },
  texto: { fontSize: 14, fontWeight: "600", textAlign: "center" },
});
