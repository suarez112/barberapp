import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useAppTheme } from "../../theme/ThemeProvider";
import { COLORES } from "../../theme/paleta";
import { Dia } from "../../types";

type Props = {
  dias: Dia[];
  seleccionado: Dia;
  onSeleccionar: (dia: Dia) => void;
};

export default function SelectorDias({
  dias,
  seleccionado,
  onSeleccionar,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.lista}
    >
      {dias.map((d) => {
        const esSel = seleccionado.id === d.id;
        return (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            accessibilityState={{ selected: esSel }}
            style={[
              styles.dia,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              esSel && {
                borderColor: colors.primary,
                backgroundColor: colors.cardSelectedBg,
              },
            ]}
            onPress={() => onSeleccionar(d)}
          >
            <Text style={[styles.nombre, esSel && { color: colors.primary }]}>
              {d.diaNom}
            </Text>
            <Text
              style={[
                styles.numero,
                { color: esSel ? colors.primary : colors.textPrimary },
              ]}
            >
              {d.num}
            </Text>
            <Text style={[styles.mes, { color: colors.textSecondary }]}>
              OCT
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lista: { marginBottom: 15 },
  dia: {
    width: 60,
    height: 75,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  nombre: { color: COLORES.apagado, fontSize: 10, fontWeight: "bold" },
  numero: { fontSize: 20, fontWeight: "bold", marginVertical: 2 },
  mes: { fontSize: 9 },
});
