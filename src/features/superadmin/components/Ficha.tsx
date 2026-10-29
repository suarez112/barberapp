import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = { titulo: string; filas: [string, string][] };

// Tarjeta con un título y pares "dato: valor"
export default function Ficha({ titulo, filas }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <Text accessibilityRole="header" style={[styles.titulo, { color: colors.primaryText }]}>
        {titulo.toUpperCase()}
      </Text>
      {filas.map(([dato, valor], i) => (
        // Dos filas pueden tener el mismo texto (p. ej. dos acciones el mismo minuto)
        <View key={`${dato}-${i}`} style={styles.fila}>
          <Text style={[styles.dato, { color: colors.textSecondary }]}>{dato}</Text>
          <Text selectable style={[styles.valor, { color: colors.textPrimary }]}>
            {valor}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexGrow: 1, flexBasis: 320, borderWidth: 1, borderRadius: 12, padding: 20 },
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 12 },
  fila: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 6 },
  dato: { fontSize: 14 },
  valor: { fontSize: 14, fontWeight: "600", flexShrink: 1, textAlign: "right" },
});
