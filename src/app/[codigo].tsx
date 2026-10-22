import { Redirect, useLocalSearchParams } from "expo-router";

// Enlace público del negocio: <base>/<CÓDIGO> abre directo la reserva de ese negocio.
// Las rutas fijas (/login, /admin...) tienen prioridad sobre esta.
export default function EnlaceNegocioRoute() {
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  const limpio = typeof codigo === "string" ? codigo.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{1,10}$/.test(limpio)) return <Redirect href="/" />;
  return <Redirect href={{ pathname: "/cliente", params: { codigo: limpio } }} />;
}
