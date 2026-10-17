import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { COLORES } from "../../theme/paleta";

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
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
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
                    ? COLORES.textoSobrePrimario
                    : colors.textSecondary,
                },
                textStyle,
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
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
  opcion: { flex: 1, paddingVertical: 10, alignItems: "center" },
  texto: { fontWeight: "bold", fontSize: 12 },
});
