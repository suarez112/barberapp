import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Tocable from "@/components/ui/Tocable";
import { APP_LEMA } from "@/config/app";
import { COLORES_LANDING } from "@/theme/paleta";
import { useAppTheme } from "@/theme/ThemeProvider";
import BotonTema from "./BotonTema";

const logo = require("../../../assets/logo-app.webp");

type PropsFranja = {
  titulo: string;
  subtitulo?: string;
  onVolver?: () => void;
  // Versión baja: logo pequeño y sin lema, para que el teclado no tape los campos
  baja?: boolean;
};

// Franja de marca de las pantallas de entrada (elegir perfil, iniciar sesión, cuenta de cliente y
// código del negocio) en celular: siempre oscura, con el logo, el lema y el título de la pantalla;
// una línea amarilla fina la separa del fondo en ambos temas. No se usa dentro de los paneles.
export function FranjaMarca({ titulo, subtitulo, onVolver, baja = false }: PropsFranja) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.franja, baja && styles.franjaBaja, { paddingTop: top + (baja ? 4 : 12) }]}>
      <View style={styles.barra}>
        {onVolver ? (
          <Tocable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            accessibilityHint="Regresa a la pantalla anterior"
            style={styles.volver}
            onPress={onVolver}
          >
            <Ionicons name="arrow-back-outline" size={24} color={COLORES_LANDING.blanco} />
          </Tocable>
        ) : (
          <View style={styles.volver} />
        )}
        <BotonTema sobreOscuro />
      </View>
      <Image
        source={logo}
        accessibilityLabel="Logo de Agendality"
        style={baja ? styles.logoBajo : styles.logo}
        contentFit="contain"
      />
      {baja ? null : <Text style={styles.lema}>{APP_LEMA}</Text>}
      <Text accessibilityRole="header" style={[styles.titulo, baja && styles.tituloBajo]}>
        {titulo}
      </Text>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

type Props = PropsFranja & {
  children: ReactNode;
  // Centra el contenido en vertical en el espacio que queda bajo la franja
  centrado?: boolean;
  // Opciones al final del contenido (ej. "¿No tienes cuenta?"), 32 px bajo el contenido;
  // el espacio que sobra queda al final de la pantalla
  pie?: ReactNode;
};

// Pantalla completa con la franja de marca arriba, el contenido y, opcionalmente, un pie.
// Se desplaza si el teclado tapa los campos.
export default function PantallaMarca({ titulo, subtitulo, onVolver, baja, children, centrado, pie }: Props) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={[styles.pantalla, { backgroundColor: colors.bg }]}>
      {/* La franja es siempre oscura: los iconos de la barra de estado van claros */}
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.pantalla}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <FranjaMarca titulo={titulo} subtitulo={subtitulo} onVolver={onVolver} baja={baja} />
          <View style={[styles.contenido, centrado && styles.contenidoCentrado]}>{children}</View>
          {pie ? <View style={styles.pie}>{pie}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  franja: {
    backgroundColor: COLORES_LANDING.oscuro,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 28,
    borderBottomWidth: 2,
    borderBottomColor: COLORES_LANDING.amarilloOscuro,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  barra: { alignSelf: "stretch", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  franjaBaja: { paddingBottom: 14 },
  logoBajo: { width: 44, height: 44, borderRadius: 12 },
  tituloBajo: { fontSize: 20, marginTop: 8 },
  subtitulo: { color: "#D1D5DB", fontSize: 14, marginTop: 6, textAlign: "center" },
  volver: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  logo: { width: 84, height: 84, borderRadius: 20, marginTop: 4 },
  lema: { color: COLORES_LANDING.amarillo, fontSize: 14, fontWeight: "bold", marginTop: 14, textAlign: "center" },
  titulo: { color: COLORES_LANDING.blanco, fontSize: 24, fontWeight: "bold", marginTop: 6, textAlign: "center" },
  contenido: { paddingHorizontal: 20, paddingTop: 8 },
  contenidoCentrado: { flexGrow: 1, justifyContent: "center", paddingVertical: 16 },
  pie: { paddingHorizontal: 20, marginTop: 20, gap: 4 },
  lineaEnlace: { height: 1, marginBottom: 6 },
  enlace: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  textoEnlace: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  enlaceMarcado: { fontWeight: "bold", textDecorationLine: "underline" },
});

// Enlace de pie separado del contenido por una línea: "texto normal" + "parte en negrita subrayada"
export function EnlaceInferior({
  texto,
  enlace,
  ayuda,
  onPress,
}: {
  texto?: string;
  enlace: string;
  ayuda: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View>
      <View style={[styles.lineaEnlace, { backgroundColor: colors.cardBorder }]} />
      <Tocable
        accessibilityRole="link"
        accessibilityLabel={`${texto ?? ""}${enlace}`}
        accessibilityHint={ayuda}
        style={styles.enlace}
        onPress={onPress}
      >
        <Text style={[styles.textoEnlace, { color: colors.textSecondary }]}>
          {texto ? `${texto}
` : ""}
          <Text style={[styles.enlaceMarcado, { color: colors.primaryText }]}>{enlace}</Text>
        </Text>
      </Tocable>
    </View>
  );
}
