import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Tocable from "./Tocable";
import { useAppTheme } from "../../theme/ThemeProvider";

export type OpcionSelector<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  opciones: readonly OpcionSelector<T>[];
  valor: T;
  onCambiar: (id: T) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// Barra de opciones excluyentes, todas visibles a la vez
export default function Selector<T extends string>({
  opciones,
  valor,
  onCambiar,
  style,
  textStyle,
}: Props<T>) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.barra, { borderColor: colors.cardBorder }, style]}>
      {opciones.map((o) => {
        const activo = valor === o.id;
        return (
          <Tocable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={o.label}
            accessibilityHint={`Muestra ${o.label.toLowerCase()}`}
            onPress={() => onCambiar(o.id)}
            style={[
              styles.opcion,
              { backgroundColor: activo ? colors.primary : colors.cardBg },
            ]}
          >
            <Text
              style={[
                styles.texto,
                {
                  color: activo
                    ? colors.onPrimary
                    : colors.textSecondary,
                },
                textStyle,
              ]}
            >
              {o.label}
            </Text>
          </Tocable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  opcion: { flex: 1, minHeight: 44, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  texto: { fontWeight: "bold", fontSize: 12 },
});
