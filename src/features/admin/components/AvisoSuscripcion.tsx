import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { CONTACTO } from "@/config/app";
import { PAGOS_EN_APP } from "@/config/pagos";
import { useAppTheme } from "@/theme/ThemeProvider";
import { fechaLarga } from "@/utils/fechas";
import { Suscripcion } from "../../cuenta/api";
import { useFunciones } from "../../planes/funcionesContexto";
import { useIrAMiPlan } from "../../planes/miPlanContexto";

// Días que le quedan a la prueba o al plan. El backend decide cuándo mostrarlo:
// siempre en la prueba y en los últimos 7 días de un plan. En la web lleva a "Plan y pagos"
// (o a la ventana de planes); en el celular solo informa: ahí no se habla de pagos.
export default function AvisoSuscripcion({ suscripcion }: { suscripcion: Suscripcion }) {
  const { colors } = useAppTheme();
  const irAMiPlan = useIrAMiPlan();
  const { abrirPlanes } = useFunciones();
  const { estado, plan, diasRestantes: dias, fechaFin, mostrarRecordatorio } = suscripcion;
  if (!mostrarRecordatorio || estado === "vencida" || dias === null) return null;

  const urgente = dias <= 3;
  const quedan = dias === 1 ? "Te queda 1 día" : `Te quedan ${dias} días`;
  const titulo =
    estado === "prueba"
      ? `${quedan} de prueba gratuita`
      : `${quedan} de tu plan${plan ? ` ${plan}` : ""}`;
  const termina = estado === "prueba" ? "La prueba termina" : "El plan termina";

  return (
    <View
      style={[
        styles.aviso,
        {
          backgroundColor: colors.cardBg,
          borderColor: urgente ? colors.avisoTexto : colors.primary,
        },
      ]}
    >
      <View accessibilityRole="summary" style={styles.fila}>
        <Ionicons
          name="hourglass-outline"
          size={26}
          color={urgente ? colors.avisoTexto : colors.primaryText}
        />
        <View style={styles.textos}>
          <Text style={[styles.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
          {fechaFin ? (
            <Text style={[styles.detalle, { color: colors.textSecondary }]}>
              {termina} el {fechaLarga(fechaFin)}.{" "}
              {!PAGOS_EN_APP
                ? `¿Dudas? Escríbenos${CONTACTO.correo ? ` a ${CONTACTO.correo}` : ""}.`
                : estado === "prueba"
                  ? "Activa un plan para no perder el acceso."
                  : "Renuévalo para no perder el acceso."}
            </Text>
          ) : null}
        </View>
      </View>
      {PAGOS_EN_APP ? (
        <Boton
          titulo={irAMiPlan ? "VER PLAN Y PAGOS" : "VER PLANES"}
          ayuda={irAMiPlan ? "Abre Plan y pagos para activar o renovar tu plan" : "Abre los planes para activar o renovar"}
          variante={urgente ? "primario" : "secundario"}
          onPress={abrirPlanes}
          style={styles.boton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 15,
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 12 },
  textos: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: "bold" },
  detalle: { fontSize: 12, marginTop: 3 },
  boton: { marginTop: 12 },
});
