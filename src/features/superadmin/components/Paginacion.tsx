import { StyleSheet, Text, View } from "react-native";
import { estiloBotonPagina } from "@/components/ui/estiloBotonPagina";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  total: number;
  pagina: number;
  limite: number;
  onCambiar: (pagina: number) => void;
};

// "Mostrando 1–25 de 134" con botones Anterior y Siguiente
export default function Paginacion({ total, pagina, limite, onCambiar }: Props) {
  const { colors } = useAppTheme();
  const paginas = Math.max(1, Math.ceil(total / limite));
  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(total, pagina * limite);

  const boton = (texto: string, destino: number, activo: boolean) => (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={`Va a la página ${destino}`}
      accessibilityState={{ disabled: !activo }}
      disabled={!activo}
      onPress={() => onCambiar(destino)}
      style={[styles.boton, estiloBotonPagina(colors, activo)]}
    >
      <Text style={[styles.textoBoton, { color: activo ? colors.textPrimary : colors.textSecondary }]}>{texto}</Text>
    </Tocable>
  );

  return (
    <View style={styles.fila}>
      <Text style={[styles.texto, { color: colors.textSecondary }]}>
        Mostrando {desde}–{hasta} de {total} · Página {pagina} de {paginas}
      </Text>
      <View style={styles.botones}>
        {boton("Anterior", pagina - 1, pagina > 1)}
        {boton("Siguiente", pagina + 1, pagina < paginas)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  texto: { fontSize: 13 },
  botones: { flexDirection: "row", gap: 8 },
  boton: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBoton: { fontSize: 14, fontWeight: "600" },
});
