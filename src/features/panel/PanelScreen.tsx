import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";
import { usePersonal } from "../sesion/usePersonal";
import PanelAdministrador from "../admin/PanelAdministrador";
import PanelNegocio from "./PanelNegocio";

// Panel del integrante del personal (usuario y contraseña)
export default function PanelScreen() {
  const { colors } = useAppTheme();
  const { lista } = useSesionLista();
  const personal = usePersonal();

  if (!lista) {
    return (
      <Pantalla>
        <ActivityIndicator color={colors.primaryText} style={{ marginTop: 40 }} />
      </Pantalla>
    );
  }
  // Sin sesión (o al cerrarla) se vuelve al ingreso
  if (!personal) return <Redirect href="/login" />;
  // La cuenta del administrador tiene su propio panel
  if (personal.esCuentaAdmin) return <Redirect href="/admin" />;

  // Un integrante con rol Administrador ve lo mismo que la cuenta (con Mi negocio)
  return personal.esAdmin ? (
    <PanelAdministrador key={personal.token} personal={personal} />
  ) : (
    <PanelNegocio key={personal.token} personal={personal} />
  );
}
