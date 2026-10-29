import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { obtenerResumen } from "./api";
import { useSuperadmin } from "./SuperadminContext";

// El servidor cierra la sesión tras 15 minutos sin solicitudes (inactividadMinutos del login)
const MINUTOS_INACTIVIDAD = 15;
const AVISO_ANTES_S = 60;
// Mientras la persona usa el panel sin pedir datos, se avisa al servidor cada tanto
// para que no la desconecte por su cuenta
const LATIDO_CADA_MS = 4 * 60 * 1000;
const EVENTOS = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"] as const;

type Opciones = { minutos?: number; onVencer: () => void };

// Controla la inactividad del panel (solo web): `segundosRestantes` es null hasta que
// falta un minuto para el cierre; `seguirConectado` renueva la sesión.
export function useInactividad({ minutos = MINUTOS_INACTIVIDAD, onVencer }: Opciones) {
  const { token, cerrarSiVencio } = useSuperadmin();
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const ultimaActividad = useRef(0);
  const ultimoLatido = useRef(0);
  const avisando = useRef(false);
  // El efecto no debe reiniciarse cuando cambian estas funciones (cambian en cada render)
  const alVencer = useRef(onVencer);
  const alExpirar = useRef(cerrarSiVencio);
  useEffect(() => {
    alVencer.current = onVencer;
    alExpirar.current = cerrarSiVencio;
  });

  // Avisa al servidor que sigue habiendo alguien; un 401 cierra la sesión
  const latir = useCallback(() => {
    ultimoLatido.current = Date.now();
    obtenerResumen(token).catch((e) => {
      alExpirar.current(e);
    });
  }, [token]);

  const seguirConectado = useCallback(() => {
    ultimaActividad.current = Date.now();
    avisando.current = false;
    setSegundosRestantes(null);
    latir();
  }, [latir]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const limiteMs = minutos * 60 * 1000;
    ultimaActividad.current = Date.now();
    ultimoLatido.current = Date.now();

    // Con el aviso a la vista solo cuenta el botón: mover el ratón no lo quita
    const alActividad = () => {
      if (!avisando.current) ultimaActividad.current = Date.now();
    };
    EVENTOS.forEach((e) => document.addEventListener(e, alActividad, { capture: true, passive: true }));

    const reloj = setInterval(() => {
      const ahora = Date.now();
      const inactivoMs = ahora - ultimaActividad.current;
      if (inactivoMs >= limiteMs) {
        clearInterval(reloj);
        alVencer.current();
        return;
      }
      const faltanS = Math.ceil((limiteMs - inactivoMs) / 1000);
      if (faltanS <= AVISO_ANTES_S) {
        avisando.current = true;
        setSegundosRestantes(faltanS);
      } else if (ultimaActividad.current > ultimoLatido.current && ahora - ultimoLatido.current >= LATIDO_CADA_MS) {
        latir();
      }
    }, 1000);

    return () => {
      clearInterval(reloj);
      EVENTOS.forEach((e) => document.removeEventListener(e, alActividad, { capture: true }));
    };
  }, [minutos, latir]);

  return { segundosRestantes, seguirConectado };
}
