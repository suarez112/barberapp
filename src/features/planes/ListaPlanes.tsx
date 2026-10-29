import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { PlanSuscripcion, Suscripcion } from "../cuenta/api";
import { nivelPara, precioPara } from "./cobro";
import { useFunciones } from "./funcionesContexto";
import { usePlanes } from "./usePlanes";

const PERIODOS: { valor: PlanSuscripcion; texto: string; nota?: string }[] = [
  { valor: "mensual", texto: "Mensual" },
  { valor: "anual", texto: "Anual", nota: "Ahorra 10 %" },
];

const GARANTIAS = ["15 días gratis", "Sin tarjeta para probar", "Cancela cuando quieras"];

const profesionales = (n: number) => (n === 1 ? "1 profesional" : `${n} profesionales`);
const dinero = (n: number) => `$${formatearPesos(Math.round(n))}`;

// Calculadora: el negocio elige cuántos profesionales atienden y ve al instante el precio,
// el nivel y lo que incluye. Elegir el plan solo avisa que los pagos llegan pronto.
export default function ListaPlanes({ suscripcion }: { suscripcion: Suscripcion | null }) {
  const { colors } = useAppTheme();
  const { planes, error, reintentar } = usePlanes();
  const { datos: funciones } = useFunciones();
  const [periodo, setPeriodo] = useState<PlanSuscripcion>(suscripcion?.plan ?? "mensual");
  // Empieza en los profesionales que ya tiene el negocio (mínimo 1)
  const [cantidad, setCantidad] = useState(Math.max(1, suscripcion?.profesionalesCobrados ?? 1));

  const enPrueba = suscripcion?.estado === "prueba";

  if (error) {
    return (
      <View>
        <TextoInfo>{error}</TextoInfo>
        <Boton titulo="REINTENTAR" ayuda="Vuelve a cargar los planes" variante="secundario" onPress={reintentar} />
      </View>
    );
  }
  if (!planes) return <ActivityIndicator color={colors.primaryText} style={styles.cargando} />;

  const maximo = planes.maximoProfesionales;
  const n = Math.min(Math.max(cantidad, 1), maximo);
  const nivel = nivelPara(planes, n);
  const anterior = planes.niveles[planes.niveles.findIndex((x) => x.id === nivel.id) - 1];
  const precio = precioPara(planes, n)[periodo];
  const sufijo = periodo === "mensual" ? "al mes" : "al año";
  const nuevas = funciones?.funciones.filter((f) => f.planRequerido?.id === nivel.id) ?? [];
  const esActual =
    suscripcion?.estado === "activa" && suscripcion.plan === periodo && suscripcion.profesionalesCobrados === n;
  // Un negocio no puede elegir menos profesionales de los que ya atienden
  const pocos = !!suscripcion && n < suscripcion.profesionalesCobrados;

  const elegir = () =>
    enPrueba
      ? avisar(
          "Tu prueba gratis ya está activa",
          `Disfruta tus 15 días. Cuando quieras activar el plan para ${profesionales(n)} (${periodo}), los pagos estarán disponibles próximamente.`,
          "aviso",
        )
      : avisar(
          "Pagos disponibles próximamente",
          `Todavía no se puede pagar desde la app. Comunícate con nosotros para activar el plan para ${profesionales(n)} (${periodo}).`,
          "aviso",
        );

  const paso = (cambio: number) => {
    const deshabilitado = cambio < 0 ? n <= 1 : n >= maximo;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cambio < 0 ? "Quitar un profesional" : "Agregar un profesional"}
        accessibilityHint={cambio < 0 ? "Baja la cantidad de profesionales" : "Sube la cantidad de profesionales"}
        accessibilityState={{ disabled: deshabilitado }}
        disabled={deshabilitado}
        hitSlop={6}
        onPress={() => setCantidad(n + cambio)}
        style={[styles.paso, { backgroundColor: colors.primary, opacity: deshabilitado ? 0.35 : 1 }]}
      >
        <Ionicons name={cambio < 0 ? "remove" : "add"} size={26} color={colors.onPrimary} />
      </Pressable>
    );
  };

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

      <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.primary }]}>
        <Text style={[styles.pregunta, { color: colors.textSecondary }]}>
          ¿Cuántos profesionales atienden clientes?
        </Text>
        <View style={styles.selector}>
          {paso(-1)}
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={profesionales(n)}
            accessibilityValue={{ min: 1, max: maximo, now: n }}
            style={styles.cantidad}
          >
            <Text style={[styles.numero, { color: colors.textPrimary }]}>{n}</Text>
            <Text style={[styles.unidadCantidad, { color: colors.textSecondary }]}>
              {n === 1 ? "profesional" : "profesionales"}
            </Text>
          </View>
          {paso(1)}
        </View>

        <View style={styles.cabecera}>
          <Text style={[styles.nombre, { color: colors.textPrimary }]}>Nivel {nivel.nombre}</Text>
          {suscripcion?.planEquipo.id === nivel.id ? (
            <Text style={[styles.etiqueta, { color: colors.primaryText }]}>
              {enPrueba ? "TU NIVEL EN LA PRUEBA" : "TU NIVEL"}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.precio, { color: colors.primaryText }]}>
          {dinero(precio)} <Text style={[styles.periodo, { color: colors.textSecondary }]}>{sufijo}</Text>
        </Text>
        <Text style={[styles.unidad, { color: colors.textSecondary }]}>
          {dinero(planes.precioPrimerProfesional)} el primer profesional y {dinero(planes.precioProfesionalAdicional)}{" "}
          cada adicional
          {periodo === "anual" ? `, con ${Math.round(planes.descuentoAnual * 100)} % menos pagando el año` : ""}.
        </Text>

        <View style={styles.funciones}>
          <Text style={[styles.encabezadoFunciones, { color: colors.textPrimary }]}>
            {anterior ? `Todo lo de ${anterior.nombre}, más…` : "Incluye:"}
          </Text>
          {nuevas.length === 0 ? (
            <Text style={[styles.textoFuncion, { color: colors.textSecondary }]}>
              {funciones ? "Las funciones de este nivel." : "Cargando las funciones del nivel…"}
            </Text>
          ) : (
            nuevas.map((f) => (
              <View key={f.id} style={styles.funcion}>
                <Ionicons name="checkmark-circle" size={18} color={COLORES.verde} />
                <Text style={[styles.textoFuncion, { color: colors.textPrimary }]}>{f.nombre}</Text>
              </View>
            ))
          )}
        </View>

        {pocos ? (
          <Text style={[styles.periodo, { color: colors.textSecondary }]}>
            Hoy atienden {profesionales(suscripcion.profesionalesCobrados)}: elige al menos esa cantidad.
          </Text>
        ) : null}
        <Boton
          titulo={esActual ? "ES TU PLAN ACTUAL" : enPrueba || !suscripcion ? "EMPEZAR GRATIS" : "ELEGIR ESTE PLAN"}
          ayuda={`Plan para ${profesionales(n)}, nivel ${nivel.nombre}: ${formatearPesos(precio)} pesos ${sufijo}. Los pagos estarán disponibles próximamente`}
          onPress={elegir}
          deshabilitado={esActual || pocos}
          style={styles.boton}
        />
      </View>

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
  tarjeta: { borderRadius: 12, borderWidth: 2, padding: 16, marginTop: 18 },
  pregunta: { fontSize: 13, textAlign: "center" },
  selector: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginVertical: 12 },
  paso: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  cantidad: { minWidth: 110, alignItems: "center" },
  numero: { fontSize: 44, fontWeight: "bold" },
  unidadCantidad: { fontSize: 13 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  nombre: { fontSize: 18, fontWeight: "bold" },
  etiqueta: { fontSize: 11, fontWeight: "bold" },
  precio: { fontSize: 30, fontWeight: "bold", marginTop: 6 },
  periodo: { fontSize: 13, fontWeight: "normal" },
  unidad: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  funciones: { marginTop: 14 },
  encabezadoFunciones: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
  funcion: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 },
  textoFuncion: { flex: 1, fontSize: 13 },
  boton: { marginTop: 14 },
  garantias: { marginTop: 20, gap: 6, alignItems: "center" },
  garantia: { flexDirection: "row", alignItems: "center", gap: 6 },
  textoGarantia: { fontSize: 13 },
  muestra: { fontSize: 12, textAlign: "center", marginTop: 14 },
});
