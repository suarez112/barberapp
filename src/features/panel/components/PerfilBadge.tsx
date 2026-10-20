import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Empresa } from "@/types";

type Props = {
  nombre: string;
  esAdmin: boolean;
  esCuentaAdmin: boolean;
  porcentaje?: number;
  empresa: Empresa;
};

export default function PerfilBadge({
  nombre,
  esAdmin,
  esCuentaAdmin,
  porcentaje,
  empresa,
}: Props) {
  const { colors } = useAppTheme();
  const rol = esCuentaAdmin
    ? `👑 Administración de ${empresa.nombre}`
    : esAdmin
      ? `👑 Administrador (${empresa.nombre})`
      : `💈 Integrante del Equipo (${empresa.nombre}) · ${porcentaje ?? 0}% Comisión`;
  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <Text style={[styles.nombre, { color: colors.textPrimary }]}>👤 {nombre}</Text>
      <Text style={[styles.rol, { color: colors.primaryText }]}>{rol}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 10 },
  nombre: { fontSize: 16, fontWeight: "bold" },
  rol: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
});
