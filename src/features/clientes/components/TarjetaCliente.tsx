import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Insignia from "@/components/ui/Insignia";
import TelefonoConBandera from "@/components/ui/TelefonoConBandera";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { hoyColombiaISO, MESES_CORTOS } from "@/utils/fechas";
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
  // Bloquear en rojo, Desbloquear en verde (borde, ícono y texto), en los dos temas
  const colorBloqueo = c.enListaNegra ? colors.exitoTexto : colors.peligroTexto;

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
        {c.enListaNegra ? <Insignia texto="Bloqueado" color={COLORES.rojo} /> : null}
        <Insignia
          texto={activo ? "Activo" : "Inactivo"}
          color={activo ? COLORES.verde : COLORES.neutro}
        />
      </View>

      <View style={styles.lineaTelefono}>
        <TelefonoConBandera telefono={c.telefono} indicativo={c.indicativo} style={[styles.linea, secundario]} />
      </View>
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
          style={styles.zonaBloqueo}
        >
          {/* La zona táctil mide 44 px de alto; el botón que se ve es más compacto */}
          <View style={[styles.bloqueo, { borderColor: colorBloqueo }]}>
            <Ionicons
              name={c.enListaNegra ? "lock-open-outline" : "ban-outline"}
              size={12}
              color={colorBloqueo}
            />
            <Text style={[styles.bloqueoTexto, { color: colorBloqueo }]}>
              {c.enListaNegra ? "Desbloquear" : "Bloquear"}
            </Text>
          </View>
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
  lineaTelefono: { marginTop: 4 },
  pie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
  },
  verCitas: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, flex: 1 },
  verCitasTexto: { fontSize: 13, fontWeight: "bold", textDecorationLine: "underline" },
  zonaBloqueo: { minHeight: 44, minWidth: 44, justifyContent: "center" },
  bloqueo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: "center",
  },
  bloqueoTexto: { fontSize: 11, fontWeight: "bold" },
});
