import { ReactNode, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

// Markdown sencillo de los documentos legales: títulos (#, ##, ###), listas
// (-, * y 1.), párrafos, **negrita**, `código`, citas (>), separadores (---) y
// tablas (| a | b |). Lo demás se muestra como texto.

// Ancho desde el que una tabla se dibuja como tabla; más angosta, cada fila es una tarjeta
const ANCHO_MINIMO_TABLA = 560;

export type Titulo = { id: string; texto: string; nivel: number };

type Bloque =
  | { tipo: "titulo"; nivel: number; texto: string }
  | { tipo: "item"; marca: string; texto: string }
  | { tipo: "cita"; texto: string }
  | { tipo: "separador" }
  | { tipo: "tabla"; encabezado: string[]; filas: string[][] }
  | { tipo: "parrafo"; texto: string };

// "| a | b |" -> ["a", "b"]
const celdas = (linea: string) =>
  linea
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

// "| --- | :---: |"
const esSeparadorTabla = (linea: string) => /^\|[\s:|-]+$/.test(linea) && linea.includes("---");

function bloquesDe(contenido: string): Bloque[] {
  const lineas = contenido.split("\n").map((l) => l.trim());
  const bloques: Bloque[] = [];
  for (let i = 0; i < lineas.length; i++) {
    const texto = lineas[i];
    if (!texto) continue;

    // Tabla: fila de encabezado, fila de guiones y las filas de datos seguidas
    if (texto.startsWith("|") && esSeparadorTabla(lineas[i + 1] ?? "")) {
      const encabezado = celdas(texto);
      const filas: string[][] = [];
      i += 2;
      while (i < lineas.length && lineas[i].startsWith("|")) filas.push(celdas(lineas[i++]));
      i--;
      bloques.push({ tipo: "tabla", encabezado, filas });
      continue;
    }

    const titulo = /^(#{1,3})\s+(.*)$/.exec(texto);
    if (titulo) {
      bloques.push({ tipo: "titulo", nivel: titulo[1].length, texto: titulo[2] });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(texto)) {
      bloques.push({ tipo: "separador" });
      continue;
    }
    const cita = /^>\s?(.*)$/.exec(texto);
    if (cita) {
      bloques.push({ tipo: "cita", texto: cita[1] });
      continue;
    }
    const item = /^(-|\*|\d+\.)\s+(.*)$/.exec(texto);
    if (item) {
      bloques.push({ tipo: "item", marca: item[1], texto: item[2] });
      continue;
    }
    bloques.push({ tipo: "parrafo", texto });
  }
  return bloques;
}

// Texto sin marcas de formato: "**4. Datos**" -> "4. Datos"
const textoPlano = (texto: string) => texto.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");

// Id del ancla de un título: "4. Datos que tratamos" -> "4-datos-que-tratamos"
const idDe = (texto: string) =>
  textoPlano(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Títulos del documento con su ancla (id único aunque dos títulos se repitan)
function titulosDeBloques(bloques: Bloque[]): (Titulo | null)[] {
  const usados = new Map<string, number>();
  return bloques.map((b) => {
    if (b.tipo !== "titulo") return null;
    const base = idDe(b.texto) || "seccion";
    const veces = usados.get(base) ?? 0;
    usados.set(base, veces + 1);
    return { id: veces ? `${base}-${veces + 1}` : base, texto: textoPlano(b.texto), nivel: b.nivel };
  });
}

// Secciones para un índice: los títulos del nivel más alto debajo del título principal (#)
export function seccionesDe(contenido: string): Titulo[] {
  const titulos = titulosDeBloques(bloquesDe(contenido)).filter((t): t is Titulo => !!t && t.nivel > 1);
  const nivel = Math.min(...titulos.map((t) => t.nivel));
  return titulos.filter((t) => t.nivel === nivel);
}

type Props = {
  contenido: string;
  // Oculta el primer título (#) cuando la pantalla ya lo muestra arriba
  sinTituloPrincipal?: boolean;
  // Posición (y, relativa a este texto) de cada título, para saltar a él desde un índice
  alMedirTitulo?: (id: string, y: number) => void;
};

export default function TextoMarkdown({ contenido, sinTituloPrincipal = false, alMedirTitulo }: Props) {
  const { colors } = useAppTheme();
  // Un documento legal es largo: se lee una sola vez por texto, no en cada render
  const { bloques, titulos } = useMemo(() => {
    const b = bloquesDe(contenido);
    return { bloques: b, titulos: titulosDeBloques(b) };
  }, [contenido]);
  // El título principal es el primero del texto, si es de nivel 1
  const primerTitulo = titulos.findIndex(Boolean);
  const ocultar = sinTituloPrincipal && titulos[primerTitulo]?.nivel === 1 ? primerTitulo : -1;

  // "**hola** `x`" -> [<Text bold>hola</Text>, " ", <Text mono>x</Text>]
  const enLinea = (texto: string): ReactNode[] =>
    texto.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((parte, i) => {
      if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4)
        return (
          <Text key={i} style={styles.negrita}>
            {parte.slice(2, -2)}
          </Text>
        );
      if (parte.startsWith("`") && parte.endsWith("`") && parte.length > 2)
        return (
          <Text key={i} style={[styles.codigo, { color: colors.textPrimary, backgroundColor: colors.inputBg }]}>
            {parte.slice(1, -1)}
          </Text>
        );
      return parte;
    });

  return (
    <View>
      {bloques.map((b, i) => {
        if (i === ocultar) return null;
        switch (b.tipo) {
          case "titulo": {
            const ancla = titulos[i]!;
            return (
              <Text
                key={i}
                nativeID={ancla.id}
                accessibilityRole="header"
                onLayout={alMedirTitulo ? (e) => alMedirTitulo(ancla.id, e.nativeEvent.layout.y) : undefined}
                style={[
                  b.nivel === 1 ? styles.titulo1 : styles.titulo2,
                  { color: b.nivel === 1 ? colors.primaryText : colors.textPrimary },
                ]}
              >
                {enLinea(b.texto)}
              </Text>
            );
          }
          case "item":
            return (
              <View key={i} style={styles.item}>
                <Text style={[styles.vineta, { color: colors.textSecondary }]}>
                  {b.marca === "-" || b.marca === "*" ? "•" : b.marca}
                </Text>
                <Text style={[styles.parrafo, styles.textoItem, { color: colors.textSecondary }]}>
                  {enLinea(b.texto)}
                </Text>
              </View>
            );
          case "cita":
            return (
              <View
                key={i}
                style={[styles.cita, { borderLeftColor: colors.primaryText, backgroundColor: colors.cardBg }]}
              >
                <Text style={[styles.parrafo, { color: colors.textPrimary }]}>{enLinea(b.texto)}</Text>
              </View>
            );
          case "separador":
            return <View key={i} style={[styles.separador, { backgroundColor: colors.cardBorder }]} />;
          case "tabla":
            return <Tabla key={i} encabezado={b.encabezado} filas={b.filas} enLinea={enLinea} />;
          default:
            return (
              <Text key={i} style={[styles.parrafo, { color: colors.textSecondary }]}>
                {enLinea(b.texto)}
              </Text>
            );
        }
      })}
    </View>
  );
}

// Tabla ancha como tabla; angosta (celular), cada fila como una tarjeta con "Columna: valor"
function Tabla({
  encabezado,
  filas,
  enLinea,
}: {
  encabezado: string[];
  filas: string[][];
  enLinea: (texto: string) => ReactNode[];
}) {
  const { colors } = useAppTheme();
  const [ancho, setAncho] = useState(0);
  const comoTabla = ancho >= ANCHO_MINIMO_TABLA;
  const borde = { borderColor: colors.cardBorder };

  // Hasta conocer el ancho no se dibuja: así no aparece como tarjetas y luego cambia a tabla
  if (!ancho)
    return <View style={styles.tabla} onLayout={(e) => setAncho(e.nativeEvent.layout.width)} />;

  return (
    <View style={styles.tabla} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {comoTabla ? (
        <View style={[styles.marcoTabla, borde]}>
          <View style={[styles.filaTabla, { backgroundColor: colors.cardBg }]}>
            {encabezado.map((c, j) => (
              <Text key={j} style={[styles.celda, styles.celdaEncabezado, borde, j === 0 && styles.primeraCelda, { color: colors.textPrimary }]}>
                {enLinea(c)}
              </Text>
            ))}
          </View>
          {filas.map((fila, f) => (
            <View key={f} style={[styles.filaTabla, styles.filaConBorde, borde]}>
              {encabezado.map((_, j) => (
                <Text key={j} style={[styles.celda, borde, j === 0 && styles.primeraCelda, { color: colors.textSecondary }]}>
                  {enLinea(fila[j] ?? "")}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : (
        filas.map((fila, f) => (
          <View key={f} style={[styles.tarjetaFila, borde, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.tituloTarjeta, { color: colors.textPrimary }]}>{enLinea(fila[0] ?? "")}</Text>
            {encabezado.slice(1).map((columna, j) =>
              fila[j + 1] ? (
                <View key={j} style={styles.campoTarjeta}>
                  <Text style={[styles.etiquetaCampo, { color: colors.textPrimary }]}>{textoPlano(columna)}</Text>
                  <Text style={[styles.parrafo, styles.sinMargen, { color: colors.textSecondary }]}>
                    {enLinea(fila[j + 1])}
                  </Text>
                </View>
              ) : null,
            )}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo1: { fontSize: 17, fontWeight: "bold", marginTop: 8, marginBottom: 6 },
  titulo2: { fontSize: 14, fontWeight: "bold", marginTop: 12, marginBottom: 4 },
  parrafo: { fontSize: 13, lineHeight: 19, marginBottom: 6 },
  sinMargen: { marginBottom: 0 },
  negrita: { fontWeight: "bold" },
  codigo: { fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), fontSize: 12 },
  item: { flexDirection: "row", gap: 6, paddingLeft: 4 },
  vineta: { fontSize: 13, lineHeight: 19, minWidth: 16 },
  textoItem: { flex: 1 },
  cita: { borderLeftWidth: 4, borderRadius: 6, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, marginVertical: 6 },
  separador: { height: 1, marginVertical: 14 },
  tabla: { marginVertical: 8 },
  marcoTabla: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  filaTabla: { flexDirection: "row" },
  filaConBorde: { borderTopWidth: 1 },
  celda: { flex: 1, fontSize: 13, lineHeight: 19, padding: 8, borderLeftWidth: StyleSheet.hairlineWidth },
  primeraCelda: { borderLeftWidth: 0 },
  celdaEncabezado: { fontWeight: "bold" },
  tarjetaFila: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8, gap: 8 },
  tituloTarjeta: { fontSize: 14, fontWeight: "bold" },
  campoTarjeta: { gap: 2 },
  etiquetaCampo: { fontSize: 12, fontWeight: "bold" },
});
