import { useAppTheme } from "@/theme/ThemeProvider";
import BotonCabecera from "./BotonCabecera";

// Botón de la cabecera que cambia entre tema claro y oscuro: muestra la luna en el tema
// claro (lleva al oscuro) y el sol en el oscuro (lleva al claro)
export default function BotonTema({ sobreOscuro = false }: { sobreOscuro?: boolean }) {
  const { esOscuro, elegirTema } = useAppTheme();
  const destino = esOscuro ? "claro" : "oscuro";
  return (
    <BotonCabecera
      icono={esOscuro ? "sunny-outline" : "moon-outline"}
      etiqueta={`Cambiar a tema ${destino}`}
      ayuda={`Cambia la app al tema ${destino} y lo guarda en este dispositivo`}
      sobreOscuro={sobreOscuro}
      onPress={() => elegirTema(destino)}
    />
  );
}
