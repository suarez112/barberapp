import { MODO_PRUEBAS } from "@/constants/config";
import { ErrorDeConexion, mensajeDeError } from "@/services/api/http";
import { Cita } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { fechaHoraCita, formatearHora } from "@/utils/fechas";
import { useNotificaciones } from "../notificaciones/NotificacionesProvider";
import { useSesion } from "../sesion/SesionProvider";
import { cancelarCita, completarCita } from "./api";
import { useAgenda } from "./AgendaProvider";

const avisarFallo = (titulo: string, contexto: string, error: unknown) => {
  if (error instanceof ErrorDeConexion) {
    console.error(contexto, error.causa);
    avisar("Error de conexión", "No se pudo conectar con el servidor.");
  } else {
    avisar(titulo, mensajeDeError(error, "Intenta de nuevo."));
  }
};

// Completar y cancelar citas desde el panel (validado por el servidor)
export function useAccionesCita() {
  const { barbero, token } = useSesion();
  const { actualizarCita } = useAgenda();
  const { notificar } = useNotificaciones();

  const completar = async (c: Cita) => {
    if (c.barberoId !== barbero?.id) {
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
      const { completadaEn, completadaPor } = await completarCita(c.id, token);
      actualizarCita(c.id, { estado: "COMPLETADA", completadaEn, completadaPor });
      notificar({
        titulo: "✅ SERVICIO REGISTRADO",
        mensaje: `Se registró tu servicio de ${c.servicio} con ${c.barberoNombre} a las ${formatearHora(completadaEn)}. Si no fue así, avisa al establecimiento.`,
        fecha: formatearHora(completadaEn),
      });
    } catch (error) {
      avisarFallo("No se pudo completar", "Error al completar:", error);
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
      const datos = await cancelarCita(c.id, token);
      actualizarCita(c.id, {
        estado: "CANCELADA",
        canceladaEn: datos.canceladaEn ?? new Date().toISOString(),
        canceladaPor: datos.canceladaPor ?? barbero?.nombre,
      });
      notificar({
        titulo: "❌ CITA CANCELADA",
        mensaje: `${c.barberoNombre} canceló tu cita del ${c.fecha} a las ${c.hora}. Por favor elige otro horario.`,
        fecha: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (error) {
      avisarFallo("No se pudo cancelar", "Error al cancelar:", error);
    }
  };

  return { completar, cancelar };
}
