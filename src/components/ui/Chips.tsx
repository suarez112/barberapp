import { ScrollView, StyleSheet, Text } from "react-native";
import Tocable from "./Tocable";
import { useAppTheme } from "../../theme/ThemeProvider";
import { textoSobre } from "../../theme/paleta";

export type OpcionChip<T extends string> = {
  id: T;
  label: string;
  // Color propio (ej. el de un estado): relleno al estar activa, con texto negro o blanco
  color?: string;
  // Borde cuando no está activa (por defecto, el borde normal de las tarjetas)
  bordeInactiva?: string;
};

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
                ? {
                    backgroundColor: o.color ?? colors.primary,
                    borderColor: o.color ?? colors.primary,
                  }
                : {
                    backgroundColor: colors.cardBg,
                    borderColor: o.bordeInactiva ?? colors.cardBorder,
                  },
            ]}
          >
            <Text
              style={[
                styles.texto,
                {
                  color: activo
                    ? o.color
                      ? textoSobre(o.color)
                      : colors.onPrimary
                    : colors.textSecondary,
                },
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
