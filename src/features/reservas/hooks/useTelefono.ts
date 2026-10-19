import { useState } from "react";
import {
  INDICATIVO_POR_DEFECTO,
  detectarIndicativo,
  separarIndicativo,
} from "@/data/paises";

// Teléfono con indicativo: el país se adivina con los dígitos, se detecta al
// escribir "+52 …" o se elige a mano (y entonces ya no cambia solo)
export function useTelefono() {
  const [telefono, setTelefono] = useState("");
  const [indicativo, setIndicativo] = useState(INDICATIVO_POR_DEFECTO);
  const [indicativoManual, setIndicativoManual] = useState(false);

  const cambiarTelefono = (valor: string) => {
    // Si escribe o pega el número con "+52 ..." o "0052 ...", se detecta el país
    const separado = separarIndicativo(valor);
    if (separado) {
      setIndicativo(separado.indicativo);
      setIndicativoManual(true);
      setTelefono(separado.telefono);
      return;
    }
    setTelefono(valor);
    // Sin "+": se va adivinando el país según los dígitos que escribe
    if (!indicativoManual) setIndicativo(detectarIndicativo(valor.replace(/\D/g, "")));
  };

  const elegirPais = (nuevo: string) => {
    setIndicativo(nuevo);
    setIndicativoManual(true);
  };

  const limpiar = () => {
    setTelefono("");
    setIndicativo(INDICATIVO_POR_DEFECTO);
    setIndicativoManual(false);
  };

  return { telefono, indicativo, cambiarTelefono, elegirPais, limpiar };
}
