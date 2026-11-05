import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import BotonIcono from "./BotonIcono";

type Props = {
  visible: boolean;
  titulo: string;
  // Texto corto debajo del título (opcional)
  descripcion?: string;
  onCerrar: () => void;
  // Mientras guarda no se puede cerrar
  ocupado?: boolean;
  children: ReactNode;
};

// Desde este ancho la ventana va centrada; en un celular sube desde abajo
const ANCHO_CENTRADA = 600;

// Ventana modal para un formulario (editar un integrante, tu perfil...). El fondo no la
// cierra al tocarlo, para no perder lo que se llenó: se cierra con la X o con Cancelar.
export default function VentanaFormulario({ visible, titulo, descripcion, onCerrar, ocupado = false, children }: Props) {
  const { colors } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const centrada = width >= ANCHO_CENTRADA;
  const cerrar = ocupado ? () => {} : onCerrar;

  return (
    <Modal visible={visible} transparent animationType={centrada ? "fade" : "slide"} onRequestClose={cerrar}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.raiz, centrada ? styles.raizCentrada : styles.raizHoja]}
      >
        <View style={[styles.fondo, { backgroundColor: COLORES.velo }]} />
        <View
          accessibilityViewIsModal
          style={[
            styles.ventana,
            centrada ? styles.centrada : styles.hoja,
            {
              backgroundColor: colors.bg,
              borderColor: colors.cardBorder,
              paddingBottom: centrada ? 20 : 12 + bottom,
            },
          ]}
        >
          {!centrada ? <View style={[styles.asa, { backgroundColor: colors.cardBorder }]} /> : null}
          <View style={styles.cabecera}>
            <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
              {titulo}
            </Text>
            <BotonIcono
              icono="close"
              color={colors.textPrimary}
              etiqueta="Cerrar"
              ayuda="Cierra la ventana sin guardar"
              tamano={24}
              onPress={cerrar}
            />
          </View>
          {descripcion ? (
            <Text style={[styles.descripcion, { color: colors.textSecondary }]}>{descripcion}</Text>
          ) : null}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contenido}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  raizHoja: { justifyContent: "flex-end" },
  raizCentrada: { justifyContent: "center", alignItems: "center", padding: 24 },
  fondo: { ...StyleSheet.absoluteFill },
  ventana: { borderWidth: 1, paddingHorizontal: 16 },
  hoja: { maxHeight: "92%", borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomWidth: 0, paddingTop: 8 },
  centrada: { width: "100%", maxWidth: 520, maxHeight: "90%", borderRadius: 14, paddingTop: 12, paddingHorizontal: 20 },
  asa: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 4 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  titulo: { fontSize: 20, fontWeight: "bold", flex: 1 },
  descripcion: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  contenido: { paddingTop: 8, paddingBottom: 8 },
});
