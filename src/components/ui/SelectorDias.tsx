import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Tocable from "./Tocable";
import { useAppTheme } from "../../theme/ThemeProvider";
import { COLORES } from "../../theme/paleta";
import { Dia } from "../../types";
import {
  MESES_LARGOS,
  diasDelMes,
  mesCorto,
  mesDeFecha,
  sumarMeses,
} from "../../utils/fechas";

type Props = {
  seleccionado: Dia;
  onSeleccionar: (dia: Dia) => void;
  // Primer día que se puede elegir ("2026-10-18"); los anteriores no se muestran
  desde?: string;
  // Último día que se puede elegir; los siguientes no se muestran ni se navega a ellos
  hasta?: string;
};

// Días del mes visible, con flechas para cambiar de mes
export default function SelectorDias({
  seleccionado,
  onSeleccionar,
  desde,
  hasta,
}: Props) {
  const { colors } = useAppTheme();
  const [mes, setMes] = useState(() => mesDeFecha(seleccionado.fechaFull));

  const permitido = (fecha: string) =>
    (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
  const dias = diasDelMes(mes).filter((d) => permitido(d.fechaFull));
  // No se navega a meses sin ningún día permitido
  const anterior = sumarMeses(mes, -1);
  const siguiente = sumarMeses(mes, 1);
  const puedeRetroceder = diasDelMes(anterior).some((d) => permitido(d.fechaFull));
  const puedeAvanzar = diasDelMes(siguiente).some((d) => permitido(d.fechaFull));

  const flecha = (
    icono: "chevron-back" | "chevron-forward",
    etiqueta: string,
    habilitada: boolean,
    onPress: () => void,
  ) => (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !habilitada }}
      disabled={!habilitada}
      style={[styles.flecha, !habilitada && styles.deshabilitada]}
      onPress={onPress}
    >
      <Ionicons name={icono} size={20} color={colors.primary} />
    </Tocable>
  );

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        {flecha("chevron-back", "Mes anterior", puedeRetroceder, () =>
          setMes(anterior),
        )}
        <Text style={[styles.tituloMes, { color: colors.textPrimary }]}>
          {MESES_LARGOS[mes.mes]} {mes.anio}
        </Text>
        {flecha("chevron-forward", "Mes siguiente", puedeAvanzar, () =>
          setMes(siguiente),
        )}
      </View>

      {/* key: al cambiar de mes la lista vuelve al inicio */}
      <ScrollView
        key={`${mes.anio}-${mes.mes}`}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {dias.map((d) => {
          const esSel = seleccionado.fechaFull === d.fechaFull;
          return (
            <Tocable
              key={d.id}
              accessibilityRole="button"
              accessibilityState={{ selected: esSel }}
              style={[
                styles.dia,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                esSel && {
                  borderColor: colors.primary,
                  backgroundColor: colors.cardSelectedBg,
                },
              ]}
              onPress={() => onSeleccionar(d)}
            >
              <Text style={[styles.nombre, esSel && { color: colors.primary }]}>
                {d.diaNom}
              </Text>
              <Text
                style={[
                  styles.numero,
                  { color: esSel ? colors.primary : colors.textPrimary },
                ]}
              >
                {d.num}
              </Text>
              <Text style={[styles.mes, { color: colors.textSecondary }]}>
                {mesCorto(d.fechaFull)}
              </Text>
            </Tocable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 15 },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tituloMes: { fontSize: 15, fontWeight: "bold" },
  flecha: { padding: 6 },
  deshabilitada: { opacity: 0.3 },
  dia: {
    width: 60,
    height: 75,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  nombre: { color: COLORES.apagado, fontSize: 10, fontWeight: "bold" },
  numero: { fontSize: 20, fontWeight: "bold", marginVertical: 2 },
  mes: { fontSize: 9 },
});
