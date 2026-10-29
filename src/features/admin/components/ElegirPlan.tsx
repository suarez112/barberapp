import { StyleSheet, Text, View } from "react-native";
import PantallaAviso from "@/components/ui/PantallaAviso";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Suscripcion } from "../../cuenta/api";
import ListaPlanes from "../../planes/ListaPlanes";

// Pantalla del administrador cuando la prueba o el plan vencieron
export default function ElegirPlan({ suscripcion }: { suscripcion: Suscripcion }) {
  const { colors } = useAppTheme();
  // Sin plan anterior, lo que terminó fue la prueba gratuita
  const titulo = suscripcion.plan
    ? "Tu suscripción terminó, elige un plan"
    : "Tu prueba terminó, elige un plan";

  return (
    <View>
      <PantallaAviso icono="time-outline" titulo={titulo} mensaje={suscripcion.mensaje} />
      <Text style={[styles.nota, { color: colors.textSecondary }]}>
        Tus datos siguen guardados. Mientras tanto puedes revisar y editar Mi negocio.
      </Text>
      <ListaPlanes suscripcion={suscripcion} />
    </View>
  );
}

const styles = StyleSheet.create({
  nota: { fontSize: 13, textAlign: "center", marginTop: 8, marginBottom: 10 },
});
