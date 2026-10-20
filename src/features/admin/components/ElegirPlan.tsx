import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import PantallaAviso from "@/components/ui/PantallaAviso";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { PlanSuscripcion, Suscripcion } from "../../cuenta/api";

type Plan = { id: PlanSuscripcion; nombre: string; precio: number; periodo: string; nota?: string };

// Precios de muestra: todavía no hay pagos reales en la app
const PLANES: Plan[] = [
  { id: "mensual", nombre: "Plan mensual", precio: 49900, periodo: "al mes" },
  {
    id: "anual",
    nombre: "Plan anual",
    precio: 499000,
    periodo: "al año",
    nota: "Equivale a 10 meses: 2 meses gratis",
  },
];

// Tarjetas de los planes; elegir uno solo avisa que los pagos llegan pronto
export function ListaPlanes() {
  const { colors } = useAppTheme();

  const elegir = (nombre: string) =>
    avisar(
      "Pagos disponibles próximamente",
      `Todavía no se puede pagar desde la app. Comunícate con nosotros para activar el ${nombre.toLowerCase()}.`,
      "aviso",
    );

  return (
    <View>
      {PLANES.map((p) => (
        <View
          key={p.id}
          accessible={false}
          style={[styles.plan, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}
        >
          <Text style={[styles.nombre, { color: colors.textPrimary }]}>{p.nombre}</Text>
          <Text style={[styles.precio, { color: colors.primaryText }]}>
            ${formatearPesos(p.precio)}{" "}
            <Text style={[styles.periodo, { color: colors.textSecondary }]}>{p.periodo}</Text>
          </Text>
          {p.nota ? (
            <Text style={[styles.periodo, { color: colors.textSecondary }]}>{p.nota}</Text>
          ) : null}
          <Boton
            titulo={`ELEGIR ${p.nombre.toUpperCase()}`}
            ayuda={`${p.nombre}: ${formatearPesos(p.precio)} pesos ${p.periodo}. Los pagos estarán disponibles próximamente`}
            onPress={() => elegir(p.nombre)}
            style={styles.boton}
          />
        </View>
      ))}

      <Text style={[styles.muestra, { color: colors.textSecondary }]}>
        Precios de muestra. Pagos disponibles próximamente.
      </Text>
    </View>
  );
}

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
      <ListaPlanes />
    </View>
  );
}

const styles = StyleSheet.create({
  nota: { fontSize: 13, textAlign: "center", marginTop: 8, marginBottom: 10 },
  plan: { borderWidth: 1, borderRadius: 10, padding: 16, marginTop: 12 },
  nombre: { fontSize: 16, fontWeight: "bold" },
  precio: { fontSize: 24, fontWeight: "bold", marginTop: 6 },
  periodo: { fontSize: 13, fontWeight: "normal" },
  boton: { marginTop: 12 },
  muestra: { fontSize: 12, textAlign: "center", marginTop: 14 },
});
