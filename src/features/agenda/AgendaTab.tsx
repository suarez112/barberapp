import { View } from "react-native";
import SelectorDias from "@/components/ui/SelectorDias";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { Barbero, Dia } from "@/types";
import { horaAMinutos } from "@/utils/disponibilidad";
import { mesCorto } from "@/utils/fechas";
import { useNegocio } from "../negocio/NegocioProvider";
import { Personal } from "../sesion/usePersonal";
import { useAgenda } from "./AgendaProvider";
import TarjetaCita from "./components/TarjetaCita";
import { useAccionesCita } from "./useAccionesCita";

type Props = {
  profesional: Barbero;
  personal: Personal;
  dia: Dia;
  onCambiarDia: (d: Dia) => void;
};

// Citas del profesional para el día elegido, en orden de hora
export default function AgendaTab({ profesional, personal, dia, onCambiarDia }: Props) {
  const { citas } = useAgenda();
  const { empresa } = useNegocio();
  const { completar, cancelar, puedeCompletar } = useAccionesCita(personal);

  const citasDelDia = citas
    .filter(
      (c) =>
        c.barberoId === profesional.id &&
        c.empresaId === empresa?.id &&
        c.fecha === dia.fechaFull,
    )
    .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));

  return (
    <View>
      <TituloSeccion>SELECCIONA EL DÍA A CONSULTAR</TituloSeccion>
      <SelectorDias seleccionado={dia} onSeleccionar={onCambiarDia} />

      <TituloSeccion>
        CITAS DE {profesional.nombre.toUpperCase()} PARA EL {dia.diaNom}{" "}
        {dia.num} {mesCorto(dia.fechaFull)} ({citasDelDia.length})
      </TituloSeccion>

      {citasDelDia.length === 0 ? (
        <TextoInfo>No hay citas agendadas para esta fecha.</TextoInfo>
      ) : (
        citasDelDia.map((c) => (
          <TarjetaCita
            key={c.id}
            cita={c}
            puedeCompletar={puedeCompletar(c)}
            esAdmin={personal.esAdmin}
            onCompletar={completar}
            onCancelar={cancelar}
          />
        ))
      )}
    </View>
  );
}
