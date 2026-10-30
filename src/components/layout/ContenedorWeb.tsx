import { usePathname } from "expo-router";
import { ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

// Ancho cómodo para leer en una pantalla grande
const ANCHO_MAXIMO = 760;
// Pantallas de entrada y del cliente: en la web van dentro de una tarjeta centrada
const ANCHO_TARJETA = 480;
// Por debajo de este ancho (celular) se queda a pantalla completa, como en Android/iOS
export const ANCHO_MINIMO_TARJETA = ANCHO_TARJETA + 40;
const MARGEN_VERTICAL = 32;
const RUTAS_TARJETA = [
  "/login",
  "/recuperar-clave",
  "/cliente",
  "/cuenta-cliente",
  "/mis-negocios",
  "/mis-citas",
];

// Sin suscripciones: solo sirve para distinguir el prerenderizado (false) del navegador (true)
const suscribirNada = () => () => {};

// Alto que necesita la tarjeta para mostrar todo su contenido sin desplazarse: lo que mide ahora
// más lo que le falta (o le sobra) al área con scroll de la pantalla. Null si no hay área con scroll.
function altoNecesario(tarjeta: HTMLElement): { alto: number; contenido: Element | null } | null {
  for (const nodo of Array.from(tarjeta.querySelectorAll<HTMLElement>("*"))) {
    const { overflowY } = getComputedStyle(nodo);
    if ((overflowY === "auto" || overflowY === "scroll") && nodo.scrollHeight > 0) {
      // scrollHeight nunca baja del alto visible, así que se mide el contenido interno
      const contenido = nodo.firstElementChild as HTMLElement | null;
      const alto = contenido ? contenido.offsetHeight : nodo.scrollHeight;
      return { alto: Math.ceil(tarjeta.offsetHeight - nodo.clientHeight + alto), contenido };
    }
  }
  return null;
}

const usaTarjeta = (ruta: string) =>
  RUTAS_TARJETA.some((r) => ruta === r || ruta.startsWith(`${r}/`));

// En la web, centra la app con un ancho máximo para que no se estire de lado a lado.
// El panel del superadmin, los del negocio (/panel y /admin) y la página principal ("/") usan el ancho completo.
// Iniciar sesión y las pantallas del cliente se muestran en una tarjeta centrada (horizontal y vertical) que mide lo que su contenido.
// En el celular no hace nada.
export default function ContenedorWeb({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const ruta = usePathname();
  const { width, height } = useWindowDimensions();
  // La página se prerenderiza sin conocer el ancho de la ventana y la hidratación no corrige
  // los estilos: la tarjeta se activa recién cuando la app ya está montada en el navegador.
  // La estructura es la misma en ambos casos, así el contenido no se vuelve a crear.
  const montado = useSyncExternalStore(suscribirNada, () => true, () => false);
  const referencia = useRef<unknown>(null);
  const [alto, setAlto] = useState<number>();
  const conTarjeta = montado && usaTarjeta(ruta) && width >= ANCHO_MINIMO_TARJETA;

  // La tarjeta mide lo que mide su contenido: se vuelve a medir cuando cambia la pantalla,
  // el contenido o la ventana. Si no cabe en la pantalla, el contenido se desplaza dentro.
  useEffect(() => {
    const nodo = referencia.current as HTMLElement | null;
    if (!conTarjeta || !nodo) return;
    let cuadro = 0;
    let observadorTamano: ResizeObserver | undefined;
    let observado: Element | null = null;
    const medir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const medida = altoNecesario(nodo);
        setAlto((antes) => {
          const nuevo = medida?.alto ?? height;
          return antes !== undefined && Math.abs(antes - nuevo) <= 1 ? antes : nuevo;
        });
        // El contenido también crece sin cambiar el DOM (fotos que cargan, textos que se parten)
        if (medida?.contenido && medida.contenido !== observado) {
          observadorTamano?.disconnect();
          observado = medida.contenido;
          observadorTamano?.observe(observado);
        }
      });
    };
    observadorTamano = new ResizeObserver(medir);
    const observadorDom = new MutationObserver(medir);
    observadorDom.observe(nodo, { childList: true, subtree: true, characterData: true });
    medir();
    return () => {
      cancelAnimationFrame(cuadro);
      observadorDom.disconnect();
      observadorTamano?.disconnect();
    };
  }, [conTarjeta, ruta, width, height]);

  if (Platform.OS !== "web" || ruta.startsWith("/superadmin") || ruta.startsWith("/panel") || ruta.startsWith("/admin") || ruta === "/") return <>{children}</>;

  const tarjeta = conTarjeta;
  const maximo = height - MARGEN_VERTICAL * 2;
  return (
    <View style={[styles.fondo, tarjeta && styles.fondoTarjeta, { backgroundColor: colors.bg }]}>
      <View
        ref={referencia as never}
        style={[
          styles.columna,
          tarjeta && styles.tarjeta,
          tarjeta && {
            borderColor: colors.inputBorder,
            backgroundColor: colors.bg,
            // Sin medir todavía queda oculta (ocupando el máximo) para no mostrar un salto
            height: Math.min(alto ?? maximo, maximo),
            opacity: alto === undefined ? 0 : 1,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, alignItems: "center" },
  columna: { flex: 1, width: "100%", maxWidth: ANCHO_MAXIMO },
  fondoTarjeta: { justifyContent: "center" },
  // El alto lo calcula el componente (contenido, con tope en la pantalla); flex 0 para respetarlo
  // y quedar centrada en vertical. Borde más marcado y una sombra suave para separarla del fondo.
  tarjeta: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    maxWidth: ANCHO_TARJETA,
    borderWidth: 2,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
  },
});
