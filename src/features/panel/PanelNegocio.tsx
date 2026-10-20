import { ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import PantallaAviso from "@/components/ui/PantallaAviso";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Dia } from "@/types";
import { avisar } from "@/utils/dialogos";
import { crearDia, diaDeHoy } from "@/utils/fechas";
import AgendaTab from "../agenda/AgendaTab";
import { useAgenda } from "../agenda/AgendaProvider";
import BloqueoSemanal from "../bloqueos/BloqueoSemanal";
import CarteraPanel from "../cartera/CarteraPanel";
import ClientesTab from "../clientes/ClientesTab";
import { Suscripcion } from "../cuenta/api";
import { useNegocio } from "../negocio/NegocioProvider";
import { useNotificaciones } from "../notificaciones/NotificacionesProvider";
import { Personal } from "../sesion/usePersonal";
import { useCerrarSesion } from "../sesion/useCerrarSesion";
import NegocioTab from "./NegocioTab";
import PanelTabBar, { Pestana, PestanaPanel } from "./components/PanelTabBar";
import PerfilBadge from "./components/PerfilBadge";
import SelectorSupervision from "./components/SelectorSupervision";
import { useCargarPanel } from "./useCargarPanel";
import { useSalirDelPanel } from "./useSalirDelPanel";

type Props = {
  personal: Personal;
  // Contenido fijo arriba (ej. aviso de días de prueba)
  encabezado?: ReactNode;
  // Pestaña "Mi negocio" (solo administradores)
  miNegocio?: ReactNode;
  // Administradores: el backend respondió 402 (la suscripción venció con la app abierta)
  onSuscripcionVencida?: () => void;
  // Administradores: plan y cupo del equipo; onEquipoCambiado lo vuelve a consultar
  suscripcion?: Suscripcion | null;
  onEquipoCambiado?: () => void;
};

const PESTANA_AGENDA: Pestana = { id: "AGENDAMIENTOS", icono: "list", label: "Agenda" };
const PESTANA_BLOQUEOS: Pestana = { id: "BLOQUEOS", icono: "calendar-outline", label: "Bloqueos" };
const PESTANA_CLIENTES: Pestana = { id: "CLIENTES", icono: "people-outline", label: "Clientes" };
const PESTANA_CARTERA: Pestana = { id: "CARTERA", icono: "wallet-outline", label: "Cartera" };
const PESTANA_NEGOCIO: Pestana = { id: "NEGOCIO", icono: "storefront-outline", label: "Equipo" };
const PESTANA_MI_NEGOCIO: Pestana = { id: "MI_NEGOCIO", icono: "business-outline", label: "Mi negocio" };

