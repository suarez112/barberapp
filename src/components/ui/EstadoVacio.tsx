import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  icono?: ComponentProps<typeof Ionicons>["name"];
  titulo: string;
  mensaje?: string;
  textoAccion?: string;
  ayudaAccion?: string;
  onAccion?: () => void;
};

// Lista vacía: ícono, mensaje claro y, si aplica, una acción
export default function EstadoVacio({
  icono = "calendar-outline",
  titulo,
  mensaje,
  textoAccion,
  ayudaAccion,
  onAccion,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={s.caja}>
      <Ionicons name={icono} size={40} color={colors.textSecondary} />
      <Text style={[s.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
      {mensaje ? (
        <Text style={[s.mensaje, { color: colors.textSecondary }]}>
          {mensaje}
        </Text>
      ) : null}
      {textoAccion && onAccion ? (
        <Boton
          titulo={textoAccion}
          ayuda={ayudaAccion ?? textoAccion}
          onPress={onAccion}
        />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  caja: { alignItems: "center", gap: 8, paddingVertical: 24 },
  titulo: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  mensaje: { fontSize: 13, textAlign: "center" },
});
