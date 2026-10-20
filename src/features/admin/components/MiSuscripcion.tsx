import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Insignia from "@/components/ui/Insignia";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { fechaLarga } from "@/utils/fechas";
import { EstadoSuscripcion, Suscripcion } from "../../cuenta/api";
import PlanesModal from "../../planes/PlanesModal";

const ESTADOS: Record<EstadoSuscripcion, { texto: string; color: string }> = {
  prueba: { texto: "PRUEBA GRATUITA", color: COLORES.info },
  activa: { texto: "ACTIVA", color: COLORES.exito },
  vencida: { texto: "VENCIDA", color: COLORES.cancelado },
};

const textoDias = (dias: number) => (dias === 1 ? "1 día" : `${dias} días`);
const textoPersonas = (n: number) => (n === 1 ? "1 persona" : `${n} personas`);

// Sección "Mi suscripción" de Mi negocio
export default function MiSuscripcion({ suscripcion }: { suscripcion: Suscripcion }) {
  const { colors } = useAppTheme();
  const [verPlanes, setVerPlanes] = useState(false);
  const { estado, plan, fechaPago, fechaFin, diasRestantes, diasPruebaSumados } = suscripcion;
  const { planEquipo, cupoUsado } = suscripcion;

  // "Plan mensual · Activo"; la prueba y los vencidos llevan su insignia
  const titulo =
    estado === "activa" && plan
      ? `Plan ${plan} · Activo`
      : estado === "prueba"
        ? "Prueba gratuita de 15 días"
        : plan
          ? `Plan ${plan}`
          : null;

  const fila = (etiqueta: string, valor: string) => (
    <View
      accessible
      accessibilityLabel={`${etiqueta}: ${valor}`}
      style={[styles.fila, { borderBottomColor: colors.cardBorder }]}
    >
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
          {titulo ? (
            <Text style={[styles.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
          ) : (
            <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Estado</Text>
          )}
          <Insignia texto={ESTADOS[estado].texto} color={ESTADOS[estado].color} />
        </View>
        {fila("Plan", `${planEquipo.nombre} · hasta ${textoPersonas(planEquipo.cupo)}`)}
        {fila("Cupo usado", `${cupoUsado} de ${textoPersonas(planEquipo.cupo)}`)}
        {estado !== "prueba" ? fila("Fecha de pago", fechaPago ? fechaLarga(fechaPago) : "—") : null}
        {fila(
          estado === "prueba" ? "La prueba termina" : "Fecha de vencimiento",
          fechaFin ? fechaLarga(fechaFin) : "Sin fecha de vencimiento",
        )}
        {fila("Días restantes", diasRestantes === null ? "—" : textoDias(diasRestantes))}
        {estado === "activa" && diasPruebaSumados ? (
          <Text style={[styles.mensaje, { color: colors.textPrimary }]}>
            Incluye {textoDias(diasPruebaSumados)} de prueba que te quedaban.
          </Text>
        ) : null}
        {suscripcion.mensaje ? (
          <Text style={[styles.mensaje, { color: colors.textSecondary }]}>
            {suscripcion.mensaje}
          </Text>
        ) : null}
        <Boton
          titulo={estado === "prueba" ? "ACTIVAR PLAN AHORA" : "CAMBIAR DE PLAN"}
          ayuda={
            estado === "prueba"
              ? "Muestra los planes Básico, Equipo y Pro. Los días de prueba que te quedan se suman al plan"
              : "Muestra los planes Básico, Equipo y Pro con sus precios"
          }
          onPress={() => setVerPlanes(true)}
          style={styles.boton}
        />
      </View>

      <PlanesModal
        visible={verPlanes}
        onCerrar={() => setVerPlanes(false)}
        suscripcion={suscripcion}
        nota={
          estado === "prueba"
            ? "Si activas un plan durante la prueba, los días gratis que te quedan se suman al plan."
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4 },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titulo: { fontSize: 15, fontWeight: "bold", flexShrink: 1, marginRight: 10 },
  etiqueta: { fontSize: 13 },
  valor: { fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 10 },
  mensaje: { fontSize: 12, lineHeight: 17, paddingTop: 10 },
  boton: { marginTop: 12, marginBottom: 10 },
});
