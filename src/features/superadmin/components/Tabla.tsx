import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

export type Columna<T> = {
  clave: string;
  titulo: string;
  // Ancho relativo de la columna
  ancho: number;
  render: (fila: T) => ReactNode;
};

type Props<T> = {
  columnas: Columna<T>[];
  filas: T[];
  clave: (fila: T) => string;
  // Qué se lee al tocar una fila (para el lector de pantalla)
  etiquetaFila?: (fila: T) => string;
  onFila?: (fila: T) => void;
  vacio: string;
};

// Tabla de escritorio: encabezado fijo, filas que se pueden tocar y desplazamiento
// horizontal cuando la ventana es más angosta que las columnas
export default function Tabla<T>({ columnas, filas, clave, etiquetaFila, onFila, vacio }: Props<T>) {
  const { colors } = useAppTheme();
  const celdas = (fila: T) =>
    columnas.map((c) => (
      <View key={c.clave} style={[styles.celda, { flex: c.ancho }]}>
        {c.render(fila)}
      </View>
    ));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={[styles.tabla, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}>
        <View style={[styles.fila, styles.encabezado]}>
          {columnas.map((c) => (
            <View key={c.clave} style={[styles.celda, { flex: c.ancho }]}>
              <Text style={[styles.titulo, { color: colors.textSecondary }]}>{c.titulo.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        {filas.length === 0 ? (
          <Text style={[styles.vacio, { color: colors.textSecondary, borderColor: colors.cardBorder }]}>
            {vacio}
          </Text>
        ) : (
          filas.map((fila) =>
            onFila ? (
              <Tocable
                key={clave(fila)}
                accessibilityRole="button"
                accessibilityLabel={etiquetaFila?.(fila)}
                accessibilityHint="Abre el detalle"
                onPress={() => onFila(fila)}
                style={[styles.fila, { borderColor: colors.cardBorder }]}
              >
                {celdas(fila)}
              </Tocable>
            ) : (
              <View key={clave(fila)} style={[styles.fila, { borderColor: colors.cardBorder }]}>
                {celdas(fila)}
              </View>
            ),
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabla: { minWidth: 860, flexGrow: 1, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  encabezado: { minHeight: 44, borderTopWidth: 0 },
  celda: { paddingRight: 12, justifyContent: "center" },
  titulo: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.8 },
  vacio: { padding: 24, textAlign: "center", fontSize: 14, borderTopWidth: 1 },
});
