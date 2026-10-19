import { MODO_PRUEBAS } from "@/constants/config";
import { Cita } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { fechaHoraCita } from "@/utils/fechas";
import { useAvisarError } from "../sesion/useAvisarError";
import { Personal } from "../sesion/usePersonal";
import { cancelarCita, completarCita } from "./api";
import { useAgenda } from "./AgendaProvider";

// Completar y cancelar citas desde el panel (validado por el servidor)
export function useAccionesCita(personal: Personal) {
  const { actualizarCita } = useAgenda();
  const avisarError = useAvisarError();

  // El profesional de la cita, o la cuenta del administrador (cualquier cita)
  const puedeCompletar = (c: Cita) =>
    personal.esCuentaAdmin || c.barberoId === personal.barbero?.id;

  const completar = async (c: Cita) => {
    if (!puedeCompletar(c)) {
      avisar(
        "No permitido",
        "Solo el profesional de la cita puede marcarla como completada.",
      );
      return;
    }
    if (!MODO_PRUEBAS && new Date() < fechaHoraCita(c.fecha, c.hora)) {
      avisar("Aún no es la hora", "No puedes completar una cita antes de su hora.");
      return;
    }
    const confirmado = await confirmar({
      titulo: "Completar servicio",
      mensaje: `¿Confirmas que el servicio de ${c.cliente} ya se realizó? Se registrará la hora exacta.`,
      textoCancelar: "No",
      textoConfirmar: "Sí, completado",
    });
    if (!confirmado) return;

    try {
      const { completadaEn, completadaPor } = await completarCita(c.id, personal.token);
      actualizarCita(c.id, { estado: "COMPLETADA", completadaEn, completadaPor });
    } catch (error) {
      avisarError(error, { titulo: "No se pudo completar" });
    }
  };

  const cancelar = async (c: Cita) => {
    const confirmado = await confirmar({
      titulo: "Cancelar cita",
      mensaje: `¿Cancelar la cita de ${c.cliente}?`,
      textoCancelar: "No",
      textoConfirmar: "Sí, cancelar",
      destructivo: true,
    });
    if (!confirmado) return;

    try {
      // Primero el servidor. Si lo rechaza, no cambiamos nada.
      const datos = await cancelarCita(c.id, personal.token);
      actualizarCita(c.id, {
        estado: "CANCELADA",
        canceladaEn: datos.canceladaEn ?? new Date().toISOString(),
        canceladaPor: datos.canceladaPor ?? personal.nombre,
      });
    } catch (error) {
      avisarError(error, { titulo: "No se pudo cancelar" });
    }
  };

  return { completar, cancelar, puedeCompletar };
}
