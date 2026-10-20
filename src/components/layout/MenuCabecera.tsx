import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Tocable from "@/components/ui/Tocable";
import { useNotificaciones } from "@/features/notificaciones/NotificacionesProvider";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  visible: boolean;
  onCerrar: () => void;
  // Sin sesión abierta no se muestra "Cerrar sesión"
  onSalir?: () => void;
};

type Opcion = {
  icono: ComponentProps<typeof Ionicons>["name"];
  texto: string;
  ayuda: string;
  color?: string;
  onPress: () => void;
};

// Hoja que sube desde abajo con las opciones de la cabecera
export default function MenuCabecera({ visible, onCerrar, onSalir }: Props) {
  const { colors, esOscuro, alternarTema } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const { push } = useRouter();
  const notificaciones = useNotificaciones();

  const opciones: Opcion[] = [
    {
      icono: esOscuro ? "sunny-outline" : "moon-outline",
      texto: esOscuro ? "Tema claro" : "Tema oscuro",
      ayuda: esOscuro ? "Cambia la app a colores claros" : "Cambia la app a colores oscuros",
      onPress: () => {
        alternarTema();
        onCerrar();
      },
    },
    ...(notificaciones.visible
      ? [
          {
            icono: notificaciones.activas
              ? ("notifications-outline" as const)
              : ("notifications-off-outline" as const),
            texto: notificaciones.activas
              ? "Notificaciones: activadas"
              : "Notificaciones: desactivadas",
            ayuda: notificaciones.activas
              ? "Desactiva los avisos de citas en este celular"
              : "Activa los avisos de citas en este celular",
            onPress: () => {
              onCerrar();
              notificaciones.alternar();
            },
          },
        ]
      : []),
    {
      icono: "help-circle-outline",
      texto: "Ayuda",
      ayuda: "Abre PQRS, contacto del desarrollador y datos de la app",
      onPress: () => {
        onCerrar();
        push("/ayuda");
      },
    },
  ];
  if (onSalir) {
    opciones.push({
      icono: "log-out-outline",
      texto: "Cerrar sesión",
      ayuda: "Pide confirmación y sale de tu cuenta en este celular",
      color: colors.error,
      onPress: () => {
        onCerrar();
        onSalir();
      },
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar menú"
        accessibilityHint="Vuelve a la pantalla"
        style={styles.fondo}
        onPress={onCerrar}
      />
      <View
        style={[
          styles.hoja,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
            paddingBottom: 12 + bottom,
          },
        ]}
      >
        <View style={[styles.asa, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.titulo, { color: colors.textSecondary }]}>MENÚ</Text>
        {opciones.map((o) => (
          <Tocable
            key={o.texto}
            accessibilityRole="button"
            accessibilityLabel={o.texto}
            accessibilityHint={o.ayuda}
            style={styles.opcion}
            onPress={o.onPress}
          >
            <Ionicons name={o.icono} size={22} color={o.color ?? colors.primaryText} />
            <Text style={[styles.textoOpcion, { color: o.color ?? colors.textPrimary }]}>
              {o.texto}
            </Text>
          </Tocable>
        ))}
      </View>
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
  titulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 4 },
  opcion: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 52 },
  textoOpcion: { fontSize: 16, fontWeight: "600" },
});
