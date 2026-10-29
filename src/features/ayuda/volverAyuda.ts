import { useRouter } from "expo-router";

// Flecha de las pantallas de ayuda: vuelve a la anterior o, si no hay, al inicio
export function useVolver() {
  const { back, canGoBack, replace } = useRouter();
  return () => {
    if (canGoBack()) back();
    else replace("/");
  };
}
