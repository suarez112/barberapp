import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BotonIcono from "@/components/ui/BotonIcono";
import Boton from "@/components/ui/Boton";
import Insignia from "@/components/ui/Insignia";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { fechaLarga } from "@/utils/fechas";
import { EstadoSuscripcion, Suscripcion } from "../../cuenta/api";
import { ListaPlanes } from "./ElegirPlan";

const ESTADOS: Record<EstadoSuscripcion, { texto: string; color: string }> = {
  prueba: { texto: "PRUEBA GRATUITA", color: COLORES.info },
  activa: { texto: "ACTIVA", color: COLORES.exito },
  vencida: { texto: "VENCIDA", color: COLORES.cancelado },
};

const textoDias = (dias: number) => (dias === 1 ? "1 día" : `${dias} días`);

// Sección "Mi suscripción" de Mi negocio
export default function MiSuscripcion({ suscripcion }: { suscripcion: Suscripcion }) {
  const { colors } = useAppTheme();
  const [verPlanes, setVerPlanes] = useState(false);
  const { estado, plan, fechaPago, fechaFin, diasRestantes, diasPruebaSumados } = suscripcion;

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
        {estado === "prueba" ? (
          <Boton
            titulo="ACTIVAR PLAN AHORA"
            ayuda="Muestra los planes mensual y anual. Los días de prueba que te quedan se suman al plan"
            onPress={() => setVerPlanes(true)}
            style={styles.boton}
          />
        ) : null}
      </View>

      <Modal
        visible={verPlanes}
        animationType="slide"
        onRequestClose={() => setVerPlanes(false)}
      >
        <SafeAreaView style={[styles.pantalla, { backgroundColor: colors.bg }]}>
          <View style={styles.cabecera}>
            <Text style={[styles.tituloPlanes, { color: colors.primaryText }]}>PLANES</Text>
            <BotonIcono
              icono="close"
              tamano={26}
              color={colors.textPrimary}
              etiqueta="Cerrar planes"
              ayuda="Vuelve a Mi negocio"
              onPress={() => setVerPlanes(false)}
            />
          </View>
          <ScrollView contentContainerStyle={styles.contenido}>
            <Text style={[styles.nota, { color: colors.textSecondary }]}>
              Si activas un plan durante la prueba, los días gratis que te quedan se suman al plan.
            </Text>
            <ListaPlanes />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  pantalla: { flex: 1 },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tituloPlanes: { fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  contenido: { paddingHorizontal: 16, paddingBottom: 30 },
  nota: { fontSize: 13, textAlign: "center", marginTop: 4 },
});
