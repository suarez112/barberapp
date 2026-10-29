import * as SplashScreen from "expo-splash-screen";
import { ReactNode, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useNegocio } from "../features/negocio/NegocioProvider";
import { crearContexto } from "../utils/crearContexto";
import { crearPaleta, Paleta, Tema } from "./paleta";
import {
  guardarPreferenciaTema,
  leerPreferenciaTema,
  PreferenciaTema,
} from "./preferenciaTema";

type ValorTema = {
  tema: Tema;
  esOscuro: boolean;
  colors: Paleta;
  // Lo que eligió la persona en el menú (por defecto sigue al teléfono)
  preferencia: PreferenciaTema;
  elegirTema: (preferencia: PreferenciaTema) => void;
  // Cambia entre claro y oscuro (el panel del superadministrador)
  alternarTema: () => void;
};

const [TemaContext, useAppTheme] = crearContexto<ValorTema>("AppTheme");
export { useAppTheme };

// La pantalla de arranque se queda hasta saber el tema guardado, para no mostrar
// un destello del tema equivocado
SplashScreen.preventAutoHideAsync().catch(() => {});

// Depende de NegocioProvider: cada negocio pinta la app con sus colores
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>("sistema");
  const sistema = useColorScheme();
  const { empresa } = useNegocio();

  useEffect(() => {
    leerPreferenciaTema().then((guardada) => {
      setPreferencia(guardada);
      SplashScreen.hide();
    });
  }, []);

  // Si el teléfono no informa su tema se usa el oscuro, como antes
  const tema: Tema =
    preferencia === "claro"
      ? "CLARO"
      : preferencia === "oscuro"
        ? "OSCURO"
        : sistema === "light"
          ? "CLARO"
          : "OSCURO";
  const colors = crearPaleta(tema, empresa);

  const elegirTema = (nueva: PreferenciaTema) => {
    setPreferencia(nueva);
    guardarPreferenciaTema(nueva);
  };

  return (
    <TemaContext
      value={{
        tema,
        esOscuro: tema === "OSCURO",
        colors,
        preferencia,
        elegirTema,
        alternarTema: () => elegirTema(tema === "OSCURO" ? "claro" : "oscuro"),
      }}
    >
      {children}
    </TemaContext>
  );
}
