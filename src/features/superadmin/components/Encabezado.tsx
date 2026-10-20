import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = { titulo: string; subtitulo?: string; derecha?: ReactNode };

// Título de cada sección del panel
export default function Encabezado({ titulo, subtitulo, derecha }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fila}>
      <View style={styles.textos}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
          {titulo}
        </Text>
        {subtitulo ? <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>{subtitulo}</Text> : null}
      </View>
      {derecha}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 },
  textos: { flex: 1 },
  titulo: { fontSize: 26, fontWeight: "bold" },
  subtitulo: { fontSize: 14, marginTop: 4 },
});
