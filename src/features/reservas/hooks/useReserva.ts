import { useCallback, useEffect, useState } from "react";
import { consultarDisponibilidad, crearCita, HoraDisponible } from "@/features/agenda/api";
import { useAgenda } from "@/features/agenda/AgendaProvider";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import { ACEPTACION } from "@/features/legal/api";
import { MENSAJE_AUTORIZACION } from "@/features/legal/CasillaAutorizacion";
import { useTelefono } from "@/hooks/useTelefono";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { describirError, esEstado, registrarCausa } from "@/services/api/errores";
import { ApiError, esCancelada, mensajeDeError } from "@/services/api/http";
import { Barbero, Dia, Servicio } from "@/types";
import { avisar } from "@/utils/dialogos";
import { duracionEnMinutos } from "@/utils/disponibilidad";
import {
  crearDia,
  DIAS_MAXIMOS_RESERVA,
  hoyColombiaISO,
  sumarDias,
} from "@/utils/fechas";
import { indicativoDe, PAIS_POR_DEFECTO } from "@/utils/telefonos";
import { DatosConfirmacion } from "../components/ConfirmacionCita";

// 400 de POST /citas cuando falta aceptar los documentos: un cliente con cuenta
// después de publicarse una versión nueva (o con la sesión vencida, que el
// backend toma como invitado)
const pideAceptarDocumentos = (error: unknown) =>
  error instanceof ApiError &&
  error.status === 400 &&
  (error.message.startsWith("Publicamos una nueva versión") ||
    error.message.startsWith("Debes aceptar la Política"));

const HORA_OCUPADA = "Esa hora acaba de ocuparse, elige otra";

