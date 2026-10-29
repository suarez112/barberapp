import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { hoyColombiaISO } from "@/utils/fechas";

// Ejecuta `accion` cada vez que la app vuelve a primer plano y cuando cambia
// el día en Colombia (medianoche), aunque la pantalla siga abierta.
export function useRefrescoDiario(accion: () => void) {
  const ultima = useRef(accion);
  useEffect(() => {
    ultima.current = accion;
  });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (estado) => {
      if (estado === "active") ultima.current();
    });
    let dia = hoyColombiaISO();
    // Con la app en segundo plano el reloj se detiene; al volver avisa AppState
    const reloj = setInterval(() => {
      const hoy = hoyColombiaISO();
      if (hoy === dia) return;
      dia = hoy;
      ultima.current();
    }, 60_000);
    return () => {
      sub.remove();
      clearInterval(reloj);
    };
  }, []);
}
