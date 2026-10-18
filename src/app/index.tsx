import { Redirect, useLocalSearchParams } from "expo-router";
import SeleccionRolScreen from "@/features/inicio/SeleccionRolScreen";

export default function InicioRoute() {
  // Compatibilidad con enlaces antiguos: /?codigo=INFINITY -> /cliente?codigo=INFINITY
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  if (typeof codigo === "string" && codigo.trim() !== "") {
    return <Redirect href={{ pathname: "/cliente", params: { codigo } }} />;
  }
  return <SeleccionRolScreen />;
}
