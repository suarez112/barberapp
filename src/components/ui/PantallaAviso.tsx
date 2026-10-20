import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  icono: ComponentProps<typeof Ionicons>["name"];
  titulo: string;
  mensaje?: string | null;
  // Botones o contenido extra debajo del mensaje
  children?: ReactNode;
};

// Aviso centrado con ícono grande (negocio inactivo, suscripción vencida…)
export default function PantallaAviso({ icono, titulo, mensaje, children }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.contenedor}>
      <Ionicons name={icono} size={64} color={colors.avisoTexto} />
      <Text style={[styles.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
      {mensaje ? (
        <Text style={[styles.mensaje, { color: colors.textSecondary }]}>{mensaje}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", marginTop: 40, paddingHorizontal: 10 },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  mensaje: { fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: "center" },
});
