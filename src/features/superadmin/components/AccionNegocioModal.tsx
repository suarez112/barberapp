import { useState } from "react";
import CampoTexto from "@/components/ui/CampoTexto";
import Selector from "@/components/ui/Selector";
import { confirmar, avisar } from "@/utils/dialogos";
import {
  activarPlan,
  extenderPrueba,
  NegocioDetalle,
  Periodo,
  reactivarNegocio,
  suspenderNegocio,
} from "../api";
import { useSuperadmin } from "../SuperadminContext";
import ModalAccion from "./ModalAccion";

export type TipoAccion = "plan" | "prueba" | "suspender" | "reactivar";

type Props = {
  tipo: TipoAccion;
  negocio: NegocioDetalle;
  onCerrar: () => void;
  // Se llama después de que el backend aceptó la acción
  onHecho: () => void;
};

const PERIODOS = [
  { id: "mensual", label: "Mensual" },
  { id: "anual", label: "Anual" },
] as const;

const MOTIVO_MAX = 300;

type Errores = { dias?: string; motivo?: string };

// Ventana de una acción sobre un negocio: Activar plan, Extender prueba, Suspender o Reactivar.
// Suspender y Reactivar piden el motivo (obligatorio) y una confirmación final.
export default function AccionNegocioModal({ tipo, negocio, onCerrar, onHecho }: Props) {
  const { token, avisarError } = useSuperadmin();
  const [periodo, setPeriodo] = useState<Periodo>(negocio.plan ?? "mensual");
  const [dias, setDias] = useState("");
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  const motivoObligatorio = tipo === "suspender" || tipo === "reactivar";

  const validar = (): Errores => {
    const e: Errores = {};
    if (tipo === "prueba") {
      const n = Number(dias);
      if (!/^\d+$/.test(dias) || n < 1 || n > 365) e.dias = "Escribe un número entero de días entre 1 y 365.";
    }
    if (motivoObligatorio && !motivo.trim()) e.motivo = "Escribe el motivo: queda guardado en el registro de actividad.";
    return e;
  };

  const enviar = async () => {
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    if (motivoObligatorio) {
      const seguir = await confirmar({
        titulo: tipo === "suspender" ? "¿Suspender este negocio?" : "¿Reactivar este negocio?",
        mensaje:
          tipo === "suspender"
            ? `${negocio.nombre} no podrá usarse ni recibirá reservas hasta que lo reactives.`
            : `${negocio.nombre} volverá a funcionar como estaba antes de la suspensión.`,
        destructivo: tipo === "suspender",
        textoAceptar: tipo === "suspender" ? "SUSPENDER" : "REACTIVAR",
      });
      if (!seguir) return;
    }

    const motivoLimpio = motivo.trim() || undefined;
    setEnviando(true);
    try {
      const respuesta =
        tipo === "plan"
          ? await activarPlan(token, negocio.id, {
              periodo,
              motivo: motivoLimpio,
            })
          : tipo === "prueba"
            ? await extenderPrueba(token, negocio.id, { dias: Number(dias), motivo: motivoLimpio })
            : tipo === "suspender"
              ? await suspenderNegocio(token, negocio.id, motivo.trim())
              : await reactivarNegocio(token, negocio.id, motivo.trim());
      avisar("Listo", respuesta.mensaje, "exito");
      onHecho();
    } catch (error) {
      setEnviando(false);
      avisarError("Acción sobre un negocio", error, "No se pudo completar");
    }
  };

  const textos = {
    plan: {
      titulo: "Activar plan",
      descripcion: `Deja activo el plan de ${negocio.nombre} desde hoy. El nivel y el precio salen de los profesionales que atienden clientes. La fecha de fin cuenta desde el fin de la prueba o del plan vigente.`,
      boton: "ACTIVAR PLAN",
      ayuda: "Activa el plan del negocio con el periodo elegido",
    },
    prueba: {
      titulo: "Extender prueba",
      descripcion: `Suma días a la prueba gratuita de ${negocio.nombre}.`,
      boton: "EXTENDER PRUEBA",
      ayuda: "Agrega los días escritos a la prueba gratuita del negocio",
    },
    suspender: {
      titulo: "Suspender negocio",
      descripcion: "Mientras esté suspendido se comporta como uno vencido. No cambia su plan ni sus fechas.",
      boton: "SUSPENDER",
      ayuda: "Pide una confirmación y suspende el negocio",
    },
    reactivar: {
      titulo: "Reactivar negocio",
      descripcion: "Quita la suspensión. El plan y las fechas siguen como estaban.",
      boton: "REACTIVAR",
      ayuda: "Pide una confirmación y quita la suspensión del negocio",
    },
  }[tipo];

  return (
    <ModalAccion
      titulo={textos.titulo}
      descripcion={textos.descripcion}
      textoConfirmar={textos.boton}
      ayudaConfirmar={textos.ayuda}
      destructivo={tipo === "suspender"}
      enviando={enviando}
      onConfirmar={enviar}
      onCerrar={onCerrar}
    >
      {tipo === "plan" ? (
        <>
          <Selector opciones={PERIODOS} valor={periodo} onCambiar={setPeriodo} />
        </>
      ) : null}
      {tipo === "prueba" ? (
        <CampoTexto
          etiqueta="Días a sumar"
          obligatorio
          ayuda="Escribe cuántos días quieres agregar a la prueba, de 1 a 365"
          placeholder="ej: 7"
          value={dias}
          onChangeText={(t) => {
            setDias(t.replace(/\D/g, "").slice(0, 3));
            setErrores((p) => ({ ...p, dias: undefined }));
          }}
          error={errores.dias}
          keyboardType="number-pad"
        />
      ) : null}
      <CampoTexto
        etiqueta={motivoObligatorio ? "Motivo" : "Motivo (opcional)"}
        obligatorio={motivoObligatorio}
        ayuda="Queda guardado en el registro de actividad"
        placeholder="ej: pago confirmado por transferencia"
        value={motivo}
        onChangeText={(t) => {
          setMotivo(t.slice(0, MOTIVO_MAX));
          setErrores((p) => ({ ...p, motivo: undefined }));
        }}
        error={errores.motivo}
        multiline
        maxLength={MOTIVO_MAX}
      />
    </ModalAccion>
  );
}
