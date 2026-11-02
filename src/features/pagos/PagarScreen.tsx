import { Redirect } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import { useAppTheme } from "@/theme/ThemeProvider";
import PanelAdministrador from "../admin/PanelAdministrador";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { usePersonal } from "../sesion/usePersonal";
import PagoPasarela from "./PagoPasarela";
import { useConfiguracionPagos } from "./useConfiguracionPagos";

// /pagar (solo web). Según el proveedor del backend: pagos manuales (el panel del administrador
// abierto en "Mi plan": Nequi, Bre-B y QR con comprobante por WhatsApp) o la pasarela de siempre.
// Sin sesión se va al inicio de sesión normal y, al entrar, se vuelve aquí.
export default function PagarScreen() {
  if (Platform.OS !== "web") return <Redirect href="/" />;
  return <PagarWeb />;
}

function PagarWeb() {
  const { colors } = useAppTheme();
  const { lista } = useSesionLista();
  const personal = usePersonal();
  const { config, cargando } = useConfiguracionPagos();

  if (!lista || cargando) {
    return (
      <Pantalla>
        <ActivityIndicator accessibilityLabel="Cargando" color={colors.primaryText} style={styles.cargando} />
      </Pantalla>
    );
  }
  if (!personal) return <Redirect href={{ pathname: "/login", params: { volverA: "/pagar" } }} />;
  if (config?.proveedor !== "manual") return <PagoPasarela modoPrueba={config?.esDePrueba ?? false} />;
  // Un empleado nunca ve esta pantalla
  if (!personal.esAdmin) return <Redirect href="/panel" />;
  return <PanelAdministrador key={personal.token} personal={personal} pestanaInicial="MI_PLAN" />;
}

const styles = StyleSheet.create({
  cargando: { marginTop: 30 },
});
