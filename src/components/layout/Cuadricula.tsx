import { Children, ReactNode, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useModoPanel } from "./PanelAdaptable";

const SEPARACION = 12;
const MAX_COLUMNAS = 3;

type Props = {
  children: ReactNode;
  // Ancho mínimo cómodo de cada tarjeta
  minimo?: number;
};

// Acomoda tarjetas o filas en 2 o 3 columnas cuando hay ancho (solo en la web ancha).
// En el celular y en pantallas angostas deja los hijos uno debajo del otro, como siempre.
export default function Cuadricula({ children, minimo = 360 }: Props) {
  const modo = useModoPanel();
  const [ancho, setAncho] = useState(0);
  if (modo === "movil") return <>{children}</>;

  const columnas = Math.max(1, Math.min(MAX_COLUMNAS, Math.floor((ancho + SEPARACION) / (minimo + SEPARACION))));
  const alMedir = (e: LayoutChangeEvent) => setAncho(e.nativeEvent.layout.width);

  return (
    <View onLayout={alMedir} style={styles.fila}>
      {Children.toArray(children).map((hijo, i) => (
        <View key={i} style={{ width: `${100 / columnas}%`, paddingRight: i % columnas === columnas - 1 ? 0 : SEPARACION }}>
          {hijo}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
});
