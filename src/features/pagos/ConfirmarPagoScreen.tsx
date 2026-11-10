import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { consultarEstadoPago, ResultadoPago } from "./api";
import AvisoModoPrueba from "./AvisoModoPrueba";
import { useDestinoPanel } from "../sesion/useDestinoPanel";
import { useConfiguracionPagos } from "./useConfiguracionPagos";

// Esperas (ms) entre consultas automáticas mientras el pago sigue pendiente: unos 50 s en total.
// Pasado ese tiempo queda el botón para consultar a mano.
const ESPERAS_MS = [2000, 3000, 5000, 8000, 12000, 20000];

// A donde vuelve Wompi: /pagar/<referencia>?id=<transacción>. Consulta el estado público
// del pago (no pide iniciar sesión); solo "Ir a mi panel" lleva al inicio de sesión.
export default function ConfirmarPagoScreen() {
  const { colors } = useAppTheme();
  const destinoPanel = useDestinoPanel();
  const { config } = useConfiguracionPagos();
  const modoPrueba = config?.esDePrueba ?? false;
  const { referencia, id } = useLocalSearchParams<{ referencia: string; id?: string }>();
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  // Consultas automáticas ya hechas y si todavía se espera otra
  const automaticas = useRef(0);
  const [esperando, setEsperando] = useState(false);

  useEffect(() => {
    if (!referencia) return;
    const controlador = new AbortController();
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    consultarEstadoPago(String(referencia), id ? String(id) : undefined, controlador.signal)
      .then((r) => {
        setResultado(r);
        const sigue = r.estado === "pendiente" && automaticas.current < ESPERAS_MS.length;
        setEsperando(sigue);
        if (sigue) {
          temporizador = setTimeout(() => setIntento((n) => n + 1), ESPERAS_MS[automaticas.current]);
          automaticas.current += 1;
        }
      })
      .catch((e) => {
        if (esCancelada(e) || controlador.signal.aborted) return;
        registrarCausa("Estado del pago", e);
        setError(describirError(e, { titulo: "", porDefecto: "No se pudo consultar el pago." }).mensaje);
      });
    return () => {
      controlador.abort();
      clearTimeout(temporizador);
    };
  }, [referencia, id, intento]);

  if (Platform.OS !== "web") return <Redirect href="/" />;

  // Consulta a mano: vuelve a dar otra ronda de consultas automáticas
  const reintentar = () => {
    setError(null);
    setResultado(null);
    automaticas.current = 0;
    setIntento((n) => n + 1);
  };

  const irAlPanel = () => router.replace(destinoPanel);

  const contenido = () => {
    if (error) {
      return (
        <View>
          <Text accessibilityLiveRegion="polite" style={[styles.estado, { color: colors.peligroTexto }]}>
            No se pudo consultar el pago
          </Text>
          <Text style={[styles.texto, { color: colors.textSecondary }]}>{error}</Text>
          <Boton titulo="REINTENTAR" ayuda="Vuelve a consultar el estado del pago" onPress={reintentar} />
        </View>
      );
    }
    if (!resultado) {
      return (
        <View>
          <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
          <Text style={[styles.texto, styles.centro, { color: colors.textSecondary }]}>Consultando tu pago…</Text>
        </View>
      );
    }

    if (resultado.estado === "aprobado") {
      return (
        <View>
          <Text accessibilityLiveRegion="polite" style={[styles.estado, { color: colors.exitoTexto }]}>
            ¡Pago aprobado!
          </Text>
          <Text style={[styles.texto, { color: colors.textPrimary }]}>
            Tu plan {resultado.nivel ? `${resultado.nivel.nombre} ` : ""}está activo
            {resultado.vencimiento ? ` hasta el ${resultado.vencimiento}` : ""}.
          </Text>
          <Text style={[styles.nota, { color: colors.textSecondary }]}>Referencia: {referencia}</Text>
          <Boton titulo="IR A MI PANEL" ayuda="Abre el panel de tu negocio; te pedirá iniciar sesión" onPress={irAlPanel} style={styles.boton} />
        </View>
      );
    }
    if (resultado.estado === "pendiente") {
      return (
        <View>
          <Text accessibilityLiveRegion="polite" style={[styles.estado, { color: colors.avisoTexto }]}>
            Pago pendiente
          </Text>
          {esperando ? (
            <>
              <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
              <Text style={[styles.texto, styles.centro, { color: colors.textSecondary }]}>
                Esperando la confirmación de Wompi. No cierres esta página.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.texto, { color: colors.textSecondary }]}>
                Wompi todavía no confirma el pago. Si ya pagaste, vuelve a consultar en unos instantes.
              </Text>
              <Boton titulo="CONSULTAR DE NUEVO" ayuda="Vuelve a consultar el estado del pago" onPress={reintentar} />
            </>
          )}
        </View>
      );
    }
    return (
      <View>
        <Text accessibilityLiveRegion="polite" style={[styles.estado, { color: colors.peligroTexto }]}>
          Pago rechazado
        </Text>
        <Text style={[styles.texto, { color: colors.textSecondary }]}>
          No se cobró nada y tu plan no cambió. Puedes intentarlo de nuevo: se crea un pago nuevo.
        </Text>
        <Boton titulo="INTENTAR OTRA VEZ" ayuda="Vuelve a la página de pago" onPress={() => router.replace("/pagar")} style={styles.boton} />
      </View>
    );
  };

  return (
    <Pantalla cabecera={{ onVolver: irAlPanel }}>
      <View style={styles.pagina}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
          Resultado del pago
        </Text>
        {modoPrueba ? <AvisoModoPrueba /> : null}
        {contenido()}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  pagina: { paddingVertical: 20 },
  titulo: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  cargando: { marginTop: 30 },
  estado: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  texto: { fontSize: 14, marginBottom: 12 },
  centro: { textAlign: "center" },
  nota: { fontSize: 12, marginBottom: 16 },
  boton: { marginTop: 8 },
});
