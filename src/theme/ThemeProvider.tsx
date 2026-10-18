import { ReactNode, useState } from "react";
import { useNegocio } from "../features/negocio/NegocioProvider";
import { crearContexto } from "../utils/crearContexto";
import { crearPaleta, Paleta, Tema } from "./paleta";

type ValorTema = {
  tema: Tema;
  esOscuro: boolean;
  colors: Paleta;
  alternarTema: () => void;
};

const [TemaContext, useAppTheme] = crearContexto<ValorTema>("AppTheme");
export { useAppTheme };

// Depende de NegocioProvider: cada negocio pinta la app con sus colores
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>("OSCURO");
  const { empresa } = useNegocio();

  const colors = crearPaleta(tema, empresa);

  return (
    <TemaContext
      value={{
        tema,
        esOscuro: tema === "OSCURO",
        colors,
        alternarTema: () =>
          setTema((t) => (t === "OSCURO" ? "CLARO" : "OSCURO")),
      }}
    >
      {children}
    </TemaContext>
  );
}
