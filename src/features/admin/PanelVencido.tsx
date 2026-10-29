import { ReactNode, useState } from "react";
import { Linking } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import PantallaAviso from "@/components/ui/PantallaAviso";
import { CONTACTO } from "@/config/app";
import { PAGOS_EN_APP } from "@/config/pagos";
import { Suscripcion } from "../cuenta/api";
import PanelTabBar, { Pestana, PestanaPanel } from "../panel/components/PanelTabBar";
import { useSalirDelPanel } from "../panel/useSalirDelPanel";
import ElegirPlan from "./components/ElegirPlan";

const PESTANAS: Pestana[] = [
  { id: "PLANES", icono: "card-outline", label: "Planes" },
  { id: "MI_NEGOCIO", icono: "business-outline", label: "Mi negocio" },
];

type Props = { suscripcion: Suscripcion; miNegocio: ReactNode };

// Panel del administrador con la prueba o el plan vencidos. En la web puede elegir
// un plan y usar Mi negocio (lo demás responde 402 en el backend). En el celular solo
// ve el aviso con el correo de soporte: no se habla de planes ni pagos.
export default function PanelVencido({ suscripcion, miNegocio }: Props) {
  const salir = useSalirDelPanel();
  const [pestana, setPestana] = useState<PestanaPanel>("PLANES");

  if (!PAGOS_EN_APP) {
    const correo = CONTACTO.correo;
    return (
      <Pantalla cabecera={{ onSalir: salir }}>
        <PantallaAviso
          icono="time-outline"
          titulo="Tu periodo de prueba terminó"
          mensaje={correo ? `¿Dudas? Escríbenos a ${correo}` : "¿Dudas? Escríbenos."}
        />
        {correo ? (
          <Boton
            titulo="ESCRIBIR A SOPORTE"
            ayuda="Abre tu correo para escribirnos"
            variante="secundario"
            onPress={() => void Linking.openURL(`mailto:${correo}`)}
          />
        ) : null}
      </Pantalla>
    );
  }

  return (
    <Pantalla
      cabecera={{ onSalir: salir }}
      pie={<PanelTabBar pestanas={PESTANAS} activa={pestana} onCambiar={setPestana} />}
    >
      {pestana === "PLANES" ? <ElegirPlan suscripcion={suscripcion} /> : miNegocio}
    </Pantalla>
  );
}
