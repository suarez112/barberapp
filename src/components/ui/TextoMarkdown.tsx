import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

// Markdown sencillo de los documentos legales: títulos (#, ##, ###), listas
// (- y 1.), párrafos y **negrita**. Lo demás se muestra como texto.
export default function TextoMarkdown({ contenido }: { contenido: string }) {
  const { colors } = useAppTheme();

  // "**hola** mundo" -> [<Text bold>hola</Text>, " mundo"]
  const enLinea = (texto: string) =>
    texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
      parte.startsWith("**") && parte.endsWith("**") ? (
        <Text key={i} style={styles.negrita}>
          {parte.slice(2, -2)}
        </Text>
      ) : (
        parte
      ),
    );

  return (
    <View>
      {contenido.split("\n").map((linea, i) => {
        const texto = linea.trim();
        if (!texto) return null;

        const titulo = /^(#{1,3})\s+(.*)$/.exec(texto);
        if (titulo) {
          const nivel = titulo[1].length;
          return (
            <Text
              key={i}
              style={[
                nivel === 1 ? styles.titulo1 : styles.titulo2,
                { color: nivel === 1 ? colors.primaryText : colors.textPrimary },
              ]}
            >
              {enLinea(titulo[2])}
            </Text>
          );
        }

        const item = /^(-|\*|\d+\.)\s+(.*)$/.exec(texto);
        if (item) {
          return (
            <View key={i} style={styles.item}>
              <Text style={[styles.vineta, { color: colors.textSecondary }]}>
                {item[1] === "-" || item[1] === "*" ? "•" : item[1]}
              </Text>
              <Text style={[styles.parrafo, styles.textoItem, { color: colors.textSecondary }]}>
                {enLinea(item[2])}
              </Text>
            </View>
          );
        }

        return (
          <Text key={i} style={[styles.parrafo, { color: colors.textSecondary }]}>
            {enLinea(texto)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo1: { fontSize: 17, fontWeight: "bold", marginTop: 8, marginBottom: 6 },
  titulo2: { fontSize: 14, fontWeight: "bold", marginTop: 12, marginBottom: 4 },
  parrafo: { fontSize: 13, lineHeight: 19, marginBottom: 6 },
  negrita: { fontWeight: "bold" },
  item: { flexDirection: "row", gap: 6, paddingLeft: 4 },
  vineta: { fontSize: 13, lineHeight: 19, minWidth: 16 },
  textoItem: { flex: 1 },
});
