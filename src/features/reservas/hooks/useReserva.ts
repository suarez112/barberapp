import { useState } from "react";
import {
  INDICATIVO_POR_DEFECTO,
  detectarIndicativo,
  separarIndicativo,
} from "@/data/paises";
import { crearCita } from "@/features/agenda/api";
import { useAgenda } from "@/features/agenda/AgendaProvider";
import { useClientes } from "@/features/clientes/ClientesProvider";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { ApiError, ErrorDeConexion, mensajeDeError } from "@/services/api/http";
import { Barbero, Dia, Servicio } from "@/types";
import { avisar } from "@/utils/dialogos";
import {
  duracionEnMinutos,
  obtenerHorariosDisponibles,
} from "@/utils/disponibilidad";
import { diaDeHoy, hoyISO } from "@/utils/fechas";
import { DatosConfirmacion } from "../components/ConfirmacionCita";

// Estado y reglas del formulario de reserva del cliente
export function useReserva() {
  const { empresa, servicios } = useNegocio();
  const { citas, citasOcupadas, bloqueos, agregarCita, cargarHorasOcupadas } =
    useAgenda();
  const { telefonoEnListaNegra, registrarReserva } = useClientes();

  const [barbero, setBarbero] = useState<Barbero | null>(null);
  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [dia, setDia] = useState<Dia>(diaDeHoy);
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [indicativo, setIndicativo] = useState(INDICATIVO_POR_DEFECTO);
  // true cuando el cliente eligió el país a mano (o lo escribió con "+"): no se cambia solo
  const [indicativoManual, setIndicativoManual] = useState(false);
  const [aceptaHabeasData, setAceptaHabeasData] = useState(false);
  const [confirmacion, setConfirmacion] = useState<DatosConfirmacion | null>(
    null,
  );

  // No se reserva en días que ya pasaron
  const primerDia = hoyISO();

  const horariosDisponibles =
    barbero && servicio && empresa
      ? obtenerHorariosDisponibles({
          empresa,
          barberoId: barbero.id,
          servicio,
          fecha: dia.fechaFull,
          diaNom: dia.diaNom,
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

  const cambiarTelefono = (valor: string) => {
    // Si escribe o pega el número con "+52 ..." o "0052 ...", se detecta el país
    const separado = separarIndicativo(valor);
    if (separado) {
      setIndicativo(separado.indicativo);
      setIndicativoManual(true);
      setCelular(separado.telefono);
      return;
    }
    setCelular(valor);
    // Sin "+": se va adivinando el país según los dígitos que escribe
    if (!indicativoManual) setIndicativo(detectarIndicativo(valor.replace(/\D/g, "")));
  };

  const elegirPais = (nuevo: string) => {
    setIndicativo(nuevo);
    setIndicativoManual(true);
  };

  const limpiarFormulario = () => {
    setBarbero(null);
    setServicio(null);
    setHora("");
    setNombre("");
    setCelular("");
    setIndicativo(INDICATIVO_POR_DEFECTO);
    setIndicativoManual(false);
    setAceptaHabeasData(false);
  };

  const agendar = async () => {
    const telefono = celular.trim();

    if (telefonoEnListaNegra(telefono)) {
      avisar(
        "No se puede procesar",
        "No fue posible completar la reserva. Por favor contacte directamente al establecimiento.",
      );
      return;
    }

    const faltantes: string[] = [];
    if (!barbero) faltantes.push("Seleccionar Profesional");
    if (!servicio) faltantes.push("Seleccionar un Servicio");
    if (!hora) faltantes.push("Seleccionar la Hora de la cita");
    if (!telefono) faltantes.push("Escribir tu Teléfono / Celular");
    if (!nombre.trim()) faltantes.push("Escribir tu Nombre Completo");
    if (!aceptaHabeasData)
      faltantes.push("Aceptar la Autorización de Datos (Ley 1581)");

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
      const { cita } = await crearCita({
        empresaId: empresa.id,
        barberoId: barbero.id,
        servicioId: servicio.id,
        fecha: dia.fechaFull,
        hora,
        nombre: nombre.trim(),
        telefono,
        indicativo,
      });
      agregarCita(cita);
    } catch (error) {
      if (error instanceof ErrorDeConexion) {
        console.error("Error al agendar:", error.causa);
        avisar("Error de conexión", "No se pudo conectar con el servidor.");
        return;
      }
      avisar("No se pudo agendar", mensajeDeError(error, "Intenta de nuevo."));
      if (error instanceof ApiError && error.status === 409) {
        setHora("");
        cargarHorasOcupadas(empresa.id);
      }
      return;
    }

    registrarReserva({
      telefono,
      indicativo,
      nombre: nombre.trim(),
      fecha: dia.fechaFull,
    });

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
    celular,
    indicativo,
    aceptaHabeasData,
    confirmacion,
    primerDia,
    horariosDisponibles,
    elegirBarbero,
    elegirServicio,
    elegirDia,
    elegirHora: setHora,
    setNombre,
    cambiarTelefono,
    elegirPais,
    alternarHabeasData: () => setAceptaHabeasData((v) => !v),
    cerrarConfirmacion: () => setConfirmacion(null),
    agendar,
  };
}

export type EstadoReserva = ReturnType<typeof useReserva>;
