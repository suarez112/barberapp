import { Href, Link } from "expo-router";
import { ReactNode, useState } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle, useWindowDimensions } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { COLORES_LANDING as C } from "@/theme/paleta";

// Piezas compartidas de la página principal web. Solo se usan en la web.

export const ANCHO_MAXIMO = 1180;
export const FUENTE = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Puntos de corte del diseño: menos de 980 px = tablet (2 columnas), menos de 640 px = celular
export function useAnchos() {
  const { width } = useWindowDimensions();
  return { ancho: width, tablet: width < 980, movil: width < 640 };
}

// Cuadrícula de CSS (solo web). `plantilla` es el valor de grid-template-columns.
export const cuadricula = (plantilla: string, hueco: number): ViewStyle =>
  ({ display: "grid", gridTemplateColumns: plantilla, gap: hueco }) as unknown as ViewStyle;

export const columnasIguales = (n: number, hueco: number) => cuadricula(`repeat(${n}, minmax(0, 1fr))`, hueco);

// Contenido centrado de 1180 px como máximo
export function Contenedor({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { movil } = useAnchos();
  return (
    <View style={[estilos.contenedor, { paddingHorizontal: movil ? 16 : 24 }, style]}>{children}</View>
  );
}

export function T({ children, style, ...resto }: { children: ReactNode; style?: StyleProp<TextStyle> } & Record<string, unknown>) {
  return (
    <Text style={[{ fontFamily: FUENTE, color: C.texto }, style]} {...resto}>
      {children}
    </Text>
  );
}

type PropsBoton = {
  variante: "amarillo" | "contorno" | "oscuro";
  etiqueta: string;
  href?: Href;
  onPress?: () => void;
  ayuda: string;
  anchoCompleto?: boolean;
  chico?: boolean;
  icono?: ReactNode;
};

const COLORES_BOTON = {
  amarillo: { fondo: C.amarillo, hover: C.amarilloOscuro, texto: C.oscuro, borde: "transparent" },
  oscuro: { fondo: C.oscuro, hover: C.oscuro2, texto: C.blanco, borde: "transparent" },
  contorno: { fondo: "transparent", hover: "rgba(255,255,255,0.08)", texto: C.blanco, borde: C.bordeBoton },
} as const;

// Botón que es un enlace real (<a href>) cuando lleva `href`
export function BotonLanding({ variante, etiqueta, href, onPress, ayuda, anchoCompleto, chico, icono }: PropsBoton) {
  const c = COLORES_BOTON[variante];
  const [encima, setEncima] = useState(false);
  const boton = (
    <Pressable
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda}
      onPress={onPress}
      onHoverIn={() => setEncima(true)}
      onHoverOut={() => setEncima(false)}
      // Un solo objeto: el enlace de expo-router mezcla estilos y no entiende arreglos
      style={StyleSheet.flatten([
        estilos.boton,
        chico ? estilos.botonChico : null,
        anchoCompleto ? estilos.botonCompleto : null,
        { backgroundColor: encima ? c.hover : c.fondo, borderColor: c.borde },
      ])}
    >
      <T style={{ color: c.texto, fontWeight: "700", fontSize: 15 }}>{etiqueta}</T>
      {icono}
    </Pressable>
  );
  return href ? (
    <Link href={href} asChild>
      {boton}
    </Link>
  ) : (
    boton
  );
}

// Enlace de texto que lleva a otra pantalla o baja a una sección
export function EnlaceTexto({
  etiqueta,
  ayuda,
  href,
  onPress,
  style,
}: {
  etiqueta: string;
  ayuda: string;
  href?: Href;
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
}) {
  const [encima, setEncima] = useState(false);
  const contenido = (
    <Pressable
      accessibilityRole={href ? "link" : "button"}
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda}
      onPress={onPress}
      onHoverIn={() => setEncima(true)}
      onHoverOut={() => setEncima(false)}
      style={estilos.enlace}
    >
      <T style={[{ fontSize: 15, fontWeight: "500" }, encima && { textDecorationLine: "underline" }, style]}>{etiqueta}</T>
    </Pressable>
  );
  return href ? (
    <Link href={href} asChild>
      {contenido}
    </Link>
  ) : (
    contenido
  );
}

export function Etiqueta({ children }: { children: string }) {
  return (
    <T
      accessibilityRole="header"
      style={{ fontSize: 13, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: C.etiqueta }}
    >
      {children}
    </T>
  );
}

// Encabezado de sección: etiqueta, título y, a veces, un párrafo
export function EncabezadoSeccion({
  etiqueta,
  titulo,
  texto,
  centrado,
  margenInferior = 48,
}: {
  etiqueta: string;
  titulo: string;
  texto?: string;
  centrado?: boolean;
  margenInferior?: number;
}) {
  const { movil } = useAnchos();
  const alin: ViewStyle = centrado ? { alignItems: "center" } : {};
  const centro: TextStyle = centrado ? { textAlign: "center" } : {};
  return (
    <View style={[alin, { marginBottom: margenInferior }]}>
      <Etiqueta>{etiqueta}</Etiqueta>
      <T
        accessibilityRole="header"
        aria-level={2}
        style={[
          { fontSize: movil ? 30 : 40, lineHeight: movil ? 35 : 46, fontWeight: "800", letterSpacing: -0.8, marginTop: 12, maxWidth: 760 },
          centro,
          texto ? { marginBottom: 16 } : null,
        ]}
      >
        {titulo}
      </T>
      {texto ? (
        <T style={[{ fontSize: 18, lineHeight: 29, color: C.textoSuave, maxWidth: 660 }, centro]}>{texto}</T>
      ) : null}
    </View>
  );
}

