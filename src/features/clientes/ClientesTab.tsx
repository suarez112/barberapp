import { useState } from "react";
import { View } from "react-native";
import Selector from "@/components/ui/Selector";
import HistorialClientes from "./components/HistorialClientes";
import ListaNegra from "./components/ListaNegra";

type Seccion = "HISTORIAL" | "LISTA_NEGRA";

const SECCIONES = [
  { id: "HISTORIAL", label: "Historial" },
  { id: "LISTA_NEGRA", label: "Lista negra" },
] as const;

// La lista negra solo la gestiona el administrador
export default function ClientesTab({ esAdmin }: { esAdmin: boolean }) {
  const [seccion, setSeccion] = useState<Seccion>("HISTORIAL");

  if (!esAdmin) return <HistorialClientes />;

  return (
    <View>
      <Selector opciones={SECCIONES} valor={seccion} onCambiar={setSeccion} />
      {seccion === "HISTORIAL" ? <HistorialClientes /> : <ListaNegra />}
    </View>
  );
}
