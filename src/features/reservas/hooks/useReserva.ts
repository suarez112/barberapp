import { useState } from "react";
import { INDICATIVO_POR_DEFECTO } from "@/data/paises";
import { crearCita } from "@/features/agenda/api";
import { useAgenda } from "@/features/agenda/AgendaProvider";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import { ACEPTACION } from "@/features/legal/api";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { describirError, esEstado, registrarCausa } from "@/services/api/errores";
import { ApiError, mensajeDeError } from "@/services/api/http";
import { Barbero, Dia, Servicio } from "@/types";
import { avisar } from "@/utils/dialogos";
import {
  duracionEnMinutos,
  obtenerHorariosDisponibles,
} from "@/utils/disponibilidad";
import {
  crearDia,
  DIAS_MAXIMOS_RESERVA,
  hoyColombiaISO,
  sumarDias,
} from "@/utils/fechas";
import { DatosConfirmacion } from "../components/ConfirmacionCita";
import { useTelefono } from "./useTelefono";

// 400 de POST /citas cuando falta aceptar los documentos: un cliente con cuenta
// después de publicarse una versión nueva (o con la sesión vencida, que el
// backend toma como invitado)
const pideAceptarDocumentos = (error: unknown) =>
  error instanceof ApiError &&
  error.status === 400 &&
  (error.message.startsWith("Publicamos una nueva versión") ||
    error.message.startsWith("Debes aceptar la Política"));

// Estado y reglas del formulario de reserva del cliente
export function useReserva() {
  const { empresa, servicios } = useNegocio();
  const { citas, citasOcupadas, bloqueos, agregarCita, cargarOcupacion } =
    useAgenda();
  const { usuario, token, actualizarUsuario } = useCuenta();

  // Cliente con sesión: reserva con los datos de su cuenta (el backend ignora
  // los del formulario). Una cuenta sin esos datos los escribe como invitado.
  const cliente = usuario?.rol === "cliente" ? usuario : null;
  const datosCuenta =
    cliente?.nombre && cliente.telefono
      ? {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          indicativo: cliente.indicativo ?? INDICATIVO_POR_DEFECTO,
        }
      : null;
  // Un cliente que ya aceptó no ve la casilla, salvo que haya una versión nueva
  const pedirAutorizacion = !cliente || cliente.debeAceptarDocumentos === true;

  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [dia, setDia] = useState<Dia>(() => crearDia(hoyColombiaISO()));
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const tel = useTelefono();
  // La casilla de autorización empieza sin marcar
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [confirmacion, setConfirmacion] = useState<DatosConfirmacion | null>(
    null,
  );

  // Solo de hoy a 14 días después (hora de Colombia, como el backend)
  const primerDia = hoyColombiaISO();
  const ultimoDia = sumarDias(primerDia, DIAS_MAXIMOS_RESERVA);

  const horariosDisponibles =
    barbero && servicio && empresa
      ? obtenerHorariosDisponibles({
          empresa,
          barberoId: barbero.id,
          servicio,
          fecha: dia.fechaFull,
          citas: [...citas, ...citasOcupadas],
          bloqueos,
          duracionMinimaServicios: servicios.length
            ? Math.min(...servicios.map((s) => duracionEnMinutos(s.duracion)))
            : undefined,
        })
      : [];

  // Cambiar profesional, servicio o día invalida la hora elegida
  const elegirBarbero = (b: Barbero) => {
    setBarbero(b);
    setHora("");
  };
  const elegirServicio = (s: Servicio) => {
    setServicio(s);
    setHora("");
  };
  const elegirDia = (d: Dia) => {
    setDia(d);
    setHora("");
  };

  const limpiarFormulario = () => {
    setBarbero(null);
    setServicio(null);
    setHora("");
    setNombre("");
    tel.limpiar();
    setAceptaDatos(false);
  };

  const agendar = async () => {
    const datos = datosCuenta ?? {
      nombre: nombre.trim(),
      telefono: tel.telefono.trim(),
      indicativo: tel.indicativo,
    };

    const faltantes: string[] = [];
    if (!barbero) faltantes.push("Seleccionar Profesional");
    if (!servicio) faltantes.push("Seleccionar un Servicio");
    if (!hora) faltantes.push("Seleccionar la Hora de la cita");
    if (!datos.telefono) faltantes.push("Escribir tu Teléfono / Celular");
    if (!datos.nombre) faltantes.push("Escribir tu Nombre Completo");
    if (pedirAutorizacion && !aceptaDatos)
      faltantes.push("Autorizar el tratamiento de tus datos y aceptar los Términos y Condiciones");

    if (faltantes.length > 0 || !barbero || !servicio || !empresa) {
      avisar(
        "Paso Incompleto",
        `Para completar tu reserva te falta:\n\n• ${faltantes.join("\n• ")}`,
      );
      return;
    }

    if (!horariosDisponibles.includes(hora)) {
      avisar(
        "Hora no disponible",
        "Esa hora acaba de ocuparse. Por favor elige otra.",
      );
      setHora("");
      return;
    }

    try {
      const { cita } = await crearCita(
        {
          empresaId: empresa.id,
          barberoId: barbero.id,
          servicioId: servicio.id,
          fecha: dia.fechaFull,
          hora,
          ...datos,
          // Solo cuando se mostró la casilla (y la persona la marcó)
          ...(pedirAutorizacion ? ACEPTACION : {}),
        },
        // Con sesión de cliente la cita queda en "Mis citas"
        cliente ? token : undefined,
      );
      agregarCita(cita);
      if (cliente?.debeAceptarDocumentos) actualizarUsuario({ debeAceptarDocumentos: false });
    } catch (error) {
      registrarCausa("Error al agendar:", error);
      // Se publicó una versión nueva de los documentos: aparece la casilla
      if (cliente && pideAceptarDocumentos(error)) {
        actualizarUsuario({ debeAceptarDocumentos: true });
        setAceptaDatos(false);
        avisar(
          "Documentos actualizados",
          mensajeDeError(
            error,
            "Publicamos una nueva versión de la Política de Tratamiento de Datos o de los Términos y Condiciones. Acéptala para continuar.",
          ),
        );
        return;
      }
      // 403: el teléfono está en la lista negra o el negocio no está recibiendo reservas.
      // 409: la hora se ocupó o el profesional no atiende en ese horario.
      const aviso = describirError(error, {
        titulo: "No se pudo agendar",
        porDefecto: "Intenta de nuevo.",
        tituloConflicto: "Horario no disponible",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
      if (esEstado(error, 409)) {
        setHora("");
        cargarOcupacion(empresa.id);
      }
      return;
    }

    setConfirmacion({
      negocio: empresa.nombre,
      profesional: barbero.nombre,
      foto: barbero.foto,
      servicio: servicio.nombre,
      duracionMin: duracionEnMinutos(servicio.duracion),
      precio: servicio.precio,
      fecha: dia.fechaFull,
      hora,
    });

    limpiarFormulario();
  };

  return {
    barbero,
    servicio,
    dia,
    hora,
    nombre,
    celular: tel.telefono,
    indicativo: tel.indicativo,
    datosCuenta,
    pedirAutorizacion,
    aceptaDatos,
    confirmacion,
    primerDia,
    ultimoDia,
    horariosDisponibles,
    elegirBarbero,
    elegirServicio,
    elegirDia,
    elegirHora: setHora,
    setNombre,
    cambiarTelefono: tel.cambiarTelefono,
    elegirPais: tel.elegirPais,
    setAceptaDatos,
    cerrarConfirmacion: () => setConfirmacion(null),
    agendar,
  };
}

export type EstadoReserva = ReturnType<typeof useReserva>;
