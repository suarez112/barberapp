import { ReactNode } from "react";
import { AgendaProvider } from "@/features/agenda/AgendaProvider";
import { CuentaProvider } from "@/features/cuenta/CuentaProvider";
import { NegocioProvider } from "@/features/negocio/NegocioProvider";
import { RestaurarSesionProvider } from "@/features/sesion/RestaurarSesionProvider";
import { SesionProvider } from "@/features/sesion/SesionProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Estado global de la app. El orden importa: el tema usa los colores del negocio
// y la restauración de la sesión guardada necesita las dos sesiones.
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NegocioProvider>
      <ThemeProvider>
        <SesionProvider>
          <CuentaProvider>
            <RestaurarSesionProvider>
              <AgendaProvider>{children}</AgendaProvider>
            </RestaurarSesionProvider>
          </CuentaProvider>
        </SesionProvider>
      </ThemeProvider>
    </NegocioProvider>
  );
}
