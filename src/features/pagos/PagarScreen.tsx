import { Redirect } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { usePersonal } from "../sesion/usePersonal";
import PagoPasarela from "./PagoPasarela";
import { useConfiguracionPagos } from "./useConfiguracionPagos";

// /pagar (solo web): el administrador elige profesionales y periodo y sigue al checkout de Wompi.
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
  return <PagoPasarela modoPrueba={config?.esDePrueba ?? false} />;
}

const styles = StyleSheet.create({
  cargando: { marginTop: 30 },
});
