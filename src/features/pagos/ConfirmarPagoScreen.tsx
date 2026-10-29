import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { consultarEstadoPago, ResultadoPago } from "./api";
import AvisoModoPrueba from "./AvisoModoPrueba";
import { useModoPrueba } from "./useModoPrueba";

// A donde vuelve la pasarela: /pagar/<referencia>?id=<transacción>. Consulta el estado público
// del pago (no pide iniciar sesión); solo "Ir a mi panel" lleva al inicio de sesión.
export default function ConfirmarPagoScreen() {
  const { colors } = useAppTheme();
  const modoPrueba = useModoPrueba();
  const { referencia, id } = useLocalSearchParams<{ referencia: string; id?: string }>();
  const [resultado, setResultado] = useState<ResultadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!referencia) return;
    const controlador = new AbortController();
    consultarEstadoPago(String(referencia), id ? String(id) : undefined, controlador.signal)
      .then((r) => setResultado(r))
      .catch((e) => {
        if (esCancelada(e) || controlador.signal.aborted) return;
        registrarCausa("Estado del pago", e);
        setError(describirError(e, { titulo: "", porDefecto: "No se pudo consultar el pago." }).mensaje);
      });
    return () => controlador.abort();
  }, [referencia, id, intento]);

  if (Platform.OS !== "web") return <Redirect href="/" />;

  const reintentar = () => {
    setError(null);
    setIntento((n) => n + 1);
  };

  const irAlPanel = () => router.replace("/admin");

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
          <Text style={[styles.texto, { color: colors.textSecondary }]}>
            La pasarela todavía no confirma el pago. Vuelve a consultar en unos instantes.
          </Text>
          <Boton titulo="CONSULTAR DE NUEVO" ayuda="Vuelve a consultar el estado del pago" onPress={reintentar} />
        </View>
      );
    }
    return (
      <View>
        <Text accessibilityLiveRegion="polite" style={[styles.estado, { color: colors.peligroTexto }]}>
          Pago rechazado
        </Text>
        <Text style={[styles.texto, { color: colors.textSecondary }]}>
          No se cobró nada y tu plan no cambió. Puedes intentarlo de nuevo.
        </Text>
        <Boton titulo="INTENTAR OTRA VEZ" ayuda="Vuelve a la página de pago" onPress={() => router.replace("/pagar")} style={styles.boton} />
      </View>
    );
  };

  return (
    <Pantalla cabecera={{ onVolver: () => router.replace("/admin") }}>
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
