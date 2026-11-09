import { Redirect } from "expo-router";

// Ruta corta: /politica-de-datos -> /legales/politica-de-datos
export default function Redireccion() {
  return <Redirect href="/legales/politica-de-datos" />;
}
