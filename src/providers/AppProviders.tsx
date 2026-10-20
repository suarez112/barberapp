import { ReactNode } from "react";
import DialogoHost from "@/components/ui/DialogoHost";
import { AgendaProvider } from "@/features/agenda/AgendaProvider";
import { CuentaProvider } from "@/features/cuenta/CuentaProvider";
import { NegocioProvider } from "@/features/negocio/NegocioProvider";
import ManejadorNotificaciones from "@/features/notificaciones/ManejadorNotificaciones";
import { NotificacionesProvider } from "@/features/notificaciones/NotificacionesProvider";
import { RestaurarSesionProvider } from "@/features/sesion/RestaurarSesionProvider";
import { SesionProvider } from "@/features/sesion/SesionProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Estado global de la app. El orden importa: el tema usa los colores del negocio
// la restauración de la sesión guardada necesita las dos sesiones
// y las notificaciones necesitan saber cuál sesión está abierta.
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NegocioProvider>
      <ThemeProvider>
        <SesionProvider>
          <CuentaProvider>
            <RestaurarSesionProvider>
              <NotificacionesProvider>
                <AgendaProvider>
                  {children}
                  {/* Abre la cita cuando se toca una notificación */}
                  <ManejadorNotificaciones />
                  {/* Avisos y confirmaciones de toda la app */}
                  <DialogoHost />
                </AgendaProvider>
              </NotificacionesProvider>
            </RestaurarSesionProvider>
          </CuentaProvider>
        </SesionProvider>
      </ThemeProvider>
    </NegocioProvider>
  );
}
