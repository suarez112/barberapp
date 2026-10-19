import { Redirect, useLocalSearchParams } from "expo-router";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import SeleccionRolScreen from "@/features/inicio/SeleccionRolScreen";
import { useSesionLista } from "@/features/sesion/RestaurarSesionProvider";
import { usePersonal } from "@/features/sesion/usePersonal";

export default function InicioRoute() {
  // Compatibilidad con enlaces antiguos: /?codigo=INFINITY -> /cliente?codigo=INFINITY
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  const { lista } = useSesionLista();
  const personal = usePersonal();
  const { usuario } = useCuenta();

  if (typeof codigo === "string" && codigo.trim() !== "") {
    return <Redirect href={{ pathname: "/cliente", params: { codigo } }} />;
  }
  // Con una sesión guardada se entra directo al panel, sin volver a iniciar sesión
  if (lista && personal) {
    return <Redirect href={personal.esCuentaAdmin ? "/admin" : "/panel"} />;
  }
  if (lista && usuario?.rol === "cliente") return <Redirect href="/mis-negocios" />;
  return <SeleccionRolScreen />;
}
