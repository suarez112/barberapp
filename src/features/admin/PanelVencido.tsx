import { ReactNode, useState } from "react";
import Pantalla from "@/components/layout/Pantalla";
import { Suscripcion } from "../cuenta/api";
import PanelTabBar, { Pestana, PestanaPanel } from "../panel/components/PanelTabBar";
import { useSalirDelPanel } from "../panel/useSalirDelPanel";
import ElegirPlan from "./components/ElegirPlan";

const PESTANAS: Pestana[] = [
  { id: "PLANES", icono: "card-outline", label: "Planes" },
  { id: "MI_NEGOCIO", icono: "business-outline", label: "Mi negocio" },
];

type Props = { suscripcion: Suscripcion; miNegocio: ReactNode };

// Panel del administrador con la prueba o el plan vencidos: solo puede elegir
// un plan y usar Mi negocio (lo demás responde 402 en el backend).
export default function PanelVencido({ suscripcion, miNegocio }: Props) {
  const salir = useSalirDelPanel();
  const [pestana, setPestana] = useState<PestanaPanel>("PLANES");

  return (
    <Pantalla
      cabecera={{ onSalir: salir }}
      pie={<PanelTabBar pestanas={PESTANAS} activa={pestana} onCambiar={setPestana} />}
    >
      {pestana === "PLANES" ? <ElegirPlan suscripcion={suscripcion} /> : miNegocio}
    </Pantalla>
  );
}
