import { ScrollView, StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Barbero } from "@/types";
import IconoEnLinea from "@/components/ui/IconoEnLinea";

type Props = {
  barberos: Barbero[];
  seleccionadoId?: string;
  onSeleccionar: (b: Barbero) => void;
  // Sin el título largo: para la barra fija de arriba
  compacto?: boolean;
};

// El administrador elige de quién ver la agenda y los balances
export default function SelectorSupervision({
  barberos,
  seleccionadoId,
  onSeleccionar,
  compacto = false,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={compacto ? styles.compacto : styles.contenedor}>
      {compacto ? null : (
        <TituloSeccion style={styles.titulo}>
          <IconoEnLinea nombre="eye-outline" color={colors.primaryText} /> SUPERVISAR AGENDA Y BALANCES DE:
        </TituloSeccion>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {barberos.map((emp) => {
          const esSel = seleccionadoId === emp.id;
          return (
            <Tocable
              key={emp.id}
              accessibilityRole="button"
              accessibilityState={{ selected: esSel }}
              accessibilityLabel={emp.esAdmin ? `${emp.nombre}, administrador` : emp.nombre}
              accessibilityHint="Muestra la agenda y la cartera de esta persona"
              style={[
                styles.opcion,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                esSel && {
                  borderColor: colors.primary,
                  backgroundColor: colors.cardSelectedBg,
                },
              ]}
              onPress={() => onSeleccionar(emp)}
            >
              <Text
                style={[
                  styles.nombre,
                  { color: esSel ? colors.primaryText : colors.textPrimary },
                ]}
              >
                {emp.nombre}{" "}
                {emp.esAdmin ? (
                  <IconoEnLinea nombre="shield-checkmark-outline" color={esSel ? colors.primaryText : colors.textPrimary} />
                ) : null}
              </Text>
              <Text style={[styles.comision, { color: colors.textSecondary }]}>
                {emp.porcentajeGanancia}% Comisión
              </Text>
            </Tocable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 15 },
  compacto: { marginTop: 8 },
  titulo: { marginTop: 0 },
  opcion: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  nombre: { fontSize: 12, fontWeight: "bold" },
  comision: { fontSize: 12 },
});
