import { Platform } from "react-native";

// Planes, precios y pagos solo se muestran en la versión web. En Android e iOS la app
// no habla de dinero: los pagos se hacen fuera de la app del celular.
export const PAGOS_EN_APP = Platform.OS === "web";
