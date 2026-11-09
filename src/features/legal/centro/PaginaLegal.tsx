import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import Head from "expo-router/head";
import { ReactNode, Ref, useSyncExternalStore } from "react";
import {
  Platform,
  ScrollView,
  type ScrollViewInstance,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "@/components/layout/AppHeader";
import Tocable from "@/components/ui/Tocable";
import { APP_NOMBRE } from "@/config/app";
import { useVolver } from "@/features/ayuda/volverAyuda";
import { useAppTheme } from "@/theme/ThemeProvider";
import { ENTRADAS_LEGALES, EntradaLegal } from "./secciones";

// Desde este ancho (web de computador) el Centro Legal lleva menú lateral
const ANCHO_MENU_LATERAL = 900;
// Ancho cómodo para leer un documento
const ANCHO_LECTURA = 760;

const suscribirNada = () => () => {};

// Menú lateral solo en la web ancha. El prerenderizado no conoce el ancho: se decide ya montada.
export function useMenuLateral() {
  const { width } = useWindowDimensions();
  const montado = useSyncExternalStore(suscribirNada, () => true, () => false);
  return Platform.OS === "web" && montado && width >= ANCHO_MENU_LATERAL;
}

type Props = {
  // Título de la pestaña del navegador
  tituloPestana: string;
  // Entrada del menú que se está viendo (null en el índice)
  activa: EntradaLegal["clave"] | null;
  scrollRef?: Ref<ScrollViewInstance>;
  children: ReactNode;
};

// Estructura de las páginas públicas del Centro Legal: cabecera, menú lateral
// (computador) y el contenido con scroll en un ancho de lectura
export default function PaginaLegal({ tituloPestana, activa, scrollRef, children }: Props) {
  const { colors, esOscuro } = useAppTheme();
  const volver = useVolver();
  const menuLateral = useMenuLateral();

  return (
    <SafeAreaView style={[styles.pantalla, { backgroundColor: colors.bg }]}>
      <Head>
        <title>{`${tituloPestana} · ${APP_NOMBRE}`}</title>
      </Head>
      <StatusBar barStyle={esOscuro ? "light-content" : "dark-content"} />
      <AppHeader onVolver={volver} />
      <View style={[styles.cuerpo, menuLateral && styles.cuerpoAncho]}>
        {menuLateral ? <MenuLateral activa={activa} /> : null}
        <ScrollView
          ref={scrollRef}
          style={styles.pantalla}
          contentContainerStyle={[styles.contenido, menuLateral && styles.contenidoAncho]}
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function MenuLateral({ activa }: { activa: EntradaLegal["clave"] | null }) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="navigation"
      accessibilityLabel="Documentos legales"
      style={[styles.menu, { borderRightColor: colors.cardBorder }]}
    >
      <Link href="/legales" dismissTo asChild>
        <Tocable
          accessibilityRole="link"
          accessibilityLabel="Centro Legal"
          accessibilityHint="Abre el índice de documentos legales"
          style={styles.opcion}
        >
          <Text style={[styles.tituloMenu, { color: colors.primaryText }]}>CENTRO LEGAL</Text>
        </Tocable>
      </Link>
      {ENTRADAS_LEGALES.map((e) => {
        const actual = e.clave === activa;
        return (
          <Link key={e.clave} href={e.ruta} asChild>
            <Tocable
              accessibilityRole="link"
              accessibilityLabel={e.nombre}
              accessibilityHint={e.descripcion}
              accessibilityState={{ selected: actual }}
              // Hijo de <Link asChild>: expo-router pide un style plano, no un arreglo
              style={StyleSheet.flatten([styles.opcion, styles.opcionFila, actual && { backgroundColor: colors.seleccionBg }])}
            >
              <Ionicons name={e.icono} size={20} color={actual ? colors.seleccionTexto : colors.textSecondary} />
              <Text
                style={[
                  styles.textoOpcion,
                  { color: actual ? colors.seleccionTexto : colors.textPrimary },
                  actual && styles.negrita,
                ]}
              >
                {e.nombre}
              </Text>
            </Tocable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  cuerpo: { flex: 1 },
  cuerpoAncho: { flexDirection: "row", width: "100%", maxWidth: ANCHO_LECTURA + 300, alignSelf: "center" },
  contenido: { width: "100%", maxWidth: ANCHO_LECTURA, alignSelf: "center", padding: 16, paddingBottom: 48 },
  contenidoAncho: { paddingHorizontal: 32, paddingTop: 24 },
  menu: { width: 270, paddingVertical: 20, paddingRight: 12, borderRightWidth: 1, gap: 4 },
  opcion: { minHeight: 44, borderRadius: 8, paddingHorizontal: 12, justifyContent: "center" },
  opcionFila: { flexDirection: "row", alignItems: "center", gap: 10 },
  tituloMenu: { fontSize: 13, fontWeight: "bold", letterSpacing: 1.5 },
  textoOpcion: { flex: 1, fontSize: 14 },
  negrita: { fontWeight: "bold" },
});
