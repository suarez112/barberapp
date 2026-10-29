import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { formatearPesos } from "@/utils/formato";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { usePersonal } from "../sesion/usePersonal";
import { confirmarOrden, esModoPrueba, OrdenPago } from "./api";
import AvisoModoPrueba from "./AvisoModoPrueba";
import LoginPago from "./LoginPago";

// A donde vuelve la pasarela: /pagar/<referencia>?id=<transacción>. Le pregunta al backend
// por el estado de la orden (él consulta a la pasarela) y muestra el resultado.
export default function ConfirmarPagoScreen() {
  const { colors } = useAppTheme();
  const { lista } = useSesionLista();
  const personal = usePersonal();
  const { referencia, id } = useLocalSearchParams<{ referencia: string; id?: string }>();
  const [orden, setOrden] = useState<OrdenPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const token = personal?.esAdmin ? personal.token : null;

  useEffect(() => {
    if (!token || !referencia) return;
    const controlador = new AbortController();
    confirmarOrden(token, String(referencia), id ? String(id) : undefined)
      .then((o) => {
        if (!controlador.signal.aborted) setOrden(o);
      })
      .catch((e) => {
        if (esCancelada(e) || controlador.signal.aborted) return;
        registrarCausa("Confirmar pago", e);
        setError(describirError(e, { titulo: "", porDefecto: "No se pudo confirmar el pago." }).mensaje);
      });
    return () => controlador.abort();
  }, [token, referencia, id, intento]);

  if (Platform.OS !== "web") return <Redirect href="/" />;

  const reintentar = () => {
    setError(null);
    setIntento((n) => n + 1);
  };

  const irAlPanel = () => router.replace("/admin");

  const contenido = () => {
    if (!lista) return <ActivityIndicator color={colors.primaryText} style={styles.cargando} />;
    if (!personal) {
      return <LoginPago texto="Inicia sesión otra vez para ver el resultado de tu pago." />;
    }
    if (!personal.esAdmin) {
      return <Text style={[styles.texto, { color: colors.textSecondary }]}>Solo un administrador puede ver este pago.</Text>;
    }
    if (error) {
      return (
        <View>
          <Text accessibilityLiveRegion="polite" style={[styles.estado, { color: colors.peligroTexto }]}>
            No se pudo confirmar el pago
          </Text>
          <Text style={[styles.texto, { color: colors.textSecondary }]}>{error}</Text>
          <Boton titulo="REINTENTAR" ayuda="Vuelve a consultar el estado del pago" onPress={reintentar} />
        </View>
      );
    }
    if (!orden) {
      return (
        <View>
          <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
          <Text style={[styles.texto, styles.centro, { color: colors.textSecondary }]}>Consultando tu pago…</Text>
        </View>
      );
    }

    const detalle = `${orden.profesionales} ${orden.profesionales === 1 ? "profesional" : "profesionales"} · plan ${orden.periodo} · $${formatearPesos(orden.monto)} ${orden.moneda}`;
    if (orden.estado === "aprobada") {
      return (
        <View>
          <Text accessibilityLiveRegion="polite" style={[styles.estado, { color: colors.exitoTexto }]}>
            ¡Pago aprobado!
          </Text>
          <Text style={[styles.texto, { color: colors.textPrimary }]}>Tu plan está activo: {detalle}.</Text>
          <Text style={[styles.nota, { color: colors.textSecondary }]}>Referencia: {orden.referencia}</Text>
          <Boton titulo="IR A MI PANEL" ayuda="Abre el panel de tu negocio" onPress={irAlPanel} style={styles.boton} />
        </View>
      );
    }
    if (orden.estado === "pendiente") {
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
          {orden.estado === "rechazada" ? "Pago rechazado" : "Pago anulado"}
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
        {orden && esModoPrueba(orden) ? <AvisoModoPrueba /> : null}
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