// Panel del negocio: agenda, bloqueos, clientes, cartera y administración.
// Lo usan el personal (/panel) y la cuenta del administrador (/admin).
export default function PanelNegocio({
  personal,
  encabezado,
  miNegocio,
  onSuscripcionVencida,
  suscripcion = null,
  onEquipoCambiado,
}: Props) {
  const { colors } = useAppTheme();
  const { empresa, barberos } = useNegocio();
  const cerrarSesion = useCerrarSesion();
  const salir = useSalirDelPanel();
  const { cargando, error, inactivo, recargar } = useCargarPanel(personal.token);
  const [pestana, setPestana] = useState<PestanaPanel>("AGENDAMIENTOS");
  // Se guarda aquí para conservar el día elegido al cambiar de pestaña
  const [diaAgenda, setDiaAgenda] = useState<Dia>(diaDeHoy);
  const [supervisadoId, setSupervisadoId] = useState<string | null>(null);
  // Cita que se abrió desde una notificación (se muestra resaltada)
  const [citaResaltadaId, setCitaResaltadaId] = useState<string | null>(null);
  const { citas } = useAgenda();
  const { citaPendiente, limpiarCitaPendiente } = useNotificaciones();
  const citaYaRecargada = useRef<string | null>(null);

  // Al tocar una notificación: va a la agenda, al día y al profesional de esa cita.
  // Si la cita es nueva y todavía no está en la agenda, se recarga una vez.
  /* eslint-disable react-hooks/set-state-in-effect -- responde a un evento externo (la notificación tocada) */
  useEffect(() => {
    if (!citaPendiente || !empresa || cargando) return;
    const cita = citas.find((c) => c.id === citaPendiente);
    if (cita) {
      setPestana("AGENDAMIENTOS");
      setDiaAgenda(crearDia(cita.fecha));
      setSupervisadoId(cita.barberoId);
      setCitaResaltadaId(cita.id);
      limpiarCitaPendiente();
    } else if (citaYaRecargada.current !== citaPendiente) {
      citaYaRecargada.current = citaPendiente;
      recargar();
    } else {
      limpiarCitaPendiente();
      avisar("Cita no encontrada", "No encontramos esa cita en tu agenda. Puede que ya no exista.", "aviso");
    }
    // recargar y limpiarCitaPendiente cambian en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citaPendiente, citas, empresa, cargando]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Un administrador pasa a la pantalla de planes; un empleado ve el aviso de abajo
  useEffect(() => {
    if (inactivo) onSuscripcionVencida?.();
    // Solo cuando llega el 402
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inactivo]);

  // Los datos del integrante vienen frescos del servidor (ej. si cambió su rol)
  const yo = personal.barbero
    ? (barberos.find((b) => b.id === personal.barbero?.id) ?? personal.barbero)
    : null;
  const esAdmin = yo ? yo.esAdmin : personal.esAdmin;
  // El admin elige de quién ver agenda y bloqueos; un integrante ve lo suyo
  const profesional = esAdmin
    ? (barberos.find((b) => b.id === supervisadoId) ?? yo ?? barberos[0] ?? null)
    : yo;

  // Todos los administradores (cuenta o integrante) ven las mismas pestañas;
  // un empleado solo su agenda y su cartera.
  const pestanas = esAdmin
    ? [
        PESTANA_AGENDA,
        PESTANA_BLOQUEOS,
        PESTANA_CLIENTES,
        PESTANA_CARTERA,
        PESTANA_NEGOCIO,
        ...(miNegocio ? [PESTANA_MI_NEGOCIO] : []),
      ]
    : [PESTANA_AGENDA, PESTANA_CARTERA];
  const activa = pestanas.some((p) => p.id === pestana) ? pestana : "AGENDAMIENTOS";

  const sinProfesionales = (
    <TextoInfo>
      Aún no hay profesionales en el equipo. Agrégalos en la pestaña Equipo.
    </TextoInfo>
  );

  const contenido = () => {
    if (!empresa) {
      return cargando ? (
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      ) : (
        <View>
          <TextoInfo>{error ?? "No se pudieron cargar los datos del negocio."}</TextoInfo>
          <Boton
            titulo="REINTENTAR"
            ayuda="Vuelve a cargar el panel"
            variante="neutro"
            onPress={recargar}
          />
        </View>
      );
    }

    switch (activa) {
      case "AGENDAMIENTOS":
        return profesional ? (
          <AgendaTab
            profesional={profesional}
            personal={personal}
            dia={diaAgenda}
            onCambiarDia={(d) => {
              setDiaAgenda(d);
              setCitaResaltadaId(null);
            }}
            citaResaltadaId={citaResaltadaId}
          />
        ) : (
          sinProfesionales
        );
      case "BLOQUEOS":
        return profesional ? (
          <BloqueoSemanal
            key={profesional.id}
            token={personal.token}
            esAdmin={esAdmin}
            profesional={profesional}
            apertura={empresa.horarioApertura}
            cierre={empresa.horarioCierre}
            horario={empresa.horario}
          />
        ) : (
          sinProfesionales
        );
      case "CLIENTES":
        return <ClientesTab token={personal.token} />;
      case "CARTERA":
        return (
          <CarteraPanel token={personal.token} esAdmin={esAdmin} />
        );
      case "NEGOCIO":
        return (
          <NegocioTab
            personal={personal}
            suscripcion={suscripcion}
            onEquipoCambiado={onEquipoCambiado}
          />
        );
      case "MI_NEGOCIO":
        return miNegocio;
    }
  };

  if (inactivo && !onSuscripcionVencida) {
    return (
      <Pantalla cabecera={{ onSalir: salir }}>
        <PantallaAviso icono="storefront-outline" titulo="Negocio inactivo" mensaje={inactivo}>
          <Boton
            titulo="CERRAR SESIÓN"
            ayuda="Sale de tu cuenta en este celular"
            variante="neutro"
            onPress={cerrarSesion}
            style={styles.botonAviso}
          />
        </PantallaAviso>
      </Pantalla>
    );
  }

  const conSupervision =
    esAdmin && barberos.length > 0 && (activa === "AGENDAMIENTOS" || activa === "BLOQUEOS");

  return (
    <Pantalla
      cabecera={{ onSalir: salir }}
      pie={<PanelTabBar pestanas={pestanas} activa={activa} onCambiar={setPestana} />}
    >
      <View>
        {empresa ? (
          <PerfilBadge
            nombre={yo?.nombre ?? personal.nombre}
            esAdmin={esAdmin}
            esCuentaAdmin={personal.esCuentaAdmin}
            porcentaje={yo?.porcentajeGanancia}
            empresa={empresa}
          />
        ) : null}
        {encabezado}

        {conSupervision && profesional ? (
          <SelectorSupervision
            barberos={barberos}
            seleccionadoId={profesional.id}
            onSeleccionar={(b) => setSupervisadoId(b.id)}
          />
        ) : null}

        {contenido()}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  cargando: { marginTop: 30 },
  botonAviso: { marginTop: 24, alignSelf: "stretch" },
});
