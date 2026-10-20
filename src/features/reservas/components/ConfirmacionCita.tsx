import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { agregarAlCalendario } from "@/utils/calendario";
import { horaAMinutos, minutosAHora } from "@/utils/disponibilidad";
import FotoBarbero from "@/components/FotoBarbero";
import type { Paleta } from "@/theme/paleta";

export type DatosConfirmacion = {
  negocio: string;
  profesional: string;
  foto?: string;
  servicio: string;
  duracionMin: number;
  precio: number;
  fecha: string; // "2026-10-15"
  hora: string; // "10:00 AM"
};

type Props = {
  visible: boolean;
  datos: DatosConfirmacion | null;
  colors: Paleta;
  onCerrar: () => void;
};

const DIAS_LARGOS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

// "2026-10-15" -> "Jueves 15 de octubre"
const fechaBonita = (fechaStr: string) => {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  const texto = `${DIAS_LARGOS[f.getDay()]} ${d} de ${MESES_LARGOS[m - 1]}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export default function ConfirmacionCita({
  visible,
  datos,
  colors,
  onCerrar,
}: Props) {
  if (!datos) return null;

  const horaFin = minutosAHora(horaAMinutos(datos.hora) + datos.duracionMin);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCerrar}
    >
      <View style={s.overlay}>
        <View
          style={[
            s.tarjeta,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          {/* Icono de check con aro */}
          <View style={[s.aro, { backgroundColor: `${colors.primary}33` }]}>
            <View style={[s.circulo, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={38} color="#000" />
            </View>
          </View>

          <Text style={[s.titulo, { color: colors.textPrimary }]}>
            ¡Cita confirmada!
          </Text>
          <Text style={[s.subtitulo, { color: colors.textSecondary }]}>
            Te esperamos en {datos.negocio}
          </Text>

          {/* Bloque principal: día y hora */}
          <View style={[s.bloqueHora, { borderColor: colors.primary }]}>
            <Text style={[s.fecha, { color: colors.textSecondary }]}>
              {fechaBonita(datos.fecha)}
            </Text>
            <Text style={[s.hora, { color: colors.primaryText }]}>
              {datos.hora}
            </Text>
            <Text style={[s.horaFin, { color: colors.textSecondary }]}>
              hasta las {horaFin} · {datos.duracionMin} min
            </Text>
          </View>

          {/* Detalles */}
          <View style={s.detalles}>
            <View style={s.filaDetalle}>
              <FotoBarbero
                nombre={datos.profesional}
                foto={datos.foto}
                color={colors.primaryText}
                size={40}
              />
              <View style={{ marginLeft: 12, flex: 1, marginTop: -8 }}>
                <Text style={[s.etiqueta, { color: colors.textSecondary }]}>
                  PROFESIONAL
                </Text>
                <Text style={[s.valor, { color: colors.textPrimary }]}>
                  {datos.profesional}
                </Text>
              </View>
            </View>

            <View style={[s.linea, { backgroundColor: colors.cardBorder }]} />

            <View style={s.filaDetalle}>
              <View
                style={[
                  s.iconoDetalle,
                  { backgroundColor: `${colors.primary}22` },
                ]}
              >
                <Ionicons name="cut-outline" size={20} color={colors.primaryText} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[s.etiqueta, { color: colors.textSecondary }]}>
                  SERVICIO
                </Text>
                <Text style={[s.valor, { color: colors.textPrimary }]}>
                  {datos.servicio}
                </Text>
              </View>
              <Text style={[s.precio, { color: colors.primaryText }]}>
                ${datos.precio.toLocaleString("es-CO")}
              </Text>
            </View>
          </View>

          <View style={s.nota}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[s.textoNota, { color: colors.textSecondary }]}>
              Llega unos minutos antes. Si necesitas cancelar o cambiar tu cita,
              comunícate con el establecimiento.
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Agregar a mi calendario"
            accessibilityHint="Abre tu calendario con la cita ya llena"
            style={[s.botonCalendario, { borderColor: colors.primary }]}
            onPress={() => agregarAlCalendario(datos)}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primaryText}
            />
            <Text style={[s.textoCalendario, { color: colors.primaryText }]}>
              AGREGAR A MI CALENDARIO
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Entendido"
            accessibilityHint="Cierra la confirmación de la cita"
            style={[s.boton, { backgroundColor: colors.primary }]}
            onPress={onCerrar}
          >
            <Text style={[s.textoBoton, { color: colors.onPrimary }]}>ENTENDIDO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  tarjeta: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  aro: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  circulo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 22, fontWeight: "bold" },
  subtitulo: { fontSize: 13, marginTop: 4, marginBottom: 18 },
  bloqueHora: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(128, 128, 128, 0.08)",
  },
  fecha: { fontSize: 13, fontWeight: "600" },
  hora: {
    fontSize: 34,
    fontWeight: "bold",
    letterSpacing: 1,
    marginVertical: 2,
  },
  horaFin: { fontSize: 12 },
  detalles: {
    width: "100%",
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(128, 128, 128, 0.08)",
  },
  filaDetalle: { flexDirection: "row", alignItems: "center" },
  iconoDetalle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  etiqueta: { fontSize: 10, fontWeight: "bold", letterSpacing: 1 },
  valor: { fontSize: 15, fontWeight: "bold", marginTop: 2 },
  precio: { fontSize: 15, fontWeight: "bold" },
  linea: { height: 1, marginVertical: 12 },
  nota: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
    alignItems: "flex-start",
  },
  textoNota: { flex: 1, fontSize: 11, lineHeight: 15 },
  botonCalendario: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  textoCalendario: { fontWeight: "bold", fontSize: 12, letterSpacing: 1 },
  boton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  textoBoton: {
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
});
