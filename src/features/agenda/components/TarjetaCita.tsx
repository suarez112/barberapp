import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import Insignia from "@/components/ui/Insignia";
import { MINUTOS_ALERTA_COMPLETADA_TARDE } from "@/constants/config";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { Cita, EstadoCita } from "@/types";
import { fechaHoraCita, formatearHora } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import { abrirWhatsApp, numeroParaWhatsApp } from "@/utils/whatsapp";

export const ESTADO_CITA: Record<EstadoCita, { texto: string; color: string }> = {
  CONFIRMADA: { texto: "Pendiente", color: COLORES.advertenciaOscuro },
  COMPLETADA: { texto: "Completada", color: COLORES.exito },
  CANCELADA: { texto: "Cancelada", color: COLORES.cancelado },
};

// Minutos entre la hora de la cita y el momento en que se marcó completada
const minutosDeRetraso = (c: Cita) =>
  c.completadaEn
    ? (new Date(c.completadaEn).getTime() -
        fechaHoraCita(c.fecha, c.hora).getTime()) /
      60000
    : 0;

type Props = {
  cita: Cita;
  puedeCompletar: boolean;
  esAdmin: boolean;
  onCompletar: (c: Cita) => void;
  onCancelar: (c: Cita) => void;
};

export default function TarjetaCita({
  cita: c,
  puedeCompletar,
  esAdmin,
  onCompletar,
  onCancelar,
}: Props) {
  const { colors } = useAppTheme();
  const tieneWhatsApp = numeroParaWhatsApp(c.telefono, c.indicativo) !== null;
  const retraso = minutosDeRetraso(c);
  const estado = ESTADO_CITA[c.estado];
  // "03:30 PM" -> "03:30" grande y "PM" pequeño debajo
  const [hora, ampm] = c.hora.split(" ");
  const nota = [styles.nota, { color: colors.textSecondary }];

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.fila}>
        <View
          style={styles.columnaHora}
          accessible
          accessibilityLabel={`Hora ${c.hora}`}
        >
          <Text style={[styles.hora, { color: colors.primaryText }]}>{hora}</Text>
          {ampm ? (
            <Text style={[styles.ampm, { color: colors.textSecondary }]}>{ampm}</Text>
          ) : null}
        </View>

        <View style={styles.datos}>
          <View style={styles.filaTitulo}>
            <Text
              style={[styles.cliente, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {c.cliente}
            </Text>
            <Insignia texto={estado.texto} color={estado.color} />
          </View>
          <Text style={[styles.servicio, { color: colors.textSecondary }]} numberOfLines={1}>
            {c.servicio}
          </Text>
          <Text style={[styles.precio, { color: colors.textPrimary }]}>
            ${formatearPesos(c.precio)}
          </Text>
        </View>

        <Tocable
          onPress={() => abrirWhatsApp(c.telefono, c.indicativo)}
          accessibilityRole="button"
          accessibilityLabel={`Escribir por WhatsApp a ${c.cliente}`}
          accessibilityHint="Abre WhatsApp con el número del cliente"
          style={[styles.whatsapp, { opacity: tieneWhatsApp ? 1 : 0.35 }]}
        >
          <Ionicons
            name="logo-whatsapp"
            size={28}
            color={tieneWhatsApp ? COLORES.whatsapp : colors.textSecondary}
          />
        </Tocable>
      </View>

      {c.estado === "COMPLETADA" && c.completadaEn ? (
        <Text style={nota}>
          Completada por {c.completadaPor} a las {formatearHora(c.completadaEn)}
          {esAdmin && retraso > MINUTOS_ALERTA_COMPLETADA_TARDE ? (
            <Text style={styles.alerta}>
              {"  "}⚠️ {Math.round(retraso / 60)} h después
            </Text>
          ) : null}
        </Text>
      ) : null}

      {c.estado === "CANCELADA" && c.canceladaEn ? (
        <Text style={nota}>
          Cancelada por {c.canceladaPor} a las {formatearHora(c.canceladaEn)}
        </Text>
      ) : null}

      {c.estado === "CONFIRMADA" && (puedeCompletar || esAdmin) ? (
        <View style={styles.acciones}>
          {puedeCompletar ? (
            <BotonEstado
              texto="Marcar completada"
              color={COLORES.exito}
              onPress={() => onCompletar(c)}
            />
          ) : null}
          {esAdmin ? (
            <BotonEstado
              texto="Cancelar cita"
              color={COLORES.cancelado}
              onPress={() => onCancelar(c)}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function BotonEstado({
  texto,
  color,
  onPress,
}: {
  texto: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint="Cambia el estado de esta cita"
      style={[styles.botonEstado, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.botonEstadoTexto}>{texto}</Text>
    </Tocable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  columnaHora: { width: 64, alignItems: "center" },
  hora: { fontSize: 22, fontWeight: "bold" },
  ampm: { fontSize: 12, fontWeight: "bold" },
  datos: { flex: 1, gap: 2 },
  filaTitulo: { flexDirection: "row", alignItems: "center", gap: 8 },
  cliente: { flexShrink: 1, fontSize: 15, fontWeight: "bold" },
  servicio: { fontSize: 13 },
  precio: { fontSize: 13, fontWeight: "bold" },
  nota: { fontSize: 11, marginTop: 8 },
  alerta: { color: COLORES.advertencia, fontWeight: "bold" },
  acciones: { flexDirection: "row", gap: 10, marginTop: 10 },
  botonEstado: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  botonEstadoTexto: { color: COLORES.blanco, fontWeight: "bold", fontSize: 12 },
  whatsapp: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
