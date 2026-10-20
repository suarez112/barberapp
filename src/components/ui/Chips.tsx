import { ScrollView, StyleSheet, Text } from "react-native";
import Tocable from "./Tocable";
import { useAppTheme } from "../../theme/ThemeProvider";

export type OpcionChip<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  opciones: readonly OpcionChip<T>[];
  valor: T;
  onCambiar: (id: T) => void;
};

// Filtro de opciones excluyentes como pastillas que se desplazan en horizontal
export default function Chips<T extends string>({ opciones, valor, onCambiar }: Props<T>) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
      keyboardShouldPersistTaps="handled"
    >
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <Tocable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={o.label}
            accessibilityHint={`Filtra la lista: ${o.label.toLowerCase()}`}
            onPress={() => onCambiar(o.id)}
            style={[
              styles.chip,
              activo
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
          >
            <Text
              style={[
                styles.texto,
                { color: activo ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {o.label}
            </Text>
          </Tocable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: { gap: 8, paddingVertical: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: { fontWeight: "bold", fontSize: 13 },
});
