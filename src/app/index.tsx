import { Redirect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import AnimacionInicio from "@/features/inicio/AnimacionInicio";
import SeleccionRolScreen from "@/features/inicio/SeleccionRolScreen";
import { useSesionLista } from "@/features/sesion/RestaurarSesionProvider";
import { usePersonal } from "@/features/sesion/usePersonal";

// La animación se ve una vez por cada vez que se abre la app, no al volver a esta pantalla
let animacionMostrada = false;

export default function InicioRoute() {
  // Compatibilidad con enlaces antiguos: /?codigo=INFINITY -> /cliente?codigo=INFINITY
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  const { lista } = useSesionLista();
  const personal = usePersonal();
  const { usuario } = useCuenta();
  const [animada, setAnimada] = useState(animacionMostrada);
  const terminarAnimacion = useCallback(() => {
    animacionMostrada = true;
    setAnimada(true);
  }, []);

  if (typeof codigo === "string" && codigo.trim() !== "") {
    return <Redirect href={{ pathname: "/cliente", params: { codigo } }} />;
  }
  // The intro always plays first (also with a saved session); the session is read meanwhile
  if (!animada || !lista) return <AnimacionInicio onTerminar={terminarAnimacion} />;
  // Con una sesión guardada se entra directo al panel, sin volver a iniciar sesión
  if (personal) {
    return <Redirect href={personal.esCuentaAdmin ? "/admin" : "/panel"} />;
  }
  if (usuario?.rol === "cliente") return <Redirect href="/mis-negocios" />;
  return <SeleccionRolScreen />;
}
