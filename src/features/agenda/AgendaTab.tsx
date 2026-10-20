import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Chips from "@/components/ui/Chips";
import SelectorDias from "@/components/ui/SelectorDias";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Barbero, Dia, EstadoCita } from "@/types";
import { horaAMinutos } from "@/utils/disponibilidad";
import { fechaConDia } from "@/utils/fechas";
import { useNegocio } from "../negocio/NegocioProvider";
import { Personal } from "../sesion/usePersonal";
import { useAgenda } from "./AgendaProvider";
import TarjetaCita, { ESTADO_CITA } from "./components/TarjetaCita";
import { useAccionesCita } from "./useAccionesCita";

type Filtro = "todas" | EstadoCita;

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "CONFIRMADA", label: "Pendientes" },
  { id: "COMPLETADA", label: "Completadas" },
  { id: "CANCELADA", label: "Canceladas" },
] as const;

const MENSAJE_VACIO: Record<Filtro, string> = {
  todas: "No hay citas agendadas para esta fecha.",
  CONFIRMADA: "No hay citas pendientes para esta fecha.",
  COMPLETADA: "No hay citas completadas para esta fecha.",
  CANCELADA: "No hay citas canceladas para esta fecha.",
};

type Props = {
  profesional: Barbero;
  personal: Personal;
  dia: Dia;
  onCambiarDia: (d: Dia) => void;
  // Cita abierta desde una notificación: se muestra resaltada
  citaResaltadaId?: string | null;
};

// Citas del profesional para el día elegido, en orden de hora
export default function AgendaTab({
  profesional,
  personal,
  dia,
  onCambiarDia,
  citaResaltadaId = null,
}: Props) {
  const { citas } = useAgenda();
  const { empresa } = useNegocio();
  const { completar, cancelar, puedeCompletar } = useAccionesCita(personal);
  const { colors } = useAppTheme();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  // "Pendientes" en azul, como la etiqueta de la cita (distinto del rojo y el verde)
  const filtros = FILTROS.map((f) =>
    f.id === "CONFIRMADA"
      ? { ...f, color: ESTADO_CITA.CONFIRMADA.color, bordeInactiva: colors.infoTexto }
      : f,
  );

  // Una cita abierta desde una notificación no debe quedar oculta por un filtro
  const [resaltadaVista, setResaltadaVista] = useState(citaResaltadaId);
  if (resaltadaVista !== citaResaltadaId) {
    setResaltadaVista(citaResaltadaId);
    if (citaResaltadaId) setFiltro("todas");
  }

  const citasDelDia = citas
    .filter(
      (c) =>
        c.barberoId === profesional.id &&
        c.empresaId === empresa?.id &&
        c.fecha === dia.fechaFull,
    )
    .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));
  const visibles =
    filtro === "todas" ? citasDelDia : citasDelDia.filter((c) => c.estado === filtro);
  const contar = (e: EstadoCita) => citasDelDia.filter((c) => c.estado === e).length;

  return (
    <View>
      <TituloSeccion>SELECCIONA EL DÍA A CONSULTAR</TituloSeccion>
      <SelectorDias seleccionado={dia} onSeleccionar={onCambiarDia} />

      <TituloSeccion>
        {profesional.nombre.toUpperCase()} · {fechaConDia(dia.fechaFull)}
      </TituloSeccion>

      <View style={styles.resumen}>
        <Dato titulo="Citas" valor={citasDelDia.length - contar("CANCELADA")} />
        <Dato
          titulo="Completadas"
          valor={contar("COMPLETADA")}
          color={ESTADO_CITA.COMPLETADA.color}
        />
        <Dato
          titulo="Pendientes"
          valor={contar("CONFIRMADA")}
          color={ESTADO_CITA.CONFIRMADA.color}
        />
      </View>

      <Chips opciones={filtros}valor={filtro} onCambiar={setFiltro} />

      {visibles.length === 0 ? (
        <TextoInfo>{MENSAJE_VACIO[filtro]}</TextoInfo>
      ) : (
        visibles.map((c) => (
          <TarjetaCita
            key={c.id}
            cita={c}
            resaltada={c.id === citaResaltadaId}
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

function Dato({ titulo, valor, color }: { titulo: string; valor: number; color?: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[styles.dato, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
      accessible
      accessibilityLabel={`${titulo}: ${valor}`}
    >
      {color ? <View style={[styles.punto, { backgroundColor: color }]} /> : null}
      <Text style={[styles.valor, { color: colors.textPrimary }]}>{valor}</Text>
      <Text style={[styles.titulo, { color: colors.textSecondary }]}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  resumen: { flexDirection: "row", gap: 8 },
  dato: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  punto: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  valor: { fontSize: 22, fontWeight: "bold" },
  titulo: { fontSize: 12 },
});
