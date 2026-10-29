import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

export type ItemLeyenda = { nombre: string; color: string };

// Muestras de color con su nombre: dice qué es cada color de un gráfico
export default function Leyenda({ items }: { items: ItemLeyenda[] }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fila} accessible accessibilityLabel={`Leyenda: ${items.map((i) => i.nombre).join(", ")}`}>
      {items.map((i) => (
        <View key={i.nombre} style={styles.item}>
          <View style={[styles.muestra, { backgroundColor: i.color }]} />
          <Text style={[styles.texto, { color: colors.textSecondary }]}>{i.nombre}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  muestra: { width: 10, height: 10, borderRadius: 2 },
  texto: { fontSize: 12 },
});
