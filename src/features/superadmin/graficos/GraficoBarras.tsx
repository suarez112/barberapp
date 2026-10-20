import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearNumero } from "../formato";

export type BarraDato = {
  etiqueta: string;
  valor: number;
  // Texto pequeño bajo la etiqueta (ej. "2 activos")
  detalle?: string;
  color?: string;
};

type Props = { datos: BarraDato[]; vacio?: string };

// Barras horizontales dibujadas con Views: la etiqueta y el número van siempre escritos,
// así que el color nunca es lo único que dice qué es cada barra.
export default function GraficoBarras({ datos, vacio = "Aún no hay datos." }: Props) {
  const { colors } = useAppTheme();
  const maximo = Math.max(1, ...datos.map((d) => d.valor));

  if (datos.length === 0 || datos.every((d) => d.valor === 0)) {
    return <Text style={[styles.vacio, { color: colors.textSecondary }]}>{vacio}</Text>;
  }

  return (
    <View style={styles.lista}>
      {datos.map((d, i) => (
        <View
          key={`${d.etiqueta}-${i}`}
          accessible
          accessibilityLabel={`${d.etiqueta}: ${formatearNumero(d.valor)}${d.detalle ? `, ${d.detalle}` : ""}`}
          style={styles.fila}
        >
          <View style={styles.etiqueta}>
            <Text numberOfLines={1} style={[styles.texto, { color: colors.textPrimary }]}>
              {d.etiqueta}
            </Text>
            {d.detalle ? <Text style={[styles.detalle, { color: colors.textSecondary }]}>{d.detalle}</Text> : null}
          </View>
          <View style={styles.pista}>
            {d.valor > 0 ? (
              <View
                style={[
                  styles.barra,
                  { width: `${(d.valor / maximo) * 100}%`, backgroundColor: d.color ?? colors.primaryText },
                ]}
              />
            ) : null}
          </View>
          <Text style={[styles.valor, { color: colors.textPrimary }]}>{formatearNumero(d.valor)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 12 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  etiqueta: { width: 120 },
  texto: { fontSize: 13 },
  detalle: { fontSize: 11, marginTop: 1 },
  pista: { flex: 1, height: 14, justifyContent: "center" },
  // Barra fina con el extremo de los datos redondeado
  barra: { height: 12, minWidth: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  valor: { width: 44, fontSize: 13, fontWeight: "600", textAlign: "right" },
  vacio: { fontSize: 13, paddingVertical: 24, textAlign: "center" },
});
