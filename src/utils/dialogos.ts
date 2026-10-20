// Avisos y confirmaciones con el modal propio de la app (components/ui/DialogoHost).
// Cualquier parte del código llama a avisar() o confirmar(); DialogoHost, montado
// una sola vez en AppProviders, los muestra en orden, uno a la vez.

export type TipoDialogo = "exito" | "error" | "aviso" | "confirmacion";

export type Dialogo = {
  id: number;
  tipo: TipoDialogo;
  titulo: string;
  mensaje?: string;
  // Solo confirmación: el botón Aceptar se pinta de rojo
  destructivo?: boolean;
  // Solo confirmación: textos de los botones (por defecto ACEPTAR y CANCELAR)
  textoAceptar?: string;
  textoCancelar?: string;
  responder: (aceptado: boolean) => void;
};

let cola: Dialogo[] = [];
let siguienteId = 1;
const oyentes = new Set<() => void>();

const notificar = () => oyentes.forEach((oyente) => oyente());

export const suscribirDialogos = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
};

// El diálogo visible (el primero de la cola)
export const dialogoActual = (): Dialogo | undefined => cola[0];

const mostrar = (datos: Omit<Dialogo, "id" | "responder">) =>
  new Promise<boolean>((resolve) => {
    const id = siguienteId++;
    cola = [
      ...cola,
      {
        ...datos,
        id,
        responder: (aceptado) => {
          cola = cola.filter((d) => d.id !== id);
          notificar();
          resolve(aceptado);
        },
      },
    ];
    notificar();
  });

// Aviso con un solo botón "Aceptar". tipo: "exito", "error" o "aviso" (por defecto)
export const avisar = (
  titulo: string,
  mensaje?: string,
  tipo: Exclude<TipoDialogo, "confirmacion"> = "aviso",
) => {
  void mostrar({ tipo, titulo, mensaje });
};

type OpcionesConfirmar = {
  titulo: string;
  mensaje: string;
  destructivo?: boolean;
  textoAceptar?: string;
  textoCancelar?: string;
};

// Pregunta con "Aceptar" y "Cancelar" (o los textos dados). true si la persona acepta.
export const confirmar = ({ titulo, mensaje, destructivo = false, ...textos }: OpcionesConfirmar) =>
  mostrar({ tipo: "confirmacion", titulo, mensaje, destructivo, ...textos });

// Formulario con errores: cada campo muestra debajo qué corregir
export const avisarCamposConError = () =>
  avisar("Revisa el formulario", "Corrige los campos marcados en rojo: debajo de cada uno dice qué falta.");
