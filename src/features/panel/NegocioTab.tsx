import { useState } from "react";
import { View } from "react-native";
import Selector from "@/components/ui/Selector";
import { Suscripcion } from "../cuenta/api";
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
export default function NegocioTab({
  seccionInicial = "EQUIPO",
  personal,
  suscripcion,
  onEquipoCambiado,
}: {
  // Sección que se abre primero (ej. Servicios, desde la guía inicial)
  seccionInicial?: Seccion;
  personal: Personal;
  // Plan y cupo del equipo (null mientras carga)
  suscripcion: Suscripcion | null;
  onEquipoCambiado?: () => void;
}) {
  const [seccion, setSeccion] = useState<Seccion>(seccionInicial);
  return (
    <View>
      <Selector opciones={SECCIONES} valor={seccion} onCambiar={setSeccion} />
      {seccion === "EQUIPO" ? (
        <EquipoAdmin
          personal={personal}
          suscripcion={suscripcion}
          onEquipoCambiado={onEquipoCambiado}
        />
      ) : null}
      {seccion === "SERVICIOS" ? <ServiciosAdmin token={personal.token} /> : null}
      {seccion === "PRODUCTOS" ? <ProductosAdmin token={personal.token} /> : null}
    </View>
  );
}
