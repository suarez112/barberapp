import { useEffect, useState } from "react";
import { descargarImagen, esCancelada } from "@/services/api/http";
import { registrarCausa } from "@/services/api/errores";

type Estado = { ruta: string; uri?: string; fallo?: boolean };

// Imagen del backend que exige el token (ej. QR de pago). Se descarga con el encabezado
// Authorization y se muestra desde esos bytes. `ruta` null = no hay imagen que pedir.
// Cambiar `version` (ej. tras subir un QR nuevo) vuelve a descargarla.
export function useImagenProtegida(ruta: string | null, token: string, version = 0) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const clave = `${ruta}#${version}`;

  useEffect(() => {
    if (!ruta) return;
    const control = new AbortController();
    let url: string | undefined;
    descargarImagen(ruta, { token, signal: control.signal })
      .then((uri) => {
        url = uri;
        setEstado({ ruta: clave, uri });
      })
      .catch((e) => {
        if (esCancelada(e) || control.signal.aborted) return;
        registrarCausa("Imagen protegida", e);
        setEstado({ ruta: clave, fallo: true });
      });
    return () => {
      control.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [ruta, token, clave]);

  const actual = estado?.ruta === clave ? estado : null;
  return { uri: actual?.uri ?? null, fallo: !!actual?.fallo, cargando: !!ruta && !actual };
}
