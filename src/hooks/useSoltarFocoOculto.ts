import { useEffect } from "react";
import { Platform } from "react-native";

// En la web, al cambiar de pantalla la navegación pone aria-hidden en la pantalla anterior,
// pero el botón que se tocó en ella sigue con el foco y el navegador avisa
// ("Blocked aria-hidden on an element because its descendant retained focus").
// Se le quita el foco justo cuando se oculta su pantalla: el observador corre antes de que
// el navegador revise la accesibilidad. En Android e iOS no hace nada.
export function useSoltarFocoOculto() {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const observador = new MutationObserver(() => {
      const activo = document.activeElement;
      if (activo instanceof HTMLElement && activo.closest('[aria-hidden="true"]')) activo.blur();
    });
    observador.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-hidden"],
      subtree: true,
    });
    return () => observador.disconnect();
  }, []);
}
