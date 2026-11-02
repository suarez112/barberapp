import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ANCHO_PANEL_ANCHO } from "@/components/layout/PanelAdaptable";
import Boton from "@/components/ui/Boton";
import Chips from "@/components/ui/Chips";
import Insignia from "@/components/ui/Insignia";
import { describirError, esEstado, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, confirmar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { PlanSuscripcion, Suscripcion } from "../../cuenta/api";
import { crearOrdenManual, listarMisOrdenes, obtenerOrdenManual, OrdenManual } from "../api";
import FormasDePago from "../components/FormasDePago";
import { AVISO_DIAS_SE_SUMAN, ESTADOS_ORDEN } from "../estados";
import HistorialPagos from "./HistorialPagos";
import { enlaceComprobante } from "./mensajeWhatsApp";

const PERIODOS = [
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" },
] as const;

const PASOS = [
  "Paga por Nequi, Bre-B o QR.",
  "Envía el comprobante por WhatsApp.",
  "Te avisaremos en la app cuando lo aprobemos.",
];

const CADA_SEGUNDOS = 30;

// Texto propio: el del servidor para esta ruta viene de la pasarela
const NO_ENCONTRADO = "No encontramos ese pago.";

const mensajeDe = (e: unknown, porDefecto: string) =>
  esEstado(e, 404) ? NO_ENCONTRADO : describirError(e, { titulo: "", porDefecto }).mensaje;

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Props = {
  token: string;
  suscripcion: Suscripcion;
  // Se avisa cuando se aprueba un pago, para que el panel vuelva a pedir la suscripción
  alAprobarse?: () => void;
};

// Sección "Mi plan" (administrador, web, pagos manuales): a la izquierda el plan y el periodo,
// a la derecha cómo pagar (Nequi, llave Bre-B, QR y WhatsApp) y debajo el historial.
// El monto lo calcula el servidor; un revisor aprueba el comprobante.
export default function PagoManual({ token, suscripcion, alAprobarse }: Props) {
  const { colors } = useAppTheme();
  const ancho = useWindowDimensions().width >= ANCHO_PANEL_ANCHO;
  const aviso = useRef(alAprobarse);
  useEffect(() => {
    aviso.current = alAprobarse;
  });
  const [ordenes, setOrdenes] = useState<OrdenManual[] | null>(null);
  const [pendiente, setPendiente] = useState<OrdenManual | null>(null);
  const [periodo, setPeriodo] = useState<PlanSuscripcion>(suscripcion.plan ?? "mensual");
  const [error, setError] = useState<string | null>(null);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const vigente = useRef(true);
  // Referencia de la pendiente que se estaba viendo, para avisar cuando la revisan
  const vista = useRef<string | null>(null);
  const [resuelta, setResuelta] = useState<OrdenManual | null>(null);

  useEffect(() => {
    vigente.current = true;
    return () => {
      vigente.current = false;
    };
  }, []);

  // Trae las órdenes y, si hay una pendiente, su detalle (trae las formas de pago)
  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const lista = await listarMisOrdenes(token, signal);
        const abierta = lista.find((o) => o.estado === "pendiente");
        const detalle = abierta ? await obtenerOrdenManual(token, abierta.referencia, signal) : null;
        if (!vigente.current || signal?.aborted) return;
        // La orden que se veía ya no está pendiente: la revisaron (o se anuló)
        const anterior = vista.current;
        if (anterior && anterior !== abierta?.referencia) {
          const revisada = lista.find((o) => o.referencia === anterior) ?? null;
          setResuelta(revisada);
          if (revisada?.estado === "aprobada") aviso.current?.();
        }
        vista.current = abierta?.referencia ?? null;
        setOrdenes(lista);
        setPendiente(detalle);
        setError(null);
      } catch (e) {
        if (esCancelada(e) || !vigente.current) return;
        registrarCausa("Pagos manuales", e);
        setError(mensajeDe(e, "No se pudieron cargar tus pagos."));
      }
    },
    [token],
  );

  useEffect(() => {
    const control = new AbortController();
    cargar(control.signal);
    return () => control.abort();
  }, [cargar]);

  // Mientras hay un pago por revisar, se consulta cada 30 s para mostrar el resultado
  const hayPendiente = pendiente !== null;
  useEffect(() => {
    if (!hayPendiente) return;
    const reloj = setInterval(() => cargar(), CADA_SEGUNDOS * 1000);
    return () => clearInterval(reloj);
  }, [hayPendiente, cargar]);

  const crear = async () => {
    if (creando) return;
    if (pendiente) {
      const seguir = await confirmar({
        titulo: "Ya tienes un pago pendiente",
        mensaje: "Ya tienes un pago pendiente. Si creas uno nuevo, el anterior se anula.",
        destructivo: true,
        textoAceptar: "CREAR NUEVO",
      });
      if (!seguir) return;
    }
    setCreando(true);
    setErrorCrear(null);
    try {
      const creada = await crearOrdenManual(token, periodo);
      if (!vigente.current) return;
      vista.current = creada.referencia;
      setResuelta(null);
      setPendiente(creada);
      // La lista se refresca para que la orden anulada pase al historial
      await cargar();
    } catch (e) {
      if (!vigente.current) return;
      registrarCausa("Crear orden de pago manual", e);
      setErrorCrear(describirError(e, { titulo: "", porDefecto: "No se pudo crear el pago." }).mensaje);
    } finally {
      if (vigente.current) setCreando(false);
    }
  };

  const abrirWhatsApp = async () => {
    if (!pendiente?.pago) return;
    try {
      await Linking.openURL(enlaceComprobante(pendiente.pago.whatsappUrl, pendiente));
    } catch {
      avisar("No se pudo abrir WhatsApp", `Escribe al ${pendiente.pago.whatsapp} y envía tu comprobante.`, "error");
    }
  };

  if (!ordenes) {
    if (error) {
      return (
        <View style={styles.columna}>
          <Text style={[styles.error, { color: colors.peligroTexto }]}>{error}</Text>
          <Boton titulo="REINTENTAR" ayuda="Vuelve a cargar tus pagos" variante="secundario" onPress={() => cargar()} />
        </View>
      );
    }
    return <ActivityIndicator accessibilityLabel="Cargando" color={colors.primaryText} style={styles.cargando} />;
  }

  const tarjeta = [styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }];
  const fila = (etiqueta: string, valor: string) => (
    <View
      accessible
      accessibilityLabel={`${etiqueta}: ${valor}`}
      style={[styles.filaDato, { borderBottomColor: colors.cardBorder }]}
    >
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{etiqueta}</Text>
      <Text style={[styles.valor, { color: colors.textPrimary }]}>{valor}</Text>
    </View>
  );
  const profesionales = pendiente?.profesionales ?? suscripcion.profesionalesCobrados;

  const tuPlan = (
    <View style={tarjeta}>
      <View style={styles.cabecera}>
        <Text accessibilityRole="header" style={[styles.subtitulo, { color: colors.primaryText }]}>
          TU PLAN
        </Text>
        {pendiente ? <Insignia texto={ESTADOS_ORDEN.pendiente.texto} color={ESTADOS_ORDEN.pendiente.color} /> : null}
      </View>
      {fila("Nivel", pendiente?.plan.nombre ?? suscripcion.planEquipo.nombre)}
      {fila("Profesionales", `${profesionales} ${profesionales === 1 ? "profesional" : "profesionales"}`)}
      {fila("Periodo", mayuscula(pendiente?.periodo ?? periodo))}
      {pendiente ? (
        <View
          accessible
          accessibilityLabel={`Monto a pagar: ${formatearPesos(pendiente.monto)} pesos`}
          style={styles.montoCaja}
        >
          <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>MONTO A PAGAR</Text>
          <Text style={[styles.monto, { color: colors.textPrimary }]}>${formatearPesos(pendiente.monto)}</Text>
          <Text style={[styles.detalle, { color: colors.textSecondary }]}>Referencia: {pendiente.referencia}</Text>
        </View>
      ) : (
        fila("Monto", "Se muestra al continuar")
      )}

      <Text accessibilityRole="header" style={[styles.subtitulo, styles.separado, { color: colors.primaryText }]}>
        {pendiente ? "CAMBIAR EL PERIODO" : "ELIGE EL PERIODO"}
      </Text>
      <Chips opciones={PERIODOS} valor={periodo} onCambiar={setPeriodo} />
      <Text style={[styles.detalle, { color: colors.textSecondary }]}>
        El monto lo calcula el sistema según los profesionales que atienden clientes hoy.
      </Text>
      {errorCrear ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.peligroTexto }]}>
          {errorCrear}
        </Text>
      ) : null}
      <Boton
        titulo={creando ? "CREANDO…" : pendiente ? "CREAR UN PAGO NUEVO" : "VER MONTO Y FORMAS DE PAGO"}
        ayuda={
          pendiente
            ? "Anula tu pago pendiente y crea uno nuevo con el periodo elegido"
            : "Crea el pago con el periodo elegido y muestra cómo pagar"
        }
        variante={pendiente ? "secundario" : "primario"}
        deshabilitado={creando}
        onPress={crear}
        style={styles.crear}
      />
      <Text style={[styles.detalle, { color: colors.textSecondary }]}>{AVISO_DIAS_SE_SUMAN}</Text>
    </View>
  );

  const comoPagar = (
    <View style={tarjeta}>
      <Text accessibilityRole="header" style={[styles.subtitulo, { color: colors.primaryText }]}>
        CÓMO PAGAR
      </Text>
      {PASOS.map((p, i) => (
        <View key={p} style={styles.paso}>
          <View style={[styles.numero, { backgroundColor: colors.primary }]}>
            <Text style={[styles.textoNumero, { color: colors.onPrimary }]}>{i + 1}</Text>
          </View>
          <Text style={[styles.textoPaso, { color: colors.textPrimary }]}>{p}</Text>
        </View>
      ))}

      {pendiente?.pago ? (
        <>
          <View style={styles.formas}>
            <FormasDePago pago={pendiente.pago} token={token} />
          </View>
          <Boton
            titulo="ENVIAR COMPROBANTE POR WHATSAPP"
            ayuda="Abre WhatsApp con el mensaje del comprobante ya escrito"
            onPress={abrirWhatsApp}
            style={styles.whatsapp}
          />
        </>
      ) : (
        <Text style={[styles.detalle, styles.formas, { color: colors.textSecondary }]}>
          Elige el periodo y toca &quot;Ver monto y formas de pago&quot;: aquí aparecen Nequi, la llave Bre-B y los códigos QR.
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.columna}>
      <Text accessibilityRole="header" style={[styles.titulo, { color: colors.primaryText }]}>
        MI PLAN
      </Text>

      {resuelta ? (
        <View
          accessibilityRole="alert"
          style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: ESTADOS_ORDEN[resuelta.estado].color }]}
        >
          <Text style={[styles.aviso, { color: colors.textPrimary }]}>
            {resuelta.estado === "aprobada"
              ? "¡Tu pago fue aprobado! Tu suscripción ya está activa."
              : resuelta.estado === "rechazada"
                ? `Tu pago fue rechazado${resuelta.motivoRevision ? `: ${resuelta.motivoRevision}` : "."}`
                : "Tu pago anterior se anuló."}
          </Text>
        </View>
      ) : null}

      <View style={[styles.dos, ancho && styles.dosAncho]}>
        <View style={ancho ? styles.izquierda : undefined}>{tuPlan}</View>
        <View style={ancho ? styles.derecha : undefined}>{comoPagar}</View>
      </View>

      {error ? <Text style={[styles.error, { color: colors.peligroTexto }]}>{error}</Text> : null}
      <HistorialPagos ordenes={ordenes} />
    </View>
  );
}

const styles = StyleSheet.create({
  columna: { gap: 16, paddingVertical: 16 },
  titulo: { fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  cargando: { marginTop: 30 },
  dos: { gap: 16 },
  dosAncho: { flexDirection: "row", alignItems: "flex-start" },
  izquierda: { flex: 1, minWidth: 0 },
  derecha: { flex: 1.3, minWidth: 0 },
  tarjeta: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 8 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  subtitulo: { fontSize: 12, fontWeight: "bold", letterSpacing: 1 },
  separado: { marginTop: 12 },
  filaDato: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  etiqueta: { fontSize: 13 },
  valor: { fontSize: 14, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 10 },
  montoCaja: { paddingVertical: 12, gap: 2 },
  paso: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 36 },
  numero: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  textoNumero: { fontSize: 14, fontWeight: "bold" },
  textoPaso: { flex: 1, fontSize: 15 },
  monto: { fontSize: 36, fontWeight: "bold" },
  detalle: { fontSize: 13, lineHeight: 18 },
  formas: { marginTop: 12 },
  whatsapp: { marginTop: 16 },
  crear: { marginTop: 8 },
  error: { fontSize: 14, marginVertical: 4 },
  aviso: { fontSize: 15, fontWeight: "600" },
});
