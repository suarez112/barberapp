import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { APP_NOMBRE } from "@/config/app";
import { useAppTheme } from "@/theme/ThemeProvider";
import { confirmar } from "@/utils/dialogos";
import ActividadSuperadmin from "./ActividadSuperadmin";
import InicioSuperadmin from "./InicioSuperadmin";
import NegociosSuperadmin from "./NegociosSuperadmin";
import PqrsSuperadmin from "./PqrsSuperadmin";
import { useSuperadmin } from "./SuperadminContext";

type Seccion = "inicio" | "negocios" | "pqrs" | "actividad";

const SECCIONES: { id: Seccion; texto: string; icono: ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "inicio", texto: "Inicio", icono: "grid-outline" },
  { id: "negocios", texto: "Negocios", icono: "storefront-outline" },
  { id: "pqrs", texto: "PQRS", icono: "chatbubble-ellipses-outline" },
  { id: "actividad", texto: "Actividad", icono: "list-outline" },
];

// Ancho de la ventana por debajo del cual el menú lateral muestra solo íconos
const ANCHO_MENU_COMPACTO = 900;

// Panel de escritorio: menú lateral a la izquierda y la sección elegida a la derecha
export default function PanelSuperadmin() {
  const { colors, esOscuro, alternarTema } = useAppTheme();
  const { correo, salir } = useSuperadmin();
  const { width } = useWindowDimensions();
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const compacto = width < ANCHO_MENU_COMPACTO;

  const cerrarSesion = async () => {
    const seguir = await confirmar({
      titulo: "¿Cerrar sesión?",
      mensaje: "Tendrás que escribir de nuevo tu contraseña y tu código de verificación.",
    });
    if (seguir) salir();
  };

  const boton = (
    icono: ComponentProps<typeof Ionicons>["name"],
    texto: string,
    ayuda: string,
    onPress: () => void,
    activo = false,
    color?: string,
  ) => (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={ayuda}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[
        styles.item,
        compacto && styles.itemCompacto,
        activo && { backgroundColor: colors.primary },
      ]}
    >
      <Ionicons name={icono} size={22} color={activo ? colors.onPrimary : (color ?? colors.textPrimary)} />
      {compacto ? null : (
        <Text style={[styles.textoItem, { color: activo ? colors.onPrimary : (color ?? colors.textPrimary) }]}>
          {texto}
        </Text>
      )}
    </Tocable>
  );

  return (
    <View style={[styles.pagina, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.menu,
          compacto && styles.menuCompacto,
          { backgroundColor: colors.headerBg, borderColor: colors.cardBorder },
        ]}
      >
        {compacto ? null : (
          <Text style={[styles.marca, { color: colors.primaryText }]}>{APP_NOMBRE.toUpperCase()}</Text>
        )}
        <View style={styles.items}>
          {SECCIONES.map((s) =>
            boton(s.icono, s.texto, `Muestra la sección ${s.texto}`, () => setSeccion(s.id), seccion === s.id),
          )}
        </View>
        <View style={styles.pie}>
          {compacto ? null : (
            <Text numberOfLines={1} style={[styles.correo, { color: colors.textSecondary }]}>
              {correo}
            </Text>
          )}
          {boton(
            esOscuro ? "sunny-outline" : "moon-outline",
            esOscuro ? "Tema claro" : "Tema oscuro",
            "Cambia los colores del panel entre claro y oscuro",
            alternarTema,
          )}
          {boton("log-out-outline", "Cerrar sesión", "Pide confirmación y cierra tu sesión", cerrarSesion, false, colors.error)}
        </View>
      </View>

      <ScrollView style={styles.contenido} contentContainerStyle={styles.contenidoInterno}>
        <View style={styles.columna}>
          {/* Cada sección carga sus datos al abrirse */}
          {seccion === "inicio" && <InicioSuperadmin />}
          {seccion === "negocios" && <NegociosSuperadmin />}
          {seccion === "pqrs" && <PqrsSuperadmin />}
          {seccion === "actividad" && <ActividadSuperadmin />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, flexDirection: "row" },
  menu: { width: 240, borderRightWidth: 1, paddingVertical: 24, paddingHorizontal: 12 },
  menuCompacto: { width: 72, paddingHorizontal: 8 },
  marca: { fontSize: 16, fontWeight: "bold", letterSpacing: 1.5, paddingHorizontal: 12, marginBottom: 24 },
  items: { flex: 1, gap: 4 },
  pie: { gap: 4 },
  correo: { fontSize: 12, paddingHorizontal: 12, marginBottom: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  itemCompacto: { justifyContent: "center", paddingHorizontal: 0 },
  textoItem: { fontSize: 15, fontWeight: "600" },
  contenido: { flex: 1 },
  contenidoInterno: { padding: 32 },
  columna: { width: "100%", maxWidth: 1200, alignSelf: "center" },
});
