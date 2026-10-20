import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Insignia from "@/components/ui/Insignia";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { hoyColombiaISO, MESES_CORTOS } from "@/utils/fechas";
import { telefonoConBandera } from "@/utils/telefonos";
import { Cliente } from "../api";
import HistorialCitas from "./HistorialCitas";

// "2026-10-10" -> "10 oct 2026"
const fechaCorta = (fecha: string) => {
  const [y, m, d] = fecha.split("-").map(Number);
  return `${d} ${MESES_CORTOS[m - 1].toLowerCase()} ${y}`;
};

type Props = {
  token: string;
  cliente: Cliente;
  onAlternarBloqueo: (c: Cliente) => void;
};

export default function TarjetaCliente({ token, cliente: c, onAlternarBloqueo }: Props) {
  const { colors } = useAppTheme();
  const [abierto, setAbierto] = useState(false);
  const activo = c.estado === "activo";
  // fechaUltimaCita es la fecha más lejana reservada: puede ser una cita próxima
  const esProxima = c.fechaUltimaCita !== null && c.fechaUltimaCita > hoyColombiaISO();
  const secundario = { color: colors.textSecondary };

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.cabecera}>
        <Text style={[styles.nombre, { color: colors.textPrimary }]} numberOfLines={1}>
          {c.nombre}
        </Text>
        {c.enListaNegra ? <Insignia texto="Bloqueado" color={COLORES.peligroOscuro} /> : null}
        <Insignia
          texto={activo ? "Activo" : "Inactivo"}
          color={activo ? COLORES.exito : COLORES.inactivo}
        />
      </View>

      <Text style={[styles.linea, secundario]}>
        {telefonoConBandera(c.telefono, c.indicativo)}
      </Text>
      <Text style={[styles.linea, secundario]}>
        {c.fechaUltimaCita
          ? `${esProxima ? "Próxima cita" : "Última visita"}: ${fechaCorta(c.fechaUltimaCita)}`
          : "Sin visitas"}
        {" · "}
        {c.totalCitas} {c.totalCitas === 1 ? "cita" : "citas"}
      </Text>

      <View style={[styles.pie, { borderTopColor: colors.cardBorder }]}>
        <Tocable
          accessibilityRole="button"
          accessibilityLabel={abierto ? "Ocultar citas" : "Ver citas"}
          accessibilityHint={`Historial de citas de ${c.nombre}`}
          accessibilityState={{ expanded: abierto }}
          onPress={() => setAbierto(!abierto)}
          style={styles.verCitas}
        >
          <Text style={[styles.verCitasTexto, { color: colors.primaryText }]}>Ver citas</Text>
          <Ionicons
            name={abierto ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.primaryText}
          />
        </Tocable>
        <Tocable
          accessibilityRole="button"
          accessibilityLabel={c.enListaNegra ? `Desbloquear a ${c.nombre}` : `Bloquear a ${c.nombre}`}
          accessibilityHint={
            c.enListaNegra ? "Le permite volver a reservar" : "Ya no podrá reservar en tu negocio"
          }
          onPress={() => onAlternarBloqueo(c)}
          style={styles.bloqueo}
        >
          <Ionicons
            name={c.enListaNegra ? "lock-open-outline" : "ban-outline"}
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.bloqueoTexto, secundario]}>
            {c.enListaNegra ? "Desbloquear" : "Bloquear"}
          </Text>
        </Tocable>
      </View>

      {abierto ? <HistorialCitas token={token} clienteId={c.id} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 12, marginBottom: 10 },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 6 },
  nombre: { flex: 1, fontSize: 15, fontWeight: "bold" },
  linea: { fontSize: 13, marginTop: 4 },
  pie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  verCitas: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, flex: 1 },
  verCitasTexto: { fontSize: 13, fontWeight: "bold" },
  bloqueo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    minWidth: 44,
    paddingLeft: 8,
  },
  bloqueoTexto: { fontSize: 12 },
});
