import NoEncontradaScreen from "@/features/sesion/NoEncontradaScreen";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function NotFoundRoute() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "Página no encontrada – Agendality";
    }
  }, []);

  return <NoEncontradaScreen />;
}
