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
  // Qué corregir en cada campo (se muestra debajo); cambiar el campo lo quita
  const [errores, setErrores] = useState<Partial<Record<keyof C, string>>>({});

  const cambiar =
    <K extends keyof C>(campo: K) =>
    (valor: C[K]) => {
      setCampos((actual) => ({ ...actual, [campo]: valor }));
      setErrores((e) => {
        if (!(campo in e)) return e;
        const copia = { ...e };
        delete copia[campo];
        return copia;
      });
    };

  const editar = (item: T) => {
    setAbierto(true);
    setEnEdicion(item);
    setCampos(aCampos(item));
    setErrores({});
  };

  // Vacía el formulario, sale del modo edición y lo cierra
  const reiniciar = () => {
    setEnEdicion(null);
    setCampos(vacio);
    setErrores({});
    setAbierto(false);
  };

  return {
    abierto,
    alternar: () => setAbierto((a) => !a),
    enEdicion,
    campos,
    cambiar,
    errores,
    setErrores,
    editar,
    reiniciar,
  };
}
