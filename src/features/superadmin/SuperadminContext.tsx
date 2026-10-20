import { ReactNode } from "react";
import { describirError, esEstado, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { avisar } from "@/utils/dialogos";
import { crearContexto } from "@/utils/crearContexto";

type ValorSuperadmin = {
  token: string;
  correo: string;
  salir: () => void;
  // Muestra el error de una acción; si la sesión venció (401) la cierra
  avisarError: (contexto: string, error: unknown, titulo: string) => void;
  // Un 401 al cargar datos: avisa y cierra la sesión. Devuelve true si lo era.
  cerrarSiVencio: (error: unknown) => boolean;
};

const [ContextoSuperadmin, useSuperadmin] = crearContexto<ValorSuperadmin>("Superadmin");
export { useSuperadmin };

type Props = { token: string; correo: string; onSalir: () => void; children: ReactNode };

// Sesión del panel del superadministrador. Vive solo en memoria: no se guarda en el
// navegador, así que recargar la página pide iniciar sesión otra vez.
export function SuperadminProvider({ token, correo, onSalir, children }: Props) {
  const cerrarSiVencio = (error: unknown) => {
    if (!esEstado(error, 401)) return false;
    avisar("Sesión vencida", "Tu sesión terminó. Inicia sesión de nuevo.", "error");
    onSalir();
    return true;
  };

  const avisarError = (contexto: string, error: unknown, titulo: string) => {
    if (esCancelada(error) || cerrarSiVencio(error)) return;
    registrarCausa(contexto, error);
    const aviso = describirError(error, { titulo, porDefecto: "Intenta de nuevo." });
    avisar(aviso.titulo, aviso.mensaje, "error");
  };

  return (
    <ContextoSuperadmin value={{ token, correo, salir: onSalir, avisarError, cerrarSiVencio }}>
      {children}
    </ContextoSuperadmin>
  );
}
