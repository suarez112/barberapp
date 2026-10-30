import { StyleSheet, Text, View } from "react-native";
import { COLORES } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { MESES_CORTOS } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";

const dinero = (n: number) => `$${formatearPesos(n)}`;

// "2026-10-05" -> "5 oct"
export const diaCorto = (fecha: string) => {
  const [, m, d] = fecha.split("-").map(Number);
  return `${d} ${MESES_CORTOS[m - 1].toLowerCase()}`;
};

export type BarraFila = {
  clave: string;
  etiqueta: string;
  valor: number;
  // Texto pequeño bajo la etiqueta (ej. "$300.000")
  detalle?: string;
  destacada?: boolean;
};

// Barras horizontales con Views: la etiqueta y el número siempre van escritos
export function BarrasHorizontales({ filas, vacio, unidad }: { filas: BarraFila[]; vacio: string; unidad: string }) {
  const { colors } = useAppTheme();
  const maximo = Math.max(1, ...filas.map((f) => f.valor));

  if (filas.length === 0 || filas.every((f) => f.valor === 0)) {
    return <Text style={[s.vacio, { color: colors.textSecondary }]}>{vacio}</Text>;
  }

  return (
    <View>
      {filas.map((f) => (
        <View
          key={f.clave}
          accessible
          accessibilityLabel={`${f.etiqueta}: ${f.valor} ${unidad}${f.detalle ? `, ${f.detalle}` : ""}`}
          style={s.filaBarra}
        >
          <View style={s.etiquetaBarra}>
            <Text
              numberOfLines={1}
              style={[s.textoBarra, { color: colors.textPrimary, fontWeight: f.destacada ? "bold" : "600" }]}
            >
              {f.etiqueta}
            </Text>
            {f.detalle ? (
              <Text numberOfLines={1} style={[s.detalleBarra, { color: colors.textSecondary }]}>
                {f.detalle}
              </Text>
            ) : null}
          </View>
          <View style={[s.pista, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {f.valor > 0 ? (
              <View
                style={[
                  s.relleno,
                  {
                    width: `${(f.valor / maximo) * 100}%`,
                    backgroundColor: f.destacada ? COLORES.barraDestacada : COLORES.barra,
                  },
                ]}
              />
            ) : null}
          </View>
          <Text style={[s.valorBarra, { color: colors.textPrimary }]}>{f.valor}</Text>
        </View>
      ))}
    </View>
  );
}

type Dia = { fecha: string; ventas: number; citas: number };
type Columna = { etiqueta: string; ventas: number };

const ALTO_GRAFICO = 120;
const MAX_COLUMNAS = 31;

// Hasta 31 días se dibuja un día por columna; en períodos más largos se suma por semanas
function columnas(dias: Dia[]): { lista: Columna[]; porSemana: boolean } {
  if (dias.length <= MAX_COLUMNAS) {
    return { lista: dias.map((d) => ({ etiqueta: diaCorto(d.fecha), ventas: d.ventas })), porSemana: false };
  }
  const lista: Columna[] = [];
  for (let i = 0; i < dias.length; i += 7) {
    const grupo = dias.slice(i, i + 7);
    lista.push({
      etiqueta: `Semana del ${diaCorto(grupo[0].fecha)}`,
      ventas: grupo.reduce((suma, d) => suma + d.ventas, 0),
    });
  }
  return { lista, porSemana: true };
}

// Ventas de cada día del período como columnas dibujadas con Views
export function VentasPorDia({ dias }: { dias: Dia[] }) {
  const { colors } = useAppTheme();
  const { lista, porSemana } = columnas(dias);
  const maximo = Math.max(...lista.map((c) => c.ventas), 0);

  if (lista.length === 0 || maximo === 0) {
    return <Text style={[s.vacio, { color: colors.textSecondary }]}>No hay ventas en este período.</Text>;
  }

  const mejor = lista.reduce((a, b) => (b.ventas > a.ventas ? b : a));
  const resumen = `Ventas ${porSemana ? "por semana" : "por día"}. ${porSemana ? "Mejor semana" : "Mejor día"}: ${mejor.etiqueta}, ${dinero(mejor.ventas)}.`;

  return (
    <View>
      <View accessible accessibilityRole="image" accessibilityLabel={resumen}>
        <Text style={[s.escala, { color: colors.textSecondary }]}>Máximo: {dinero(maximo)}</Text>
        <View style={[s.grafico, { borderColor: colors.cardBorder }]}>
          {lista.map((c, i) => (
            <View key={`${c.etiqueta}-${i}`} style={s.columna}>
              <View
                style={{
                  height: c.ventas > 0 ? Math.max(3, (c.ventas / maximo) * ALTO_GRAFICO) : 0,
                  backgroundColor: c === mejor ? COLORES.barraDestacada : COLORES.barra,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              />
            </View>
          ))}
        </View>
        <View style={s.ejeX}>
          <Text style={[s.textoEje, { color: colors.textSecondary }]}>{lista[0].etiqueta.replace("Semana del ", "")}</Text>
          <Text style={[s.textoEje, { color: colors.textSecondary }]}>
            {diaCorto(dias[dias.length - 1].fecha)}
          </Text>
        </View>
      </View>
      <Text style={[s.pie, { color: colors.textSecondary }]}>
        {porSemana ? "Mejor semana" : "Mejor día"}:{" "}
        <Text style={{ color: colors.textPrimary, fontWeight: "bold" }}>
          {mejor.etiqueta} · {dinero(mejor.ventas)}
        </Text>
        {porSemana ? " (cada columna suma 7 días)" : ""}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  vacio: { fontSize: 13, marginVertical: 6 },
  filaBarra: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  etiquetaBarra: { width: 96 },
  textoBarra: { fontSize: 13 },
  detalleBarra: { fontSize: 11, marginTop: 1 },
  pista: { flex: 1, height: 18, borderRadius: 5, borderWidth: 1, overflow: "hidden" },
  relleno: { height: "100%", borderRadius: 4 },
  valorBarra: { width: 28, fontSize: 13, fontWeight: "bold", textAlign: "right" },
  escala: { fontSize: 11, marginBottom: 4 },
  grafico: {
    height: ALTO_GRAFICO,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    borderBottomWidth: 1,
  },
  columna: { flex: 1, justifyContent: "flex-end" },
  ejeX: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  textoEje: { fontSize: 11 },
  pie: { fontSize: 12, marginTop: 8 },
});
