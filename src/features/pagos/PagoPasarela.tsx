import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import Chips from "@/components/ui/Chips";
import Desplegable from "@/components/ui/Desplegable";
import { Aviso, describirError, registrarCausa } from "@/services/api/errores";
import { ApiError, esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { PlanSuscripcion, obtenerSuscripcion, Suscripcion } from "../cuenta/api";
import { nivelPara, precioPara } from "../planes/cobro";
import { usePlanes } from "../planes/usePlanes";
import { useVolver } from "../ayuda/volverAyuda";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { usePersonal } from "../sesion/usePersonal";
import { crearOrden } from "./api";
import AvisoModoPrueba from "./AvisoModoPrueba";

const PERIODOS = [
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" },
] as const;

// Aviso de un error al crear la orden. 409 (menos profesionales de los que atienden, o negocio cancelado)
// y 403 (negocio suspendido) traen su motivo en el mensaje del servidor. El 503 (pagos sin configurar)
// también, pero describirError lo cubre con un texto genérico de 5xx: aquí se muestra el del servidor.
const avisoDeOrden = (e: unknown): Aviso => {
  const aviso = describirError(e, { titulo: "No se pudo iniciar el pago", porDefecto: "No se pudo iniciar el pago." });
  return e instanceof ApiError && e.status === 503 && e.message ? { titulo: aviso.titulo, mensaje: e.message } : aviso;
};

// Lo elegido en Planes llega como /pagar?profesionales=<n>&periodo=<mensual|anual>.
// Solo cuenta si ambos son válidos; si no, se ignora y se elige aquí.
type Elegido = { profesionales: number; periodo: PlanSuscripcion };
const leerElegido = (profesionales: unknown, periodo: unknown): Elegido | null => {
  const n = typeof profesionales === "string" && /^\d+$/.test(profesionales) ? Number(profesionales) : NaN;
  if (!Number.isInteger(n) || n < 1) return null;
  if (periodo !== "mensual" && periodo !== "anual") return null;
  return { profesionales: n, periodo };
};

// Pago con Wompi. Desde Planes llega lo elegido y la pantalla solo confirma (resumen + PAGAR);
// entrando directo, la administradora elige profesionales y periodo aquí. Sigue al checkout y,
// al volver, ConfirmarPago (/pagar/<referencia>) consulta el resultado.
export default function PagoPasarela({ modoPrueba }: { modoPrueba: boolean }) {
  const { colors } = useAppTheme();
  const volver = useVolver();
  const { lista } = useSesionLista();
  const personal = usePersonal();
  const { planes, error: errorPlanes, reintentar } = usePlanes();
  const parametros = useLocalSearchParams<{ profesionales?: string; periodo?: string }>();
  const [elegido] = useState(() => leerElegido(parametros.profesionales, parametros.periodo));
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [profesionales, setProfesionales] = useState<number | null>(elegido?.profesionales ?? null);
  const [periodo, setPeriodo] = useState<PlanSuscripcion>(elegido?.periodo ?? "mensual");
  const [error, setError] = useState<Aviso | null>(null);
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
        if (s.plan && !elegido) setPeriodo(s.plan);
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Suscripción (pago)", e);
        setProfesionales((actual) => actual ?? 1);
      });
    return () => controlador.abort();
  }, [token, elegido]);

  if (Platform.OS !== "web") return <Redirect href="/" />;

  const minimo = Math.max(1, suscripcion?.profesionalesCobrados ?? 1);
  const maximo = planes?.maximoProfesionales ?? 10;
  const cantidad = Math.min(Math.max(profesionales ?? minimo, minimo), maximo);
  const precio = planes ? precioPara(planes, cantidad)[periodo] : null;

  const pagar = async () => {
    if (!token || enviando || precio === null) return;
    setEnviando(true);
    setError(null);
    try {
      const creada = await crearOrden(token, { profesionales: cantidad, periodo });
      // La pasarela cobra el monto de la orden: si no es el precio mostrado, no se redirige
      if (creada.monto !== precio) {
        setError({
          titulo: "El precio cambió",
          mensaje: `El pago sería de $${formatearPesos(creada.monto)} y aquí se muestra $${formatearPesos(precio)}. No se cobró nada. Recarga la página para ver el precio actual.`,
        });
        setEnviando(false);
        return;
      }
      if (typeof creada.urlPago !== "string" || !creada.urlPago.startsWith("https://")) {
        setError({
          titulo: "No se pudo iniciar el pago",
          mensaje: "La dirección de la pasarela de pago no es segura. No se cobró nada. Intenta de nuevo más tarde.",
        });
        setEnviando(false);
        return;
      }
      window.location.assign(creada.urlPago);
    } catch (e) {
      registrarCausa("Crear orden de pago", e);
      setError(avisoDeOrden(e));
      setEnviando(false);
    }
  };

  const contenido = () => {
    if (!lista) {
      return <ActivityIndicator accessibilityLabel="Cargando" color={colors.primaryText} style={styles.cargando} />;
    }
    if (!personal) return <Redirect href={{ pathname: "/login", params: { volverA: "/pagar" } }} />;
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
    if (!planes || precio === null || profesionales === null) {
      return <ActivityIndicator accessibilityLabel="Cargando precios" color={colors.primaryText} style={styles.cargando} />;
    }

    const nivel = nivelPara(planes, cantidad);
    const opciones = Array.from({ length: maximo - minimo + 1 }, (_, i) => minimo + i).map((n) => ({
      valor: n,
      etiqueta: `${n} ${n === 1 ? "profesional" : "profesionales"}`,
    }));

    return (
      <View>
        {elegido ? null : (
          <>
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
          </>
        )}

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

        {error ? (
          <View accessibilityLiveRegion="polite" style={styles.error}>
            <Text style={[styles.errorTitulo, { color: colors.peligroTexto }]}>{error.titulo}</Text>
            <Text style={[styles.errorTexto, { color: colors.peligroTexto }]}>{error.mensaje}</Text>
          </View>
        ) : null}
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
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.pagina}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
          Pagar mi plan
        </Text>
        {modoPrueba ? <AvisoModoPrueba /> : null}
        {contenido()}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  pagina: { paddingVertical: 20, width: "100%", maxWidth: 720, alignSelf: "center" },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  cargando: { marginTop: 30 },
  texto: { fontSize: 14, marginBottom: 12 },
  nota: { fontSize: 12, marginTop: 4 },
  etiqueta: { fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  resumen: { borderWidth: 1, borderRadius: 12, padding: 16, marginVertical: 16 },
  resumenTitulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 8 },
  resumenLinea: { fontSize: 15, marginBottom: 2 },
  total: { fontSize: 32, fontWeight: "bold", marginTop: 8 },
  error: { marginBottom: 12 },
  errorTitulo: { fontSize: 14, fontWeight: "bold" },
  errorTexto: { fontSize: 14 },
});
