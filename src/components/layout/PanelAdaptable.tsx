import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, ReactNode, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Tocable from "@/components/ui/Tocable";
import CampanaNotificaciones from "@/features/notificaciones/centro/CampanaNotificaciones";
import { useAppTheme } from "@/theme/ThemeProvider";
import BotonCabecera from "./BotonCabecera";
import BotonTema from "./BotonTema";
import MenuCabecera from "./MenuCabecera";

// Desde este ancho el menú lateral queda fijo; entre ANCHO_MEDIO y este, se abre con ☰;
// por debajo (y en Android/iOS) el panel conserva la vista de celular
export const ANCHO_PANEL_ANCHO = 980;
export const ANCHO_MEDIO = 640;
const ANCHO_CONTENIDO = 1280;

export type ModoPanel = "movil" | "medio" | "ancho";

// Cómo se dibuja el panel según la plataforma y el ancho de la ventana
export function useModoPanel(): ModoPanel {
  const { width } = useWindowDimensions();
  if (Platform.OS !== "web") return "movil";
  if (width >= ANCHO_PANEL_ANCHO) return "ancho";
  if (width >= ANCHO_MEDIO) return "medio";
  return "movil";
}

export type SeccionPanel<Id extends string = string> = {
  id: Id;
  texto: string;
  icono: ComponentProps<typeof Ionicons>["name"];
};

type Props<Id extends string> = {
  secciones: SeccionPanel<Id>[];
  activa: Id;
  onCambiar: (id: Id) => void;
  // Nombre del negocio (arriba del menú)
  titulo: string;
  usuario: string;
  rol?: string;
  onSalir: () => void;
  // Contenido fijo sobre el scroll (ej. selector de profesionales)
  fijo?: ReactNode;
  // Botón que flota abajo a la derecha
  flotante?: ReactNode;
  modo: Exclude<ModoPanel, "movil">;
  children: ReactNode;
};

// Colores de la sección elegida: amarillo suave con borde amarillo y texto legible
function useColoresActivo() {
  const { colors, esOscuro } = useAppTheme();
  return {
    fondo: esOscuro ? "rgba(234, 179, 8, 0.16)" : "#FEF3C7",
    borde: "#EAB308",
    texto: esOscuro ? colors.textPrimary : "#111827",
  };
}

function BotonMenuLateral({
  icono,
  texto,
  ayuda,
  onPress,
  activo = false,
  color,
}: {
  icono: SeccionPanel["icono"];
  texto: string;
  ayuda: string;
  onPress: () => void;
  activo?: boolean;
  color?: string;
}) {
  const { colors } = useAppTheme();
  const act = useColoresActivo();
  const colorTexto = activo ? act.texto : (color ?? colors.textPrimary);
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={ayuda}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[
        styles.item,
        { borderColor: "transparent" },
        activo && { backgroundColor: act.fondo, borderColor: act.borde },
      ]}
    >
      <Ionicons name={icono} size={22} color={colorTexto} />
      <Text style={[styles.textoItem, { color: colorTexto }]}>{texto}</Text>
    </Tocable>
  );
}