// Estado y reglas del formulario de reserva del cliente
export function useReserva() {
  const { empresa } = useNegocio();
  const { agregarCita } = useAgenda();
  const { usuario, token, actualizarUsuario } = useCuenta();

  // Cliente con sesión: reserva con los datos de su cuenta (el backend ignora
  // los del formulario). Una cuenta sin esos datos los escribe como invitado.
  const cliente = usuario?.rol === "cliente" ? usuario : null;
  const datosCuenta =
    cliente?.nombre && cliente.telefono
      ? {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          indicativo: cliente.indicativo ?? indicativoDe(PAIS_POR_DEFECTO),
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
  // Qué corregir, debajo de cada campo
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorAutorizacion, setErrorAutorizacion] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<DatosConfirmacion | null>(
    null,
  );

  // Solo de hoy a 14 días después (hora de Colombia, como el backend)
  const primerDia = hoyColombiaISO();
  const ultimoDia = sumarDias(primerDia, DIAS_MAXIMOS_RESERVA);

  // Horas libres: las calcula el backend para este profesional, servicio y día.
  // Se guarda con la consulta que las pidió: si no coincide con la actual, aún carga.
  const [resultado, setResultado] = useState<{
    clave: string;
    horas: HoraDisponible[];
    error: string | null;
  } | null>(null);
  const [intentoHoras, setIntentoHoras] = useState(0);

  const empresaId = empresa?.id;
  const barberoId = barbero?.id;
  const servicioId = servicio?.id;
  const fecha = dia.fechaFull;
  const clave = `${empresaId}|${barberoId}|${servicioId}|${fecha}|${intentoHoras}`;
  const hayConsulta = !!(empresaId && barbero && servicio);
  const cargandoHoras = hayConsulta && resultado?.clave !== clave;
  const horariosDisponibles = hayConsulta && !cargandoHoras ? (resultado?.horas ?? []) : [];
  const errorHoras = hayConsulta && !cargandoHoras ? (resultado?.error ?? null) : null;

  useEffect(() => {
    if (!empresaId || !barberoId || !servicioId) return;
    const control = new AbortController();
    consultarDisponibilidad({ empresaId, barberoId, servicioId, fecha }, control.signal)
      .then((r) => setResultado({ clave, horas: r.horas, error: null }))
      .catch((error) => {
        if (esCancelada(error)) return;
        registrarCausa("Horas disponibles:", error);
        setResultado({
          clave,
          horas: [],
          error: describirError(error, {
            titulo: "",
            porDefecto: "No se pudieron cargar las horas.",
          }).mensaje,
        });
      });
    return () => control.abort();
  }, [empresaId, barberoId, servicioId, fecha, clave]);

  const recargarHoras = useCallback(() => setIntentoHoras((n) => n + 1), []);

  // Cambiar profesional, servicio o día invalida la hora elegida
  const elegirBarbero = (b: Barbero) => {
    // Tocar el profesional elegido lo deselecciona
    setBarbero((actual) => (actual?.id === b.id ? null : b));
    setHora("");
  };
  const elegirServicio = (s: Servicio) => {
    setServicio((actual) => (actual?.id === s.id ? null : s));
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
    setErrorNombre(null);
    setErrorAutorizacion(null);
  };

  const cambiarNombre = (texto: string) => {
    setNombre(texto);
    setErrorNombre(null);
  };

  const cambiarAceptaDatos = (acepta: boolean) => {
    setAceptaDatos(acepta);
    if (acepta) setErrorAutorizacion(null);
  };

  const agendar = async () => {
    const faltantes: string[] = [];
    if (!barbero) faltantes.push("Seleccionar Profesional");
    if (!servicio) faltantes.push("Seleccionar un Servicio");
    if (!hora) faltantes.push("Seleccionar la Hora de la cita");

    // Invitado: el teléfono se envía en E.164, validado como en el backend
    let datos = datosCuenta;
    if (!datosCuenta) {
      const telefono = tel.validar();
      const nombreLimpio = nombre.trim();
      setErrorNombre(nombreLimpio ? null : "Escribe tu nombre completo.");
      if (telefono && nombreLimpio) datos = { nombre: nombreLimpio, ...telefono };
      else faltantes.push("Corregir tus datos (marcados en rojo)");
    }
    const faltaAutorizacion = pedirAutorizacion && !aceptaDatos;
    setErrorAutorizacion(faltaAutorizacion ? MENSAJE_AUTORIZACION : null);
    if (faltaAutorizacion)
      faltantes.push("Autorizar el tratamiento de tus datos y aceptar los Términos y Condiciones");

    if (faltantes.length > 0 || !barbero || !servicio || !empresa || !datos) {
      avisar(
        "Paso Incompleto",
        `Para completar tu reserva te falta:\n\n• ${faltantes.join("\n• ")}`,
      );
      return;
    }

    // Antes de confirmar se vuelve a consultar: otra persona pudo tomar la hora
    try {
      const { horas } = await consultarDisponibilidad({
        empresaId: empresa.id,
        barberoId: barbero.id,
        servicioId: servicio.id,
        fecha: dia.fechaFull,
      });
      setResultado({ clave, horas, error: null });
      if (!horas.some((h) => h.hora === hora)) {
        avisar("Hora no disponible", HORA_OCUPADA, "aviso");
        setHora("");
        return;
      }
    } catch (error) {
      registrarCausa("Error al revisar la hora:", error);
      const aviso = describirError(error, {
        titulo: "No se pudo agendar",
        porDefecto: "Intenta de nuevo.",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
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
      // 409: la hora se ocupó entre la consulta y la reserva
      if (esEstado(error, 409)) {
        avisar("Horario no disponible", HORA_OCUPADA, "aviso");
        setHora("");
        recargarHoras();
        return;
      }
      // 403: el teléfono está en la lista negra o el negocio no está recibiendo reservas
      const aviso = describirError(error, {
        titulo: "No se pudo agendar",
        porDefecto: "Intenta de nuevo.",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
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
    errorNombre,
    telefono: tel,
    datosCuenta,
    pedirAutorizacion,
    aceptaDatos,
    errorAutorizacion,
    confirmacion,
    primerDia,
    ultimoDia,
    horariosDisponibles,
    cargandoHoras,
    errorHoras,
    recargarHoras,
    elegirBarbero,
    elegirServicio,
    elegirDia,
    elegirHora: setHora,
    cambiarNombre,
    cambiarAceptaDatos,
    cerrarConfirmacion: () => setConfirmacion(null),
    agendar,
  };
}

export type EstadoReserva = ReturnType<typeof useReserva>;
