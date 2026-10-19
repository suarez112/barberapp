import { useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import { ActivityIndicator, BackHandler, StyleSheet, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Dia } from "@/types";
import { confirmar } from "@/utils/dialogos";
import { diaDeHoy } from "@/utils/fechas";
import AgendaTab from "../agenda/AgendaTab";
import BloqueoSemanal from "../bloqueos/BloqueoSemanal";
import CarteraPanel from "../cartera/CarteraPanel";
import ClientesTab from "../clientes/ClientesTab";
import { useNegocio } from "../negocio/NegocioProvider";
import { Personal } from "../sesion/usePersonal";
import { useCerrarSesion } from "../sesion/useCerrarSesion";
import NegocioTab from "./NegocioTab";
import PanelTabBar, { Pestana, PestanaPanel } from "./components/PanelTabBar";
import PerfilBadge from "./components/PerfilBadge";
import SelectorSupervision from "./components/SelectorSupervision";
import { useCargarPanel } from "./useCargarPanel";

type Props = {
  personal: Personal;
  // Contenido fijo arriba (ej. aviso de días de prueba)
  encabezado?: ReactNode;
  // Pestaña "Mi negocio" de la cuenta del administrador
  miNegocio?: ReactNode;
};

const PESTANA_AGENDA: Pestana = { id: "AGENDAMIENTOS", icono: "list", label: "Agenda" };
const PESTANA_BLOQUEOS: Pestana = { id: "BLOQUEOS", icono: "calendar-outline", label: "Bloqueos" };
const PESTANA_CLIENTES: Pestana = { id: "CLIENTES", icono: "people-outline", label: "Clientes" };
const PESTANA_CARTERA: Pestana = { id: "CARTERA", icono: "wallet-outline", label: "Cartera" };
const PESTANA_NEGOCIO: Pestana = { id: "NEGOCIO", icono: "storefront-outline", label: "Equipo" };
const PESTANA_MI_NEGOCIO: Pestana = { id: "MI_NEGOCIO", icono: "business-outline", label: "Mi negocio" };

// Panel del negocio: agenda, bloqueos, clientes, cartera y administración.
// Lo usan el personal (/panel) y la cuenta del administrador (/admin).
export default function PanelNegocio({ personal, encabezado, miNegocio }: Props) {
  const { colors } = useAppTheme();
  const { empresa, barberos } = useNegocio();
  const cerrarSesion = useCerrarSesion();
  const { cargando, error, recargar } = useCargarPanel(personal.token);
  const [pestana, setPestana] = useState<PestanaPanel>("AGENDAMIENTOS");
  // Se guarda aquí para conservar el día elegido al cambiar de pestaña
  const [diaAgenda, setDiaAgenda] = useState<Dia>(diaDeHoy);
  const [supervisadoId, setSupervisadoId] = useState<string | null>(null);

  const salir = useCallback(async () => {
    const ok = await confirmar({
      titulo: "Cerrar sesión",
      mensaje: "¿Deseas salir? Tendrás que volver a iniciar sesión.",
      textoConfirmar: "Cerrar sesión",
      destructivo: true,
    });
    if (ok) cerrarSesion();
  }, [cerrarSesion]);

  // El botón atrás de Android no saca del panel con la sesión abierta: pide cerrarla
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        salir();
        return true;
      });
      return () => sub.remove();
    }, [salir]),
  );

  // Los datos del integrante vienen frescos del servidor (ej. si cambió su rol)
  const yo = personal.barbero
    ? (barberos.find((b) => b.id === personal.barbero?.id) ?? personal.barbero)
    : null;
  const esAdmin = yo ? yo.esAdmin : personal.esAdmin;
  // El admin elige de quién ver agenda y bloqueos; un integrante ve lo suyo
  const profesional = esAdmin
    ? (barberos.find((b) => b.id === supervisadoId) ?? yo ?? barberos[0] ?? null)
    : yo;

  const pestanas = [
    PESTANA_AGENDA,
    PESTANA_BLOQUEOS,
    ...(esAdmin ? [PESTANA_CLIENTES] : []),
    PESTANA_CARTERA,
    ...(esAdmin ? [PESTANA_NEGOCIO] : []),
    ...(miNegocio ? [PESTANA_MI_NEGOCIO] : []),
  ];
  const activa = pestanas.some((p) => p.id === pestana) ? pestana : "AGENDAMIENTOS";

  const sinProfesionales = (
    <TextoInfo>
      Aún no hay profesionales en el equipo. Agrégalos en la pestaña Equipo.
    </TextoInfo>
  );

  const contenido = () => {
    if (!empresa) {
      return cargando ? (
        <ActivityIndicator color={colors.primary} style={styles.cargando} />
      ) : (
        <View>
          <TextoInfo>{error ?? "No se pudieron cargar los datos del negocio."}</TextoInfo>
          <Boton titulo="REINTENTAR" variante="neutro" onPress={recargar} />
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
            onCambiarDia={setDiaAgenda}
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
          />
        ) : (
          sinProfesionales
        );
      case "CLIENTES":
        return <ClientesTab token={personal.token} />;
      case "CARTERA":
        return <CarteraPanel token={personal.token} esAdmin={esAdmin} />;
      case "NEGOCIO":
        return <NegocioTab personal={personal} />;
      case "MI_NEGOCIO":
        return miNegocio;
    }
  };

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
});
