import { Redirect } from "expo-router";

// Ruta corta: /aviso-privacidad -> /legales/aviso-privacidad
export default function Redireccion() {
  return <Redirect href="/legales/aviso-privacidad" />;
}
