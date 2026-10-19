import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import { confirmar } from "@/utils/dialogos";
import { useCerrarSesion } from "../sesion/useCerrarSesion";

// "Cerrar sesión" con confirmación. El botón atrás de Android no saca del
// panel con la sesión abierta: pide cerrarla.
export function useSalirDelPanel() {
  const cerrarSesion = useCerrarSesion();

  const salir = useCallback(async () => {
    const ok = await confirmar({
      titulo: "Cerrar sesión",
      mensaje: "¿Deseas salir? Tendrás que volver a iniciar sesión.",
      destructivo: true,
    });
    if (ok) cerrarSesion();
  }, [cerrarSesion]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        salir();
        return true;
      });
      return () => sub.remove();
    }, [salir]),
  );

  return salir;
}
