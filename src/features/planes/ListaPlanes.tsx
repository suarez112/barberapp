import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { PlanSuscripcion, Suscripcion } from "../cuenta/api";
import { obtenerPlanes, PlanEquipo } from "./api";
import { useFunciones } from "./funcionesContexto";

const PERIODOS: { valor: PlanSuscripcion; texto: string; nota?: string }[] = [
  { valor: "mensual", texto: "Mensual" },
  { valor: "anual", texto: "Anual", nota: "Ahorra 10 %" },
];

const GARANTIAS = ["15 días gratis", "Sin tarjeta para probar", "Cancela cuando quieras"];

const personas = (n: number) => (n === 1 ? "1 persona" : `${n} personas`);
const dinero = (n: number) => `$${formatearPesos(Math.round(n))}`;

// Los tres planes por tamaño de equipo con sus precios del backend.
// Elegir uno solo avisa que los pagos llegan pronto (no hay pagos reales).
export default function ListaPlanes({ suscripcion }: { suscripcion: Suscripcion | null }) {
  const { colors } = useAppTheme();
  const [periodo, setPeriodo] = useState<PlanSuscripcion>(suscripcion?.plan ?? "mensual");
  const [planes, setPlanes] = useState<PlanEquipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const { datos: funciones } = useFunciones();

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

  const enPrueba = suscripcion?.estado === "prueba";
  const elegir = (p: PlanEquipo) =>
    enPrueba
      ? avisar(
          "Tu prueba gratis ya está activa",
          `Disfruta tus 15 días. Cuando quieras activar el plan ${p.nombre} ${periodo}, los pagos estarán disponibles próximamente.`,
          "aviso",
        )
      : avisar(
          "Pagos disponibles próximamente",
          `Todavía no se puede pagar desde la app. Comunícate con nosotros para activar el plan ${p.nombre} ${periodo}.`,
          "aviso",
        );

  if (error) {
    return (
      <View>
        <TextoInfo>{error}</TextoInfo>
        <Boton titulo="REINTENTAR" ayuda="Vuelve a cargar los planes" variante="secundario" onPress={reintentar} />
      </View>
    );
  }
  if (!planes) return <ActivityIndicator color={colors.primaryText} style={styles.cargando} />;

  return (
    <View>
      <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
        Llena tu agenda, no tus huecos
      </Text>

      <View style={[styles.segmento, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        {PERIODOS.map((op) => {
          const activo = periodo === op.valor;
          return (
            <Pressable
              key={op.valor}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              accessibilityLabel={op.nota ? `${op.texto}, ${op.nota}` : op.texto}
              accessibilityHint="Muestra los precios de este periodo"
              style={[styles.btnSegmento, activo && { backgroundColor: colors.primary }]}
              onPress={() => setPeriodo(op.valor)}
            >
              <Text style={[styles.textoSegmento, { color: activo ? colors.onPrimary : colors.textSecondary }]}>
                {op.texto}
              </Text>
              {op.nota ? (
                <Text style={[styles.notaSegmento, { color: activo ? colors.onPrimary : colors.exitoTexto }]}>
                  {op.nota}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {planes.map((p, i) => {
        const precio = periodo === "mensual" ? p.precioMensual : p.precioAnual;
        const sufijo = periodo === "mensual" ? "al mes" : "al año";
        // Un plan más pequeño que el equipo activo no se puede elegir
        const noCabe = !!suscripcion && suscripcion.cupoUsado > p.cupo;
        const actual = esActual(p);
        const popular = p.id === "equipo";
        // 1 persona, 2 a 5, 6 a 10: empieza donde termina el plan anterior
        const desde = i === 0 ? 1 : planes[i - 1].cupo + 1;
        const rango = desde === p.cupo ? personas(p.cupo) : `${desde} a ${p.cupo} personas`;
        // Una sola persona: lo que cuesta cada día; un equipo: lo que cuesta cada persona
        const unidad =
          p.cupo === 1
            ? `≈ ${dinero(precio / (periodo === "mensual" ? 30 : 365))} al día`
            : `≈ ${dinero(precio / p.cupo)} por persona ${sufijo}`;
        const anterior = i > 0 ? planes[i - 1] : null;
        const nuevas = funciones?.funciones.filter((f) => f.planRequerido?.id === p.id) ?? [];
        return (
          <View
            key={p.id}
            style={[
              styles.plan,
              {
                backgroundColor: colors.cardBg,
                borderColor: actual || popular ? colors.primary : colors.cardBorder,
                borderWidth: popular ? 2 : 1,
              },
            ]}
          >
            {popular ? (
              <View style={[styles.popular, { backgroundColor: colors.primary }]}>
                <Text style={[styles.textoPopular, { color: colors.onPrimary }]}>⚡ Más popular</Text>
              </View>
            ) : null}
            <View style={styles.cabecera}>
              <Text style={[styles.nombre, { color: colors.textPrimary }]}>{p.nombre}</Text>
              {p.id === actualId ? (
                <Text style={[styles.etiqueta, { color: colors.primaryText }]}>
                  {enPrueba ? "TU PLAN EN LA PRUEBA" : "TU PLAN"}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.cupo, { color: colors.textSecondary }]}>{rango}</Text>
            <Text style={[styles.precio, { color: colors.primaryText }]}>
              {dinero(precio)} <Text style={[styles.periodo, { color: colors.textSecondary }]}>{sufijo}</Text>
            </Text>
            <Text style={[styles.unidad, { color: colors.textSecondary }]}>{unidad}</Text>

            {nuevas.length > 0 ? (
              <View style={styles.funciones}>
                <Text style={[styles.encabezadoFunciones, { color: colors.textPrimary }]}>
                  {anterior ? `Todo lo de ${anterior.nombre}, más…` : "Incluye:"}
                </Text>
                {nuevas.map((f) => (
                  <View key={f.id} style={styles.funcion}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORES.verde} />
                    <Text style={[styles.textoFuncion, { color: colors.textPrimary }]}>{f.nombre}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {noCabe ? (
              <Text style={[styles.periodo, { color: colors.textSecondary }]}>
                Tu equipo tiene {personas(suscripcion.cupoUsado)}: este plan es muy pequeño.
              </Text>
            ) : null}
            <Boton
              titulo={actual ? "ES TU PLAN ACTUAL" : enPrueba || !suscripcion ? "EMPEZAR GRATIS" : "CAMBIAR A ESTE PLAN"}
              ayuda={`Plan ${p.nombre}, ${rango}: ${formatearPesos(precio)} pesos ${sufijo}. Los pagos estarán disponibles próximamente`}
              onPress={() => elegir(p)}
              deshabilitado={actual || noCabe}
              style={styles.boton}
            />
          </View>
        );
      })}

      <View style={styles.garantias}>
        {GARANTIAS.map((g) => (
          <View key={g} style={styles.garantia}>
            <Ionicons name="checkmark" size={16} color={colors.exitoTexto} />
            <Text style={[styles.textoGarantia, { color: colors.textSecondary }]}>{g}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.muestra, { color: colors.textSecondary }]}>
        Precios en pesos colombianos. Pagos disponibles próximamente.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cargando: { marginVertical: 20 },
  titulo: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 10 },
  segmento: { flexDirection: "row", borderRadius: 8, borderWidth: 1, padding: 4, marginTop: 14 },
  btnSegmento: { flex: 1, minHeight: 48, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  textoSegmento: { fontSize: 13, fontWeight: "bold" },
  notaSegmento: { fontSize: 11, fontWeight: "bold" },
  plan: { borderRadius: 12, padding: 16, marginTop: 18 },
  popular: {
    position: "absolute",
    top: -13,
    alignSelf: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  textoPopular: { fontSize: 12, fontWeight: "bold" },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nombre: { fontSize: 18, fontWeight: "bold" },
  etiqueta: { fontSize: 11, fontWeight: "bold" },
  cupo: { fontSize: 13, marginTop: 2 },
  precio: { fontSize: 28, fontWeight: "bold", marginTop: 8 },
  periodo: { fontSize: 13, fontWeight: "normal" },
  unidad: { fontSize: 13, marginTop: 2 },
  funciones: { marginTop: 12 },
  encabezadoFunciones: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
  funcion: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 },
  textoFuncion: { flex: 1, fontSize: 13 },
  boton: { marginTop: 14 },
  garantias: { marginTop: 20, gap: 6, alignItems: "center" },
  garantia: { flexDirection: "row", alignItems: "center", gap: 6 },
  textoGarantia: { fontSize: 13 },
  muestra: { fontSize: 12, textAlign: "center", marginTop: 14 },
});
