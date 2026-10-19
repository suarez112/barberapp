import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { usePersonal } from "../sesion/usePersonal";
import PanelAdministrador from "./PanelAdministrador";

// Panel del administrador de la empresa (cuenta de correo): agenda, bloqueos,
// clientes, cartera, equipo/servicios/productos y "Mi negocio".
export default function AdminPanelScreen() {
  const { colors } = useAppTheme();
  const { lista } = useSesionLista();
  const { usuario } = useCuenta();
  const personal = usePersonal();

  if (!lista) {
    return (
      <Pantalla>
        <ActivityIndicator color={colors.primary} style={styles.cargando} />
      </Pantalla>
    );
  }
  // Sin sesión de cuenta se va al ingreso; un cliente solo ve su apartado
  if (!usuario) return <Redirect href="/login" />;
  if (usuario.rol !== "admin" || !personal) return <Redirect href="/cliente" />;

  return <PanelAdministrador key={personal.token} personal={personal} />;
}

const styles = StyleSheet.create({
  cargando: { marginTop: 30 },
});
