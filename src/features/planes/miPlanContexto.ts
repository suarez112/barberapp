import { createContext, useContext } from "react";

// Web con pagos manuales: "Cambiar de plan" y los candados llevan a la sección "Mi plan" del panel
// en lugar de abrir la ventana de planes. Null = se conserva el comportamiento de siempre.
export const MiPlanContexto = createContext<(() => void) | null>(null);

export const useIrAMiPlan = () => useContext(MiPlanContexto);
