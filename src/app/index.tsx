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
  // Con una sesión guardada se entra directo al panel, sin animación ni volver a iniciar sesión
  if (lista && personal) {
    return <Redirect href={personal.esCuentaAdmin ? "/admin" : "/panel"} />;
  }
  if (lista && usuario?.rol === "cliente") return <Redirect href="/mis-negocios" />;
  // Sin sesión: animación y luego la elección de perfil (también espera a leer la sesión guardada)
  if (!animada || !lista) return <AnimacionInicio onTerminar={terminarAnimacion} />;
  return <SeleccionRolScreen />;
}
