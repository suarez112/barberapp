import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { PlanSuscripcion, Suscripcion } from "../cuenta/api";
import { obtenerPlanes, PlanEquipo } from "./api";

const PERIODOS: { valor: PlanSuscripcion; texto: string }[] = [
  { valor: "mensual", texto: "Mensual" },
  { valor: "anual", texto: "Anual" },
];

const personas = (n: number) => (n === 1 ? "1 persona" : `${n} personas`);

// Los tres planes por tamaño de equipo con sus precios del backend.
// Elegir uno solo avisa que los pagos llegan pronto (no hay pagos reales).
export default function ListaPlanes({ suscripcion }: { suscripcion: Suscripcion | null }) {
  const { colors } = useAppTheme();
  const [periodo, setPeriodo] = useState<PlanSuscripcion>(suscripcion?.plan ?? "mensual");
  const [planes, setPlanes] = useState<PlanEquipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerPlanes(controlador.signal)
      .then(setPlanes)
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Planes", e);
        setError(describirError(e, { titulo: "", porDefecto: "No se pudieron cargar los planes." }).mensaje);
      });
    return () => controlador.abort();
  }, [intento]);

  const reintentar = () => {
    setError(null);
    setIntento((n) => n + 1);
  };

  // El plan actual solo cuenta como "actual" fuera de la prueba y con el mismo periodo
  const actualId = suscripcion?.planEquipo.id ?? null;
  const esActual = (p: PlanEquipo) =>
    p.id === actualId && suscripcion?.estado === "activa" && suscripcion.plan === periodo;

  const elegir = (p: PlanEquipo) =>
    avisar(
      "Pagos disponibles próximamente",
      `Todavía no se puede pagar desde la app. Comunícate con nosotros para activar el plan ${p.nombre} ${periodo}.`,
      "aviso",
    );

  if (error) {
    return (
      <View>
        <TextoInfo>{error}</TextoInfo>
        <Boton titulo="REINTENTAR" ayuda="Vuelve a cargar los planes" variante="neutro" onPress={reintentar} />
      </View>
    );
  }
  if (!planes) return <ActivityIndicator color={colors.primaryText} style={styles.cargando} />;

  return (
    <View>
      <View style={[styles.segmento, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        {PERIODOS.map((op) => {
          const activo = periodo === op.valor;
          return (
            <Pressable
              key={op.valor}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={op.texto}
              accessibilityHint="Muestra los precios de este periodo"
              style={[styles.btnSegmento, activo && { backgroundColor: colors.primary }]}
              onPress={() => setPeriodo(op.valor)}
            >
              <Text style={[styles.textoSegmento, { color: activo ? colors.onPrimary : colors.textSecondary }]}>
                {op.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {planes.map((p) => {
        const precio = periodo === "mensual" ? p.precioMensual : p.precioAnual;
        const sufijo = periodo === "mensual" ? "al mes" : "al año";
        // Un plan más pequeño que el equipo activo no se puede elegir
        const noCabe = !!suscripcion && suscripcion.cupoUsado > p.cupo;
        const actual = esActual(p);
        return (
          <View
            key={p.id}
            style={[
              styles.plan,
              { backgroundColor: colors.cardBg, borderColor: actual ? colors.primary : colors.cardBorder },
            ]}
          >
            <View style={styles.cabecera}>
              <Text style={[styles.nombre, { color: colors.textPrimary }]}>{p.nombre}</Text>
              {p.id === actualId ? (
                <Text style={[styles.etiqueta, { color: colors.primaryText }]}>
                  {suscripcion?.estado === "prueba" ? "TU PLAN EN LA PRUEBA" : "TU PLAN"}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.cupo, { color: colors.textSecondary }]}>
              Hasta {personas(p.cupo)} en tu equipo
            </Text>
            <Text style={[styles.precio, { color: colors.primaryText }]}>
              ${formatearPesos(precio)}{" "}
              <Text style={[styles.periodo, { color: colors.textSecondary }]}>{sufijo}</Text>
            </Text>
            {noCabe ? (
              <Text style={[styles.periodo, { color: colors.textSecondary }]}>
                Tu equipo tiene {personas(suscripcion.cupoUsado)}: este plan es muy pequeño.
              </Text>
            ) : null}
            <Boton
              titulo={actual ? "ES TU PLAN ACTUAL" : "PAGOS DISPONIBLES PRÓXIMAMENTE"}
              ayuda={`Plan ${p.nombre}, hasta ${personas(p.cupo)}: ${formatearPesos(precio)} pesos ${sufijo}. Los pagos estarán disponibles próximamente`}
              onPress={() => elegir(p)}
              deshabilitado={actual || noCabe}
              style={styles.boton}
            />
          </View>
        );
      })}

      <Text style={[styles.muestra, { color: colors.textSecondary }]}>
        Precios en pesos colombianos. Pagos disponibles próximamente.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cargando: { marginVertical: 20 },
  segmento: { flexDirection: "row", borderRadius: 8, borderWidth: 1, padding: 4, marginTop: 12 },
  btnSegmento: { flex: 1, minHeight: 44, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  textoSegmento: { fontSize: 13, fontWeight: "bold" },
  plan: { borderWidth: 1, borderRadius: 10, padding: 16, marginTop: 12 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nombre: { fontSize: 16, fontWeight: "bold" },
  etiqueta: { fontSize: 11, fontWeight: "bold" },
  cupo: { fontSize: 13, marginTop: 2 },
  precio: { fontSize: 24, fontWeight: "bold", marginTop: 6 },
  periodo: { fontSize: 13, fontWeight: "normal" },
  boton: { marginTop: 12 },
  muestra: { fontSize: 12, textAlign: "center", marginTop: 14 },
});
