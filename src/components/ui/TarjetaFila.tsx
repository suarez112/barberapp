import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";

// Fila de lista: contenido a la izquierda y acciones a la derecha
export default function TarjetaFila({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.fila,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
});
