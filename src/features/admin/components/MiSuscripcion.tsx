import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Insignia from "@/components/ui/Insignia";
import SeccionPlegable from "@/components/ui/SeccionPlegable";
import { PAGOS_EN_APP } from "@/config/pagos";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { fechaLarga } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import { EstadoSuscripcion, Suscripcion } from "../../cuenta/api";
import { useFunciones } from "../../planes/funcionesContexto";
import PlanesModal from "../../planes/PlanesModal";

const ESTADOS: Record<EstadoSuscripcion, { texto: string; color: string }> = {
  prueba: { texto: "PRUEBA GRATUITA", color: COLORES.azul },
  activa: { texto: "ACTIVA", color: COLORES.verde },
  vencida: { texto: "VENCIDA", color: COLORES.rojo },
};

const textoDias = (dias: number) => (dias === 1 ? "1 día" : `${dias} días`);
const textoProfesionales = (n: number) => (n === 1 ? "1 profesional" : `${n} profesionales`);
const dinero = (n: number) => `$${formatearPesos(Math.round(n))}`;

// Sección "Mi suscripción" de Mi negocio
export default function MiSuscripcion({ suscripcion }: { suscripcion: Suscripcion }) {
  const { colors } = useAppTheme();
  const [verPlanes, setVerPlanes] = useState(false);
  const { estado, plan, fechaPago, fechaFin, diasRestantes, diasPruebaSumados } = suscripcion;
  const { planEquipo, profesionalesCobrados, precioPeriodo, cargosPendientes } = suscripcion;
  const { datos: funciones } = useFunciones();
  // En la prueba el backend no da precio del periodo: se usa el de hoy según los profesionales
  const precioHoy =
    precioPeriodo ?? (plan === "anual" ? funciones?.precio?.anual : funciones?.precio?.mensual) ?? null;
  const sufijoPrecio = plan === "anual" ? "al año" : "al mes";
  const incluidas = funciones?.funciones.filter((f) => f.incluida) ?? [];
  const bloqueadas = funciones?.funciones.filter((f) => !f.incluida) ?? [];

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

  // En el celular no se habla de planes ni de dinero: solo el estado y los días
  const tituloMovil = estado === "prueba" ? "Prueba gratuita" : estado === "activa" ? "Suscripción activa" : "Suscripción vencida";
  const resumenFunciones = funciones
    ? `Nivel ${planEquipo.nombre} · ${incluidas.length} ${incluidas.length === 1 ? "función" : "funciones"}`
    : undefined;

  return (
    <>
      <SeccionPlegable titulo="Suscripción" icono="card-outline">
        <View
          style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <View style={[styles.fila, { borderBottomColor: colors.cardBorder }]}>
            {PAGOS_EN_APP && titulo ? (
              <Text style={[styles.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
            ) : !PAGOS_EN_APP ? (
              <Text style={[styles.titulo, { color: colors.textPrimary }]}>{tituloMovil}</Text>
            ) : (
              <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Estado</Text>
            )}
            <Insignia texto={ESTADOS[estado].texto} color={ESTADOS[estado].color} />
          </View>
          {fila("Nivel", planEquipo.nombre)}
          {PAGOS_EN_APP ? fila("Profesionales cobrados", textoProfesionales(profesionalesCobrados)) : null}
          {PAGOS_EN_APP
            ? fila(
                estado === "prueba" ? "Precio al activar" : "Precio actual",
                precioHoy === null ? "—" : `${dinero(precioHoy)} ${sufijoPrecio}`,
              )
            : null}
          {PAGOS_EN_APP ? fila("Periodo", plan ? (plan === "anual" ? "Anual" : "Mensual") : "Prueba gratuita") : null}
          {PAGOS_EN_APP && estado !== "prueba"
            ? fila("Fecha de pago", fechaPago ? fechaLarga(fechaPago) : "—")
            : null}
          {fila(
            estado === "prueba" ? "La prueba termina" : "Fecha de renovación",
            fechaFin ? fechaLarga(fechaFin) : "Sin fecha de vencimiento",
          )}
          {PAGOS_EN_APP && estado === "activa"
            ? fila(
                "Cargos pendientes",
                cargosPendientes && cargosPendientes.cantidad > 0
                  ? `${cargosPendientes.cantidad} · ${dinero(cargosPendientes.total)}`
                  : "Ninguno",
              )
            : null}
          {fila("Días restantes", diasRestantes === null ? "—" : textoDias(diasRestantes))}
          {PAGOS_EN_APP && estado === "activa" && diasPruebaSumados ? (
            <Text style={[styles.mensaje, { color: colors.textPrimary }]}>
              Incluye {textoDias(diasPruebaSumados)} de prueba que te quedaban.
            </Text>
          ) : null}
          {PAGOS_EN_APP && suscripcion.mensaje ? (
            <Text style={[styles.mensaje, { color: colors.textSecondary }]}>
              {suscripcion.mensaje}
            </Text>
          ) : null}
          {PAGOS_EN_APP ? (
            <Boton
              titulo={estado === "prueba" ? "ACTIVAR PLAN AHORA" : "CAMBIAR DE PLAN"}
              ayuda={
                estado === "prueba"
                  ? "Muestra el precio según tus profesionales. Los días de prueba que te quedan se suman al plan"
                  : "Muestra el precio según la cantidad de profesionales"
              }
              onPress={() => setVerPlanes(true)}
              style={styles.boton}
            />
          ) : null}
        </View>
      </SeccionPlegable>

      {incluidas.length > 0 ? (
        <SeccionPlegable titulo="Funciones incluidas" icono="checkmark-done-outline" resumen={resumenFunciones}>
          <View
            style={[styles.tarjeta, styles.funciones, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          >
            {incluidas.map((f) => (
              <View key={f.id} style={styles.funcion}>
                <Ionicons name="checkmark-circle" size={18} color={COLORES.verde} />
                <Text style={[styles.textoFuncion, { color: colors.textPrimary }]}>{f.nombre}</Text>
              </View>
            ))}
            {bloqueadas.map((f) => (
              <View key={f.id} style={styles.funcion}>
                <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
                <Text style={[styles.textoFuncion, { color: colors.textSecondary }]}>
                  {f.nombre}
                  {PAGOS_EN_APP && f.planRequerido ? ` · Disponible desde el nivel ${f.planRequerido.nombre}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </SeccionPlegable>
      ) : null}

      {PAGOS_EN_APP ? (
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
      ) : null}
    </>
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
  funciones: { paddingVertical: 10, gap: 6 },
  funcion: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 28 },
  textoFuncion: { flex: 1, fontSize: 13 },
  mensaje: { fontSize: 12, lineHeight: 17, paddingTop: 10 },
  boton: { marginTop: 12, marginBottom: 10 },
});
