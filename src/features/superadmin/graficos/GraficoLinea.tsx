import { PointerEvent, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearNumero } from "../formato";
import { useColoresGrafico } from "./colores";

export type PuntoLinea = { etiqueta: string; valor: number };

type Props = {
  puntos: PuntoLinea[];
  // Resumen para lectores de pantalla (el gráfico en sí es solo dibujo)
  descripcion: string;
  alto?: number;
  // Color de la serie (por defecto el primero de la paleta)
  color?: string;
};

const MARGEN = { izq: 40, der: 12, arriba: 12, abajo: 26 };
const MARCAS_Y = 3;

// Redondea hacia arriba a 1, 2 o 5 por una potencia de 10 (el tope del eje)
const topeLindo = (maximo: number) => {
  if (maximo <= 3) return 3;
  const potencia = 10 ** Math.floor(Math.log10(maximo));
  const paso = [1, 2, 3, 5, 10].find((p) => p * potencia >= maximo) ?? 10;
  return paso * potencia;
};

// Línea con área suave. El panel es solo web, así que se dibuja con SVG directo
// (sin librerías nuevas): línea de 2 px, guías tenues y, al pasar el ratón, una línea
// vertical con el valor de ese punto.
export default function GraficoLinea({ puntos, descripcion, alto = 220, color }: Props) {
  const { colors } = useAppTheme();
  const { paleta } = useColoresGrafico();
  const serie = color ?? paleta[0];
  const [ancho, setAncho] = useState(0);
  const [activo, setActivo] = useState<number | null>(null);

  const alMedir = (e: LayoutChangeEvent) => setAncho(Math.floor(e.nativeEvent.layout.width));

  const tope = topeLindo(Math.max(0, ...puntos.map((p) => p.valor)));
  const areaAncho = Math.max(0, ancho - MARGEN.izq - MARGEN.der);
  const areaAlto = alto - MARGEN.arriba - MARGEN.abajo;
  const base = MARGEN.arriba + areaAlto;
  const x = (i: number) => MARGEN.izq + (puntos.length > 1 ? (i / (puntos.length - 1)) * areaAncho : areaAncho / 2);
  const y = (v: number) => base - (v / tope) * areaAlto;

  const trazo = puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ");
  const area = puntos.length ? `${x(0)},${base} ${trazo} ${x(puntos.length - 1)},${base}` : "";
  const marcasY = Array.from({ length: MARCAS_Y + 1 }, (_, i) => (tope / MARCAS_Y) * i);
  // Etiquetas del eje X: primera, del medio y última
  const marcasX =
    puntos.length > 2 ? [0, Math.floor((puntos.length - 1) / 2), puntos.length - 1] : puntos.map((_, i) => i);

  const alMover = (e: PointerEvent<SVGSVGElement>) => {
    if (!puntos.length || areaAncho <= 0) return;
    const cuadro = e.currentTarget.getBoundingClientRect();
    const relativo = (e.clientX - cuadro.left - MARGEN.izq) / areaAncho;
    const indice = Math.round(relativo * (puntos.length - 1));
    setActivo(Math.min(puntos.length - 1, Math.max(0, indice)));
  };

  const seleccion = activo !== null ? puntos[activo] : null;
  // El globo del valor se pone del lado donde hay espacio
  const aLaIzquierda = activo !== null && x(activo) > ancho / 2;

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
                {formatearNumero(Math.round(v))}
              </text>
            </g>
          ))}
          {marcasX.map((i, k) => (
            <text
              key={`${puntos[i].etiqueta}-${i}`}
              x={x(i)}
              y={alto - 6}
              textAnchor={marcasX.length < 2 ? "middle" : k === 0 ? "start" : k === marcasX.length - 1 ? "end" : "middle"}
              fontSize={11}
              fill={colors.textSecondary}
            >
              {puntos[i].etiqueta}
            </text>
          ))}
          {puntos.length > 1 ? <polygon points={area} fill={serie} opacity={0.15} /> : null}
          <polyline
            points={trazo}
            fill="none"
            stroke={serie}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {activo !== null && seleccion ? (
            <g>
              <line
                x1={x(activo)}
                x2={x(activo)}
                y1={MARGEN.arriba}
                y2={base}
                stroke={colors.textSecondary}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={x(activo)} cy={y(seleccion.valor)} r={5} fill={serie} stroke={colors.cardBg} strokeWidth={2} />
            </g>
          ) : null}
        </svg>
      ) : null}
      {seleccion && activo !== null ? (
        <View
          pointerEvents="none"
          style={[
            styles.globo,
            { backgroundColor: colors.headerBg, borderColor: colors.cardBorder },
            aLaIzquierda ? { right: ancho - x(activo) + 10 } : { left: x(activo) + 10 },
          ]}
        >
          <Text style={[styles.globoEtiqueta, { color: colors.textSecondary }]}>{seleccion.etiqueta}</Text>
          <Text style={[styles.globoValor, { color: colors.textPrimary }]}>{formatearNumero(seleccion.valor)}</Text>
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
