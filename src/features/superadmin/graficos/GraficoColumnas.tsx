import { PointerEvent, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "../formato";
import { useColoresGrafico } from "./colores";

export type ColumnaDato = { etiqueta: string; valor: number; destacada?: boolean };

type Props = {
  datos: ColumnaDato[];
  // Resumen para lectores de pantalla (el gráfico en sí es solo dibujo)
  descripcion: string;
  alto?: number;
};

const MARGEN = { izq: 76, der: 8, arriba: 12, abajo: 26 };
const MARCAS_Y = 3;

// Redondea hacia arriba a 1, 2, 3, 5 o 10 por una potencia de 10 (el tope del eje)
const topeLindo = (maximo: number) => {
  if (maximo <= 0) return 3;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const paso = [1, 2, 3, 5, 10].find((p) => p * potencia >= maximo) ?? 10;
  return paso * potencia;
};

// Columnas en pesos dibujadas con SVG (el panel es solo web). La columna destacada
// (mejor mes o año) va en verde y las demás en azul (ver la leyenda de la tarjeta). Al pasar el
// ratón sale el valor exacto de cada columna.
export default function GraficoColumnas({ datos, descripcion, alto = 240 }: Props) {
  const { colors } = useAppTheme();
  const { paleta } = useColoresGrafico();
  const [ancho, setAncho] = useState(0);
  const [activo, setActivo] = useState<number | null>(null);

  const alMedir = (e: LayoutChangeEvent) => setAncho(Math.floor(e.nativeEvent.layout.width));

  const tope = topeLindo(Math.max(0, ...datos.map((d) => d.valor)));
  const areaAncho = Math.max(0, ancho - MARGEN.izq - MARGEN.der);
  const areaAlto = alto - MARGEN.arriba - MARGEN.abajo;
  const base = MARGEN.arriba + areaAlto;
  const paso = datos.length ? areaAncho / datos.length : 0;
  const anchoColumna = Math.min(48, paso * 0.6);
  const y = (v: number) => base - (v / tope) * areaAlto;
  const marcasY = Array.from({ length: MARCAS_Y + 1 }, (_, i) => (tope / MARCAS_Y) * i);

  const alMover = (e: PointerEvent<SVGSVGElement>) => {
    if (!datos.length || paso <= 0) return;
    const cuadro = e.currentTarget.getBoundingClientRect();
    const indice = Math.floor((e.clientX - cuadro.left - MARGEN.izq) / paso);
    setActivo(indice >= 0 && indice < datos.length ? indice : null);
  };

  const seleccion = activo !== null ? datos[activo] : null;
  const centro = (i: number) => MARGEN.izq + paso * i + paso / 2;
  const aLaIzquierda = activo !== null && centro(activo) > ancho / 2;
  // Con muchas columnas se escriben las etiquetas alternadas para que no se pisen
  const cadaCuantas = paso < 44 ? 2 : 1;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={descripcion} onLayout={alMedir} style={{ height: alto }}>
      {ancho > 0 ? (
        <svg
          width={ancho}
          height={alto}
          onPointerMove={alMover}
          onPointerLeave={() => setActivo(null)}
          style={{ display: "block", touchAction: "pan-y" }}
        >
          {marcasY.map((v) => (
            <g key={v}>
              <line x1={MARGEN.izq} x2={ancho - MARGEN.der} y1={y(v)} y2={y(v)} stroke={colors.cardBorder} strokeWidth={1} />
              <text x={MARGEN.izq - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill={colors.textSecondary}>
                {formatearPesos(Math.round(v))}
              </text>
            </g>
          ))}
          {datos.map((d, i) => (
            <g key={`${d.etiqueta}-${i}`}>
              {d.valor > 0 ? (
                <rect
                  x={centro(i) - anchoColumna / 2}
                  y={y(d.valor)}
                  width={anchoColumna}
                  height={base - y(d.valor)}
                  rx={3}
                  fill={d.destacada ? paleta[5] : paleta[0]}
                  opacity={activo === i ? 0.75 : 1}
                />
              ) : null}
              {i % cadaCuantas === 0 ? (
                <text
                  x={centro(i)}
                  y={alto - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={d.destacada ? "bold" : "normal"}
                  fill={d.destacada ? colors.textPrimary : colors.textSecondary}
                >
                  {d.etiqueta}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      ) : null}
      {seleccion && activo !== null ? (
        <View
          pointerEvents="none"
          style={[
            styles.globo,
            { backgroundColor: colors.headerBg, borderColor: colors.cardBorder },
            aLaIzquierda ? { right: ancho - centro(activo) + 10 } : { left: centro(activo) + 10 },
          ]}
        >
          <Text style={[styles.globoEtiqueta, { color: colors.textSecondary }]}>{seleccion.etiqueta}</Text>
          <Text style={[styles.globoValor, { color: colors.textPrimary }]}>{formatearPesos(seleccion.valor)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  globo: { position: "absolute", top: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  globoEtiqueta: { fontSize: 11 },
  globoValor: { fontSize: 15, fontWeight: "bold" },
});
