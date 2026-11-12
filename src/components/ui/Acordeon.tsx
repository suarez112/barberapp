import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import IconoEnLinea from "./IconoEnLinea";
import Tocable from "./Tocable";
import { useAppTheme } from "../../theme/ThemeProvider";

type Props = {
  titulo: string;
  // Ícono decorativo antes del título
  icono?: ComponentProps<typeof Ionicons>["name"];
  abierto: boolean;
  onAlternar: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Cabecera que despliega un formulario debajo
export default function Acordeon({
  titulo,
  icono,
  abierto,
  onAlternar,
  children,
  style,
}: Props) {
  const { colors } = useAppTheme();
  const bordes = { backgroundColor: colors.cardBg, borderColor: colors.cardBorder };
  return (
    <>
      <Tocable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierto }}
        accessibilityLabel={titulo}
        accessibilityHint={abierto ? "Oculta el formulario" : "Muestra el formulario"}
        style={[styles.cabecera, bordes, style]}
        onPress={onAlternar}
      >
        <Text style={[styles.titulo, { color: colors.primaryText }]}>
          {icono ? (
            <>
              <IconoEnLinea nombre={icono} color={colors.primaryText} />{" "}
            </>
          ) : null}
          {titulo}
        </Text>
        <Ionicons
          name={abierto ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.primaryText}
        />
      </Tocable>
      {abierto ? <View style={[styles.cuerpo, bordes]}>{children}</View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 },
  cuerpo: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    marginTop: -2,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});
