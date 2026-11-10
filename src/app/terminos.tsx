import { Redirect } from "expo-router";

// Ruta corta: /terminos -> /legales/terminos
export default function Redireccion() {
  return <Redirect href="/legales/terminos" />;
}
