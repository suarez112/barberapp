import { useState } from "react";

// Estado común de los formularios "crear o editar" en acordeón
// (integrantes, servicios, productos).
export function useFormularioEdicion<T extends { id: string }, C extends object>(
  vacio: C,
  aCampos: (item: T) => C,
) {
  const [abierto, setAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<T | null>(null);
  const [campos, setCampos] = useState<C>(vacio);

  const cambiar =
    <K extends keyof C>(campo: K) =>
    (valor: C[K]) =>
      setCampos((actual) => ({ ...actual, [campo]: valor }));

  const editar = (item: T) => {
    setAbierto(true);
    setEnEdicion(item);
    setCampos(aCampos(item));
  };

  // Vacía el formulario, sale del modo edición y lo cierra
  const reiniciar = () => {
    setEnEdicion(null);
    setCampos(vacio);
    setAbierto(false);
  };

  return {
    abierto,
    alternar: () => setAbierto((a) => !a),
    enEdicion,
    campos,
    cambiar,
    editar,
    reiniciar,
  };
}
