import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Barbero, Empresa } from "@/types";

type Props = { barbero: Barbero; empresa: Empresa };

export default function PerfilBadge({ barbero, empresa }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <Text style={[styles.nombre, { color: colors.textPrimary }]}>
        👤 {barbero.nombre}
      </Text>
      <Text style={[styles.rol, { color: colors.primary }]}>
        {barbero.esAdmin
          ? `👑 Administrador Principal (${empresa.nombre})`
          : `💈 Integrante del Equipo (${empresa.nombre}) · ${barbero.porcentajeGanancia}% Comisión`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 10 },
  nombre: { fontSize: 16, fontWeight: "bold" },
  rol: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
});
