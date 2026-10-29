import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { APP_NOMBRE } from "@/config/app";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, confirmar } from "@/utils/dialogos";
import ActividadSuperadmin from "./ActividadSuperadmin";
import CategoriasSuperadmin from "./CategoriasSuperadmin";
import AvisoInactividad from "./components/AvisoInactividad";
import InicioSuperadmin from "./InicioSuperadmin";
import NegociosSuperadmin from "./NegociosSuperadmin";
import PqrsSuperadmin from "./PqrsSuperadmin";
import { useSuperadmin } from "./SuperadminContext";
import { useInactividad } from "./useInactividad";

type Seccion = "inicio" | "negocios" | "pqrs" | "categorias" | "actividad";
type Icono = ComponentProps<typeof Ionicons>["name"];

const SECCIONES: { id: Seccion; texto: string; icono: Icono }[] = [
  { id: "inicio", texto: "Inicio", icono: "grid-outline" },
  { id: "negocios", texto: "Negocios", icono: "storefront-outline" },
  { id: "pqrs", texto: "PQRS", icono: "chatbubble-ellipses-outline" },
  { id: "categorias", texto: "Categorías", icono: "pricetags-outline" },
  { id: "actividad", texto: "Actividad", icono: "list-outline" },
];

// Ancho de la ventana por debajo del cual el menú lateral muestra solo íconos
const ANCHO_MENU_COMPACTO = 900;

type PropsBoton = {
  icono: Icono;
  texto: string;
  ayuda: string;
  onPress: () => void;
  compacto: boolean;
  activo?: boolean;
  // Color del ícono y el texto cuando no está activo (ej. rojo en "Cerrar sesión")
  color?: string;
};

// Una opción del menú lateral
function BotonMenu({ icono, texto, ayuda, onPress, compacto, activo = false, color }: PropsBoton) {
  const { colors } = useAppTheme();
  const colorTexto = activo ? colors.onPrimary : (color ?? colors.textPrimary);
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={ayuda}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[styles.item, compacto && styles.itemCompacto, activo && { backgroundColor: colors.primary }]}
    >
      <Ionicons name={icono} size={22} color={colorTexto} />
      {compacto ? null : <Text style={[styles.textoItem, { color: colorTexto }]}>{texto}</Text>}
    </Tocable>
  );
}

// Panel de escritorio: menú lateral a la izquierda y la sección elegida a la derecha
export default function PanelSuperadmin() {
  const { colors, esOscuro, alternarTema } = useAppTheme();
  const { correo, salir } = useSuperadmin();
  const { width, height } = useWindowDimensions();
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  // Negocio que se abre directo en Negocios (viene de los que vencen, en Inicio)
  const [negocioAbierto, setNegocioAbierto] = useState<string | null>(null);
  const compacto = width < ANCHO_MENU_COMPACTO;

  const cerrarSesion = async () => {
    const seguir = await confirmar({
      titulo: "¿Cerrar sesión?",
      mensaje: "Tendrás que escribir de nuevo tu contraseña y tu código de verificación.",
    });
    if (seguir) salir();
  };

  // A los 15 minutos sin actividad se cierra la sesión; un minuto antes se avisa
  const { segundosRestantes, seguirConectado } = useInactividad({
    onVencer: () => {
      salir();
      avisar("Sesión cerrada", "Cerramos tu sesión por 15 minutos sin actividad. Inicia sesión de nuevo.", "aviso");
    },
  });

  const irA = (id: Seccion) => {
    setNegocioAbierto(null);
    setSeccion(id);
  };

  const verNegocio = (id: string) => {
    setNegocioAbierto(id);
    setSeccion("negocios");
  };

  return (
    // La altura de la ventana fija el panel: el menú queda a la vista y solo el contenido se desplaza
    <View style={[styles.pagina, { backgroundColor: colors.bg, height }]}>
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
          {SECCIONES.map((s) => (
            <BotonMenu
              key={s.id}
              icono={s.icono}
              texto={s.texto}
              ayuda={`Muestra la sección ${s.texto}`}
              onPress={() => irA(s.id)}
              compacto={compacto}
              activo={seccion === s.id}
            />
          ))}
        </View>
        <View style={[styles.pie, { borderColor: colors.cardBorder }]}>
          {compacto ? null : (
            <Text numberOfLines={1} style={[styles.correo, { color: colors.textSecondary }]}>
              {correo}
            </Text>
          )}
          <BotonMenu
            icono={esOscuro ? "sunny-outline" : "moon-outline"}
            texto={esOscuro ? "Tema claro" : "Tema oscuro"}
            ayuda="Cambia los colores del panel entre claro y oscuro"
            onPress={alternarTema}
            compacto={compacto}
          />
          <BotonMenu
            icono="log-out-outline"
            texto="Cerrar sesión"
            ayuda="Pide confirmación y cierra tu sesión"
            onPress={cerrarSesion}
            compacto={compacto}
            color={colors.peligroTexto}
          />
        </View>
      </View>

      <ScrollView style={styles.contenido} contentContainerStyle={styles.contenidoInterno}>
        <View style={styles.columna}>
          {/* Cada sección carga sus datos al abrirse */}
          {seccion === "inicio" && <InicioSuperadmin onVerNegocio={verNegocio} />}
          {seccion === "negocios" && <NegociosSuperadmin idInicial={negocioAbierto} />}
          {seccion === "pqrs" && <PqrsSuperadmin />}
          {seccion === "categorias" && <CategoriasSuperadmin />}
          {seccion === "actividad" && <ActividadSuperadmin />}
        </View>
      </ScrollView>

      {segundosRestantes !== null ? (
        <AvisoInactividad segundos={segundosRestantes} onSeguir={seguirConectado} onSalir={salir} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flexDirection: "row" },
  menu: { width: 240, borderRightWidth: 1, paddingVertical: 24, paddingHorizontal: 12 },
  menuCompacto: { width: 72, paddingHorizontal: 8 },
  marca: { fontSize: 16, fontWeight: "bold", letterSpacing: 1.5, paddingHorizontal: 12, marginBottom: 24 },
  items: { flex: 1, gap: 4 },
  pie: { gap: 4, borderTopWidth: 1, paddingTop: 12 },
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
