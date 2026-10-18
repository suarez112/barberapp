import { ReactNode } from "react";
import { AgendaProvider } from "@/features/agenda/AgendaProvider";
import { ClientesProvider } from "@/features/clientes/ClientesProvider";
import { NegocioProvider } from "@/features/negocio/NegocioProvider";
import { NotificacionesProvider } from "@/features/notificaciones/NotificacionesProvider";
import { SesionProvider } from "@/features/sesion/SesionProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Estado global de la app. El orden importa: el tema usa los colores del negocio.
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NegocioProvider>
      <ThemeProvider>
        <SesionProvider>
          <AgendaProvider>
            <ClientesProvider>
              <NotificacionesProvider>{children}</NotificacionesProvider>
            </ClientesProvider>
          </AgendaProvider>
        </SesionProvider>
      </ThemeProvider>
    </NegocioProvider>
  );
}
