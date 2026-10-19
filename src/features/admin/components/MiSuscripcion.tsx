import { StyleSheet, Text, View } from "react-native";
import Insignia from "@/components/ui/Insignia";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { fechaLarga } from "@/utils/fechas";
import { EstadoSuscripcion, Suscripcion } from "../../cuenta/api";

const ESTADOS: Record<EstadoSuscripcion, { texto: string; color: string }> = {
  prueba: { texto: "PRUEBA GRATUITA", color: COLORES.info },
  activa: { texto: "ACTIVA", color: COLORES.exito },
  vencida: { texto: "VENCIDA", color: COLORES.cancelado },
};

// Sección "Mi suscripción" de Mi negocio
export default function MiSuscripcion({ suscripcion }: { suscripcion: Suscripcion }) {
  const { colors } = useAppTheme();
  const { estado, plan, fechaPago, fechaFin, diasRestantes } = suscripcion;

  const textoPlan = plan
    ? plan === "anual" ? "Anual" : "Mensual"
    : estado === "prueba" ? "Prueba gratuita de 15 días" : "—";
  const textoDias =
    diasRestantes === null ? "—" : diasRestantes === 1 ? "1 día" : `${diasRestantes} días`;

  const fila = (etiqueta: string, valor: string) => (
    <View style={[styles.fila, { borderBottomColor: colors.cardBorder }]}>
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{etiqueta}</Text>
      <Text style={[styles.valor, { color: colors.textPrimary }]}>{valor}</Text>
    </View>
  );

  return (
    <View>
      <TituloSeccion>MI SUSCRIPCIÓN</TituloSeccion>
      <View
        style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      >
        <View style={[styles.fila, { borderBottomColor: colors.cardBorder }]}>
          <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Estado</Text>
          <Insignia texto={ESTADOS[estado].texto} color={ESTADOS[estado].color} />
        </View>
        {fila("Plan", textoPlan)}
        {fila("Fecha de pago", fechaPago ? fechaLarga(fechaPago) : "—")}
        {fila("Fecha de fin", fechaFin ? fechaLarga(fechaFin) : "Sin fecha de fin")}
        {fila("Días restantes", textoDias)}
        {suscripcion.mensaje ? (
          <Text style={[styles.mensaje, { color: colors.textSecondary }]}>
            {suscripcion.mensaje}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4 },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  etiqueta: { fontSize: 13 },
  valor: { fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 10 },
  mensaje: { fontSize: 12, lineHeight: 17, paddingVertical: 10 },
});
