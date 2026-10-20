import { ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  titulo: string;
  subtitulo?: string;
  // Si se pasa, aparece "Ver tabla": los mismos datos como lista (sin depender de ver el gráfico)
  filas?: [string, string][];
  // Ocupa el ancho completo de la fila
  ancha?: boolean;
  children: ReactNode;
};

// Tarjeta que envuelve un gráfico: título, el gráfico y, opcional, su vista de tabla
export default function TarjetaGrafico({ titulo, subtitulo, filas, ancha = false, children }: Props) {
  const { colors } = useAppTheme();
  const [verTabla, setVerTabla] = useState(false);

  return (
    <View
      style={[
        styles.tarjeta,
        ancha && styles.ancha,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.cabecera}>
        <View style={styles.textos}>
          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
            {titulo}
          </Text>
          {subtitulo ? <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>{subtitulo}</Text> : null}
        </View>
        {filas ? (
          <Tocable
            accessibilityRole="button"
            accessibilityLabel={verTabla ? `Ver gráfico de ${titulo}` : `Ver tabla de ${titulo}`}
            accessibilityHint="Cambia entre el gráfico y la tabla con los mismos datos"
            onPress={() => setVerTabla((v) => !v)}
            style={styles.alternar}
          >
            <Text style={[styles.textoAlternar, { color: colors.primaryText }]}>
              {verTabla ? "Ver gráfico" : "Ver tabla"}
            </Text>
          </Tocable>
        ) : null}
      </View>

      {verTabla && filas ? (
        <View>
          {filas.map(([dato, valor], i) => (
            <View key={`${dato}-${i}`} style={[styles.fila, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.dato, { color: colors.textSecondary }]}>{dato}</Text>
              <Text style={[styles.valor, { color: colors.textPrimary }]}>{valor}</Text>
            </View>
          ))}
        </View>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexGrow: 1, flexBasis: 440, borderWidth: 1, borderRadius: 12, padding: 20 },
  ancha: { flexBasis: "100%" },
  cabecera: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  textos: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: "bold" },
  subtitulo: { fontSize: 13, marginTop: 2 },
  alternar: { minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "flex-end" },
  textoAlternar: { fontSize: 13, fontWeight: "600" },
  fila: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6, borderBottomWidth: 1 },
  dato: { fontSize: 13 },
  valor: { fontSize: 13, fontWeight: "600" },
});
