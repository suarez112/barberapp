import { RefObject, useRef } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  PointerEvent,
  ScrollViewInstance,
} from "react-native";

// Lo que se mueve el mouse antes de contar como arrastre (y no como clic)
const UMBRAL_PX = 5;
const ES_WEB = process.env.EXPO_OS === "web";

// Permite arrastrar con el mouse una lista horizontal en la web (el navegador solo la mueve
// con la rueda, la barra o el dedo). En el celular el dedo ya la desplaza: no hace nada.
// fueArrastre() dice si el clic que acaba de pasar terminó un arrastre, para no elegir nada.
export function useArrastreConMouse(lista: RefObject<ScrollViewInstance | null>) {
  const desplazamiento = useRef(0);
  const inicio = useRef<{ x: number; desplazamiento: number } | null>(null);
  const arrastro = useRef(false);

  const fueArrastre = () => {
    const hubo = arrastro.current;
    arrastro.current = false;
    return hubo;
  };

  if (!ES_WEB) return { propsLista: {}, fueArrastre: () => false };

  const terminar = () => {
    inicio.current = null;
  };

  const propsLista = {
    scrollEventThrottle: 16,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      desplazamiento.current = e.nativeEvent.contentOffset.x;
    },
    onPointerDown: (e: PointerEvent) => {
      if (e.nativeEvent.pointerType !== "mouse" || e.nativeEvent.button !== 0) return;
      arrastro.current = false;
      inicio.current = { x: e.nativeEvent.clientX, desplazamiento: desplazamiento.current };
    },
    onPointerMove: (e: PointerEvent) => {
      if (!inicio.current) return;
      const dx = e.nativeEvent.clientX - inicio.current.x;
      if (!arrastro.current) {
        if (Math.abs(dx) < UMBRAL_PX) return;
        arrastro.current = true;
        // Sigue el mouse aunque salga de la lista mientras arrastra
        const elemento = e.currentTarget as unknown as Partial<HTMLElement>;
        elemento.setPointerCapture?.(e.nativeEvent.pointerId);
      }
      lista.current?.scrollTo({
        x: Math.max(0, inicio.current.desplazamiento - dx),
        animated: false,
      });
    },
    onPointerUp: terminar,
    onPointerCancel: terminar,
  };

  return { propsLista, fueArrastre };
}
