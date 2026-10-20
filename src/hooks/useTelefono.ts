import type { CountryCode } from "libphonenumber-js/max";
import { useState } from "react";
import {
  PAIS_POR_DEFECTO,
  TELEFONO_INVALIDO,
  formatearMientrasEscribe,
  indicativoDe,
  normalizarTelefono,
  separarPais,
  soloDigitos,
} from "@/utils/telefonos";

// Estado de un campo de teléfono: país (Colombia por defecto) y número formateado
// mientras se escribe. Pegar o escribir "+52 …" cambia el país solo.
export function useTelefono() {
  const [pais, setPais] = useState<CountryCode>(PAIS_POR_DEFECTO);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const indicativo = indicativoDe(pais);

  const cambiarTexto = (valor: string) => {
    setError(null);
    const separado = separarPais(valor);
    if (separado) {
      setPais(separado.pais);
      setTexto(formatearMientrasEscribe(separado.pais, separado.digitos));
      return;
    }
    let digitos = soloDigitos(valor);
    // Borró un espacio del formato: se borra el dígito anterior
    if (valor.length < texto.length && digitos === soloDigitos(texto)) {
      digitos = digitos.slice(0, -1);
    }
    setTexto(formatearMientrasEscribe(pais, digitos));
  };

  const elegirPais = (nuevo: CountryCode) => {
    setError(null);
    setPais(nuevo);
    setTexto(formatearMientrasEscribe(nuevo, soloDigitos(texto)));
  };

  // Número en E.164 listo para enviar, o null (y deja el error bajo el campo)
  const validar = (): { telefono: string; indicativo: string } | null => {
    if (!soloDigitos(texto)) {
      setError("Escribe tu número de celular.");
      return null;
    }
    const normalizado = normalizarTelefono(texto, indicativo);
    if (!normalizado) setError(TELEFONO_INVALIDO);
    return normalizado;
  };

  const limpiar = () => {
    setPais(PAIS_POR_DEFECTO);
    setTexto("");
    setError(null);
  };

  return { pais, texto, indicativo, error, setError, cambiarTexto, elegirPais, validar, limpiar };
}

export type EstadoTelefono = ReturnType<typeof useTelefono>;
