import { useState } from "react";
import { View } from "react-native";
import Selector from "@/components/ui/Selector";
import EquipoAdmin from "../equipo/EquipoAdmin";
import ProductosAdmin from "../productos/ProductosAdmin";
import ServiciosAdmin from "../servicios/ServiciosAdmin";
import { Personal } from "../sesion/usePersonal";

type Seccion = "EQUIPO" | "SERVICIOS" | "PRODUCTOS";

const SECCIONES = [
  { id: "EQUIPO", label: "Equipo" },
  { id: "SERVICIOS", label: "Servicios" },
  { id: "PRODUCTOS", label: "Productos" },
] as const;

// Administración del negocio (solo administrador)
export default function NegocioTab({ personal }: { personal: Personal }) {
  const [seccion, setSeccion] = useState<Seccion>("EQUIPO");
  return (
    <View>
      <Selector opciones={SECCIONES} valor={seccion} onCambiar={setSeccion} />
      {seccion === "EQUIPO" ? <EquipoAdmin personal={personal} /> : null}
      {seccion === "SERVICIOS" ? <ServiciosAdmin token={personal.token} /> : null}
      {seccion === "PRODUCTOS" ? <ProductosAdmin token={personal.token} /> : null}
    </View>
  );
}
