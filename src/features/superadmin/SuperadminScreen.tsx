import { useState } from "react";
import LoginSuperadmin from "./LoginSuperadmin";
import PanelSuperadmin from "./PanelSuperadmin";
import { SesionSuperadmin } from "./api";
import { SuperadminProvider } from "./SuperadminContext";

// Panel del dueño de la plataforma (solo web, ruta /superadmin). La sesión vive en
// memoria: al cerrarla o recargar la página se vuelve al inicio de sesión.
export default function SuperadminScreen() {
  const [sesion, setSesion] = useState<SesionSuperadmin | null>(null);

  if (!sesion) return <LoginSuperadmin onEntrar={setSesion} />;
  return (
    <SuperadminProvider token={sesion.token} correo={sesion.superadmin.correo} onSalir={() => setSesion(null)}>
      <PanelSuperadmin />
    </SuperadminProvider>
  );
}
