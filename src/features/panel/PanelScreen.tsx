import { Redirect } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import { DIAS } from "@/data/datos";
import { Dia } from "@/types";
import { confirmar } from "@/utils/dialogos";
import { hoyISO } from "@/utils/fechas";
import AgendaTab from "../agenda/AgendaTab";
import { useAgenda } from "../agenda/AgendaProvider";
import BloqueoSemanal from "../bloqueos/BloqueoSemanal";
import CarteraPanel from "../cartera/CarteraPanel";
import ClientesTab from "../clientes/ClientesTab";
import { useNegocio } from "../negocio/NegocioProvider";
import { useSesion } from "../sesion/SesionProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import NegocioTab from "./NegocioTab";
import PanelTabBar, { PestanaPanel } from "./components/PanelTabBar";
import PerfilBadge from "./components/PerfilBadge";
import SelectorSupervision from "./components/SelectorSupervision";

const diaDeHoy = () => DIAS.find((d) => d.fechaFull === hoyISO()) ?? DIAS[7];

// Panel del integrante / administrador
export default function PanelScreen() {
  const { colors } = useAppTheme();
  const { barbero, profesionalActivo, supervisar, cerrarSesion } = useSesion();
  const { empresa, barberos } = useNegocio();
  const { citas, setCitas, bloqueos, setBloqueos } = useAgenda();
  const [pestana, setPestana] = useState<PestanaPanel>("AGENDAMIENTOS");
  // Se guarda aquí para conservar el día elegido al cambiar de pestaña
  const [diaAgenda, setDiaAgenda] = useState<Dia>(diaDeHoy);

  // Sin sesión (o al cerrarla) se vuelve al ingreso
  if (!barbero || !empresa || !profesionalActivo) return <Redirect href="/login" />;

  const salir = async () => {
    const ok = await confirmar({
      titulo: "Cerrar Sesión",
      mensaje: "¿Deseas salir del sistema?",
      textoConfirmar: "Cerrar Sesión",
      destructivo: true,
      mensajeWeb:
        "¿Deseas cerrar sesión? Se enviará a la pantalla de credenciales.",
    });
    if (!ok) return;
    cerrarSesion();
    setCitas([]);
  };

  const citasDelProfesional = citas.filter(
    (c) => c.barberoId === profesionalActivo.id && c.empresaId === empresa.id,
  );

  return (
    <Pantalla
      cabecera={{ onSalir: salir }}
      pie={
        <PanelTabBar
          activa={pestana}
          esAdmin={barbero.esAdmin}
          onCambiar={setPestana}
        />
      }
    >
      <View>
        <PerfilBadge barbero={barbero} empresa={empresa} />

        {barbero.esAdmin ? (
          <SelectorSupervision
            barberos={barberos}
            seleccionadoId={profesionalActivo.id}
            onSeleccionar={supervisar}
          />
        ) : null}

        {pestana === "AGENDAMIENTOS" ? (
          <AgendaTab
            profesional={profesionalActivo}
            dia={diaAgenda}
            onCambiarDia={setDiaAgenda}
          />
        ) : null}

        {pestana === "BLOQUEOS" && barbero.esAdmin ? (
          <BloqueoSemanal
            colors={colors}
            barberoId={profesionalActivo.id}
            barberoNombre={profesionalActivo.nombre}
            bloqueos={bloqueos}
            setBloqueos={setBloqueos}
            citas={citas}
            apertura={empresa.horarioApertura}
            cierre={empresa.horarioCierre}
          />
        ) : null}

        {pestana === "CLIENTES" ? <ClientesTab esAdmin={barbero.esAdmin} /> : null}

        {pestana === "CARTERA" ? (
          <CarteraPanel
            colors={colors}
            nombre={profesionalActivo.nombre}
            porcentaje={profesionalActivo.porcentajeGanancia}
            citas={citasDelProfesional}
          />
        ) : null}

        {pestana === "NEGOCIO" && barbero.esAdmin ? <NegocioTab /> : null}
      </View>
    </Pantalla>
  );
}
