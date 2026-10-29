import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import Chips from "@/components/ui/Chips";
import Desplegable from "@/components/ui/Desplegable";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { PlanSuscripcion, obtenerSuscripcion, Suscripcion } from "../cuenta/api";
import { nivelPara, precioPara } from "../planes/cobro";
import { usePlanes } from "../planes/usePlanes";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { usePersonal } from "../sesion/usePersonal";
import { crearOrden, esModoPrueba, OrdenCreada } from "./api";
import AvisoModoPrueba from "./AvisoModoPrueba";
import LoginPago from "./LoginPago";

const PERIODOS = [
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" },
] as const;

// Página web de pago (/pagar): la administradora elige cuántos profesionales y el periodo,
// ve el resumen con el precio del backend y sigue a la pasarela. Al volver, ConfirmarPago
// (/pagar/<referencia>) consulta el resultado.
export default function PagarScreen() {
  const { colors } = useAppTheme();
  const { lista } = useSesionLista();
  const personal = usePersonal();
  const { planes, error: errorPlanes, reintentar } = usePlanes();
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [profesionales, setProfesionales] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<PlanSuscripcion>("mensual");
  const [orden, setOrden] = useState<OrdenCreada | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const token = personal?.esAdmin ? personal.token : null;

  // Los profesionales que ya atienden clientes son el mínimo que se puede pagar
  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    obtenerSuscripcion(token, controlador.signal)
      .then((s) => {
        setSuscripcion(s);
        setProfesionales((actual) => actual ?? Math.max(1, s.profesionalesCobrados));
        if (s.plan) setPeriodo(s.plan);
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Suscripción (pago)", e);
        setProfesionales((actual) => actual ?? 1);
      });
    return () => controlador.abort();
  }, [token]);

  if (Platform.OS !== "web") return <Redirect href="/" />;

  const minimo = Math.max(1, suscripcion?.profesionalesCobrados ?? 1);
  const maximo = planes?.maximoProfesionales ?? 10;
  const cantidad = Math.min(Math.max(profesionales ?? minimo, minimo), maximo);

  const pagar = async () => {
    if (!token || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const creada = await crearOrden(token, { profesionales: cantidad, periodo });
      setOrden(creada);
      window.location.assign(creada.urlPago);
    } catch (e) {
      registrarCausa("Crear orden de pago", e);
      setError(describirError(e, { titulo: "", porDefecto: "No se pudo iniciar el pago." }).mensaje);
      setEnviando(false);
    }
  };

  const contenido = () => {
    if (!lista) return <ActivityIndicator color={colors.primaryText} style={styles.cargando} />;
    if (!personal) return <LoginPago texto="Inicia sesión con la cuenta del administrador para pagar tu plan." />;
    if (!personal.esAdmin) {
      return <Text style={[styles.texto, { color: colors.textSecondary }]}>Solo un administrador puede pagar el plan.</Text>;
    }
    if (errorPlanes) {
      return (
        <View>
          <Text style={[styles.texto, { color: colors.peligroTexto }]}>{errorPlanes}</Text>
          <Boton titulo="REINTENTAR" ayuda="Vuelve a cargar los precios" variante="secundario" onPress={reintentar} />
        </View>
      );
    }
    if (!planes || profesionales === null) return <ActivityIndicator color={colors.primaryText} style={styles.cargando} />;

    const precio = precioPara(planes, cantidad)[periodo];
    const nivel = nivelPara(planes, cantidad);
    const opciones = Array.from({ length: maximo - minimo + 1 }, (_, i) => minimo + i).map((n) => ({
      valor: n,
      etiqueta: `${n} ${n === 1 ? "profesional" : "profesionales"}`,
    }));

    return (
      <View>
        <Desplegable
          etiqueta="Número de profesionales"
          ayuda="Cuántas personas atienden clientes en tu negocio"
          placeholder="Elige cuántos"
          opciones={opciones}
          valor={cantidad}
          onCambiar={setProfesionales}
        />
        {minimo > 1 ? (
          <Text style={[styles.nota, { color: colors.textSecondary }]}>Mínimo {minimo}: ya atienden clientes hoy.</Text>
        ) : null}

        <Text style={[styles.etiqueta, { color: colors.textPrimary }]}>Periodo</Text>
        <Chips opciones={PERIODOS} valor={periodo} onCambiar={setPeriodo} />

        <View
          accessible
          accessibilityLabel={`Resumen: ${cantidad} ${cantidad === 1 ? "profesional" : "profesionales"}, plan ${periodo}, ${formatearPesos(precio)} pesos`}
          style={[styles.resumen, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <Text style={[styles.resumenTitulo, { color: colors.textSecondary }]}>RESUMEN</Text>
          <Text style={[styles.resumenLinea, { color: colors.textPrimary }]}>
            {cantidad} {cantidad === 1 ? "profesional" : "profesionales"} · Nivel {nivel.nombre}
          </Text>
          <Text style={[styles.resumenLinea, { color: colors.textPrimary }]}>
            Plan {periodo === "mensual" ? "mensual" : "anual"}
          </Text>
          <Text style={[styles.total, { color: colors.textPrimary }]}>${formatearPesos(precio)}</Text>
          <Text style={[styles.nota, { color: colors.textSecondary }]}>
            {planes.moneda} {periodo === "mensual" ? "al mes" : "al año"}
          </Text>
        </View>

        {orden && esModoPrueba(orden) ? <AvisoModoPrueba /> : null}
        {error ? <Text style={[styles.error, { color: colors.peligroTexto }]}>{error}</Text> : null}
        <Boton
          titulo={enviando ? "REDIRIGIENDO…" : "PAGAR"}
          ayuda="Te lleva a la pasarela de pago para completar la compra"
          deshabilitado={enviando}
          onPress={pagar}
        />
      </View>
    );
  };

  return (
    <Pantalla cabecera={{ onVolver: () => (router.canGoBack() ? router.back() : router.replace("/")) }}>
      <View style={styles.pagina}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
          Pagar mi plan
        </Text>
        {contenido()}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  pagina: { paddingVertical: 20 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  cargando: { marginTop: 30 },
  texto: { fontSize: 14, marginBottom: 12 },
  nota: { fontSize: 12, marginTop: 4 },
  etiqueta: { fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  resumen: { borderWidth: 1, borderRadius: 12, padding: 16, marginVertical: 16 },
  resumenTitulo: { fontSize: 11, fontWeight: "bold", letterSpacing: 1, marginBottom: 8 },
  resumenLinea: { fontSize: 15, marginBottom: 2 },
  total: { fontSize: 32, fontWeight: "bold", marginTop: 8 },
  error: { fontSize: 14, marginBottom: 12 },
});