// Fondo de una sección (blanco o gris) con el relleno vertical del diseño
export function Seccion({
  gris,
  children,
  id,
}: {
  gris?: boolean;
  children: ReactNode;
  id?: string;
}) {
  const { movil } = useAnchos();
  return (
    <View
      nativeID={id}
      style={{ paddingVertical: movil ? 64 : 96, backgroundColor: gris ? C.fondoGris : C.blanco }}
    >
      <Contenedor>{children}</Contenedor>
    </View>
  );
}

// ---- Iconos del diseño ----
export type NombreIcono =
  | "calendario"
  | "tendencia"
  | "equipo"
  | "barras"
  | "tijeras"
  | "peluqueria"
  | "estrella"
  | "spa"
  | "unas"
  | "salud"
  | "pesas"
  | "mas"
  | "celular"
  | "dinero"
  | "mensaje"
  | "persona"
  | "rayo"
  | "campana"
  | "check"
  | "flecha"
  | "chevron";

// Los iconos son decorativos. En la web Svg pinta un elemento HTML y solo entiende aria-hidden;
// las props de Android/iOS le salen como aviso en la consola.
const OCULTAR_AL_LECTOR =
  Platform.OS === "web"
    ? { "aria-hidden": true }
    : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const };

export function Icono({ nombre, color, tamano = 24 }: { nombre: NombreIcono; color: string; tamano?: number }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
  let cuerpo: ReactNode;
  switch (nombre) {
    case "calendario":
      cuerpo = (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3} {...p} />
          <Path d="M8 3v4M16 3v4M3 10h18" {...p} />
        </>
      );
      break;
    case "tendencia":
      cuerpo = <Path d="M3 17l6-6 4 4 8-8M15 7h6v6" {...p} />;
      break;
    case "equipo":
      cuerpo = <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" {...p} />;
      break;
    case "barras":
      cuerpo = <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...p} />;
      break;
    case "tijeras":
      cuerpo = (
        <>
          <Circle cx={6} cy={6} r={3} {...p} />
          <Circle cx={6} cy={18} r={3} {...p} />
          <Path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12" {...p} />
        </>
      );
      break;
    case "peluqueria":
      cuerpo = <Path d="M12 3c-4 0-7 3-7 7 0 5 3 7 3 11h8c0-4 3-6 3-11 0-4-3-7-7-7z" {...p} />;
      break;
    case "estrella":
      cuerpo = <Path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z" {...p} />;
      break;
    case "spa":
      cuerpo = (
        <>
          <Path d="M12 21c-5-3-8-6-8-10a8 8 0 0116 0c0 4-3 7-8 10z" {...p} />
          <Path d="M9 11c1.5 1.5 4.5 1.5 6 0" {...p} />
        </>
      );
      break;
    case "unas":
      cuerpo = <Path d="M8 3v8a4 4 0 008 0V3M12 15v6" {...p} />;
      break;
    case "salud":
      cuerpo = <Path d="M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11z" {...p} />;
      break;
    case "pesas":
      cuerpo = <Path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" {...p} />;
      break;
    case "mas":
      cuerpo = <Path d="M12 5v14M5 12h14" {...p} strokeWidth={2.4} />;
      break;
    case "celular":
      cuerpo = (
        <>
          <Rect x={5} y={2} width={14} height={20} rx={3} {...p} />
          <Path d="M11 18h2" {...p} />
        </>
      );
      break;
    case "dinero":
      cuerpo = <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" {...p} />;
      break;
    case "mensaje":
      cuerpo = <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" {...p} />;
      break;
    case "persona":
      cuerpo = (
        <>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4 21a8 8 0 0116 0" {...p} />
        </>
      );
      break;
    case "rayo":
      cuerpo = <Path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color} stroke="none" />;
      break;
    case "campana":
      cuerpo = <Path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" {...p} />;
      break;
    case "check":
      cuerpo = <Path d="M5 12l5 5L20 7" {...p} strokeWidth={2.4} />;
      break;
    case "flecha":
      cuerpo = <Path d="M5 12h14M13 6l6 6-6 6" {...p} strokeWidth={2.4} />;
      break;
    case "chevron":
      cuerpo = <Path d="M6 9l6 6 6-6" {...p} />;
      break;
  }
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" {...OCULTAR_AL_LECTOR}>
      {cuerpo}
    </Svg>
  );
}

// Cuadro del icono de las tarjetas
export function CajaIcono({
  fondo,
  tamano = 48,
  children,
}: {
  fondo: string;
  tamano?: number;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        width: tamano,
        height: tamano,
        borderRadius: 12,
        backgroundColor: fondo,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { width: "100%", maxWidth: ANCHO_MAXIMO, alignSelf: "center" },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 22,
    minHeight: 48,
    alignSelf: "flex-start",
  },
  botonChico: { paddingVertical: 10, paddingHorizontal: 18, minHeight: 44 },
  botonCompleto: { alignSelf: "stretch" },
  enlace: { minHeight: 44, justifyContent: "center" },
});
