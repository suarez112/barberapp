import { useEffect, useRef, useState } from "react";
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TelefonoConBandera from "@/components/ui/TelefonoConBandera";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Cita } from "@/types";
import TarjetaCita from "./TarjetaCita";

type Props = {
  // Sin cita la hoja está cerrada
  cita: Cita | null;
  puedeCompletar: boolean;
  esAdmin: boolean;
  onCompletar: (c: Cita) => void;
  onCancelar: (c: Cita) => void;
  onCerrar: () => void;
};

// Pasado este arrastre hacia abajo (px) la hoja se cierra
const UMBRAL_CIERRE = 90;

// Hoja que sube desde abajo con los datos de una cita y sus acciones.
// Se cierra tocando fuera o deslizándola hacia abajo.
export default function HojaCita({
  cita,
  puedeCompletar,
  esAdmin,
  onCompletar,
  onCancelar,
  onCerrar,
}: Props) {
  const { colors } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const [desplazamiento] = useState(() => new Animated.Value(0));
  // El gesto se crea una sola vez; siempre debe llamar al onCerrar más reciente
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });
  const cerrarAlSoltar = () => cerrar.current();

  // Cada vez que se abre, parte sin desplazamiento
  const id = cita?.id;
  useEffect(() => {
    desplazamiento.setValue(0);
  }, [id, desplazamiento]);

  // eslint-disable-next-line react-hooks/refs
  const [arrastre] = useState(() =>
    PanResponder.create({
      // Solo toma el gesto si es un deslizamiento vertical, para no quitar los toques a los botones
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => desplazamiento.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > UMBRAL_CIERRE || g.vy > 0.8) cerrarAlSoltar();
        else
          Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () =>
        Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true }).start(),
    }),
  );

  return (
    <Modal visible={cita !== null} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar detalle de la cita"
        accessibilityHint="Vuelve a la línea de tiempo"
        style={styles.fondo}
        onPress={onCerrar}
      />
      <Animated.View
        {...arrastre.panHandlers}
        style={[
          styles.hoja,
          {
            backgroundColor: colors.bg,
            borderColor: colors.cardBorder,
            paddingBottom: 16 + bottom,
            transform: [{ translateY: desplazamiento }],
          },
        ]}
      >
        <View style={[styles.asa, { backgroundColor: colors.cardBorder }]} />
        {cita ? (
          <>
            <Text style={[styles.titulo, { color: colors.textSecondary }]}>DETALLE DE LA CITA</Text>
            <View style={styles.telefono}>
              <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Teléfono</Text>
              <TelefonoConBandera
                telefono={cita.telefono}
                indicativo={cita.indicativo}
                style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "bold" }}
              />
            </View>
            <TarjetaCita
              cita={cita}
              puedeCompletar={puedeCompletar}
              esAdmin={esAdmin}
              onCompletar={onCompletar}
              onCancelar={onCancelar}
            />
          </>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  hoja: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  asa: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 8 },
  telefono: { marginBottom: 8, gap: 2 },
  etiqueta: { fontSize: 12 },
});
