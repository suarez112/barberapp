import { Platform } from "react-native";

// Sustituye este valor por la IP IPv4 de tu PC (obtenida con ipconfig)
const IP_COMPUTADORA = "192.168.137.175";

export const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:4000"
    : `http://${IP_COMPUTADORA}:4000`;