// Panel del negocio en la web: menú lateral (fijo o desplegable) y el contenido a la derecha.
// Lo usan el administrador y el empleado; cada uno recibe solo sus secciones.
export default function PanelAdaptable<Id extends string>({
  secciones,
  activa,
  onCambiar,
  titulo,
  usuario,
  rol,
  onSalir,
  fijo,
  flotante,
  modo,
  children,
}: Props<Id>) {
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const ancho = modo === "ancho";

  const menu = (
    <View
      style={[
        styles.menu,
        !ancho && styles.menuDesplegable,
        { backgroundColor: colors.headerBg, borderColor: colors.cardBorder },
      ]}
    >
      <View style={[styles.marca, { borderColor: colors.cardBorder }]}>
        <Text numberOfLines={2} style={[styles.nombreNegocio, { color: colors.textPrimary }]}>
          {titulo}
        </Text>
      </View>
      <View accessibilityRole="tablist" style={styles.items}>
        {secciones.map((s) => (
          <BotonMenuLateral
            key={s.id}
            icono={s.icono}
            texto={s.texto}
            ayuda={`Abre la sección ${s.texto}`}
            activo={activa === s.id}
            onPress={() => {
              setMenuAbierto(false);
              onCambiar(s.id);
            }}
          />
        ))}
      </View>
      <View style={[styles.pie, { borderColor: colors.cardBorder }]}>
        <Text numberOfLines={1} style={[styles.usuario, { color: colors.textPrimary }]}>
          {usuario}
        </Text>
        {rol ? (
          <Text numberOfLines={1} style={[styles.rol, { color: colors.textSecondary }]}>
            {rol}
          </Text>
        ) : null}
        <BotonMenuLateral
          icono="log-out-outline"
          texto="Cerrar sesión"
          ayuda="Pide confirmación y cierra tu sesión"
          onPress={() => {
            setMenuAbierto(false);
            onSalir();
          }}
          color={colors.peligroTexto}
        />
      </View>
    </View>
  );

  return (
    // La altura de la ventana fija el panel: el menú queda a la vista y solo el contenido se desplaza
    <View style={[styles.pagina, { backgroundColor: colors.bg, height }]}>
      {ancho ? menu : null}

      <View style={styles.derecha}>
        <View
          style={[styles.barra, { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder }]}
        >
          {ancho ? null : (
            <BotonCabecera
              icono="menu-outline"
              etiqueta="Menú del panel"
              ayuda="Abre las secciones del panel"
              onPress={() => setMenuAbierto(true)}
            />
          )}
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.tituloBarra, { color: colors.primaryText }]}
          >
            {ancho ? (secciones.find((s) => s.id === activa)?.texto ?? "") : titulo}
          </Text>
          <CampanaNotificaciones />
          <BotonTema />
          <BotonCabecera
            icono="ellipsis-horizontal"
            etiqueta="Opciones"
            ayuda="Abre las opciones de tema, ayuda y cerrar sesión"
            onPress={() => setOpcionesAbiertas(true)}
          />
          <MenuCabecera
            visible={opcionesAbiertas}
            onCerrar={() => setOpcionesAbiertas(false)}
            onSalir={onSalir}
          />
        </View>

        {fijo ? (
          <View style={styles.fijoFondo}>
            <View style={styles.columna}>{fijo}</View>
          </View>
        ) : null}

        <View style={styles.cuerpo}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollInterno, ancho && styles.scrollAncho]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.columna}>{children}</View>
          </ScrollView>
          {flotante ? (
            <View style={styles.flotante} pointerEvents="box-none">
              {flotante}
            </View>
          ) : null}
        </View>
      </View>

      {!ancho && menuAbierto ? (
        <View style={styles.capa}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú del panel"
            accessibilityHint="Oculta las secciones"
            style={styles.fondoCapa}
            onPress={() => setMenuAbierto(false)}
          />
          {menu}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flexDirection: "row" },
  menu: { width: 260, borderRightWidth: 1, paddingVertical: 20, paddingHorizontal: 12 },
  menuDesplegable: { position: "absolute", top: 0, bottom: 0, left: 0 },
  marca: { paddingHorizontal: 8, paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1 },
  nombreNegocio: { fontSize: 18, fontWeight: "bold" },
  items: { flex: 1, gap: 6 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  textoItem: { fontSize: 15, fontWeight: "600" },
  pie: { gap: 4, borderTopWidth: 1, paddingTop: 12 },
  usuario: { fontSize: 14, fontWeight: "bold", paddingHorizontal: 12 },
  rol: { fontSize: 12, paddingHorizontal: 12, marginBottom: 6 },
  derecha: { flex: 1 },
  barra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 56,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tituloBarra: { flex: 1, fontSize: 16, fontWeight: "bold", paddingHorizontal: 4 },
  fijoFondo: { paddingHorizontal: 16 },
  cuerpo: { flex: 1 },
  scroll: { flex: 1 },
  scrollInterno: { paddingHorizontal: 16, paddingBottom: 96 },
  scrollAncho: { paddingHorizontal: 32, paddingBottom: 96 },
  columna: { width: "100%", maxWidth: ANCHO_CONTENIDO, alignSelf: "center" },
  flotante: { position: "absolute", right: 24, bottom: 24 },
  capa: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, flexDirection: "row" },
  fondoCapa: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
