import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { estilosTexto } from "@/components/ui/estilosTexto";
import Insignia from "@/components/ui/Insignia";
import { MINUTOS_ALERTA_COMPLETADA_TARDE } from "@/constants/config";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { Cita, EstadoCita } from "@/types";
import { fechaHoraCita, formatearHora } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import { abrirWhatsApp, numeroParaWhatsApp } from "@/utils/whatsapp";

const COLOR_ESTADO: Record<EstadoCita, string> = {
  CONFIRMADA: COLORES.exito,
  COMPLETADA: COLORES.info,
  CANCELADA: COLORES.cancelado,
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
  const subtitulo = [estilosTexto.subtitulo, { color: colors.textSecondary }];

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.filaEntre}>
        <Text style={[styles.hora, { color: colors.primary }]}>⏰ {c.hora}</Text>
        <Insignia texto={c.estado} color={COLOR_ESTADO[c.estado]} />
      </View>
      <Text
        style={[estilosTexto.titulo, styles.cliente, { color: colors.textPrimary }]}
      >
        {c.cliente}
      </Text>
      <View style={styles.filaEntre}>
        <Text style={subtitulo}>
          📞 {c.indicativo ? `+${c.indicativo} ` : ""}
          {c.telefono}
        </Text>
        <Tocable
          onPress={() => abrirWhatsApp(c.telefono, c.indicativo)}
          accessibilityRole="button"
          accessibilityLabel={`Escribir por WhatsApp a ${c.cliente}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ opacity: tieneWhatsApp ? 1 : 0.35 }}
        >
          <Ionicons
            name="logo-whatsapp"
            size={26}
            color={tieneWhatsApp ? COLORES.whatsapp : colors.textSecondary}
          />
        </Tocable>
      </View>
      <Text style={subtitulo}>
        ✂️ {c.servicio} (${formatearPesos(c.precio)})
      </Text>

      {c.estado === "CONFIRMADA" ? (
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

      {c.estado === "COMPLETADA" && c.completadaEn ? (
        <View style={styles.detalle}>
          <Text style={subtitulo}>
            ✅ Completada por {c.completadaPor} a las{" "}
            {formatearHora(c.completadaEn)}
          </Text>
          {esAdmin && retraso > MINUTOS_ALERTA_COMPLETADA_TARDE ? (
            <Text style={styles.alerta}>
              ⚠️ Registrada {Math.round(retraso / 60)} h después de la cita
            </Text>
          ) : null}
        </View>
      ) : null}

      {c.estado === "CANCELADA" && c.canceladaEn ? (
        <Text style={[subtitulo, styles.detalle]}>
          ❌ Cancelada por {c.canceladaPor} a las {formatearHora(c.canceladaEn)}
        </Text>
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
      style={[styles.botonEstado, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.botonEstadoTexto}>{texto}</Text>
    </Tocable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { padding: 14, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  filaEntre: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hora: { fontSize: 13, fontWeight: "bold" },
  cliente: { marginTop: 6 },
  acciones: { flexDirection: "row", gap: 10, marginTop: 10 },
  detalle: { marginTop: 8 },
  alerta: {
    fontSize: 11,
    color: COLORES.advertencia,
    fontWeight: "bold",
    marginTop: 4,
  },
  botonEstado: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  botonEstadoTexto: { color: COLORES.blanco, fontWeight: "bold", fontSize: 12 },
});
