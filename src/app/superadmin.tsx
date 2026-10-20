import { Redirect } from "expo-router";
import { ComponentType } from "react";

// Panel del superadministrador: solo existe en la versión web. En Android e iOS la
// condición se resuelve al compilar, así que el código del panel ni siquiera entra
// en la app; si alguien abre /superadmin allí, vuelve al inicio.
const PanelWeb: ComponentType | null =
  process.env.EXPO_OS === "web"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/features/superadmin/SuperadminScreen").default
    : null;

export default function SuperadminSoloWeb() {
  return PanelWeb ? <PanelWeb /> : <Redirect href="/" />;
}
