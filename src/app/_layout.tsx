import ContenedorWeb from "@/components/layout/ContenedorWeb";
import AppProviders from "@/providers/AppProviders";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";

SplashScreen.preventAutoHideAsync().catch(() => {});

const TITULOS_RUTAS: Record<string, string> = {
  "/login": "Iniciar sesión – Agendality",
  "/registro": "Registra tu negocio – Agendality",
  "/recuperar-clave": "Recuperar contraseña – Agendality",
  "/cliente": "Reservar cita – Agendality",
  "/mis-negocios": "Mis negocios – Agendality",
  "/mis-citas": "Mis citas – Agendality",
  "/cuenta-cliente": "Mi cuenta – Agendality",
  "/pagar": "Suscripción y pagos – Agendality",
  "/acerca-de": "Acerca de – Agendality",
  "/ayuda": "Ayuda – Agendality",
  "/pqrs": "PQRS – Agendality",
  "/legales": "Centro legal – Agendality",
  "/legales/terminos": "Términos y condiciones – Agendality",
  "/terminos": "Términos y condiciones – Agendality",
  "/legales/politica-de-datos": "Política de datos – Agendality",
  "/politica-de-datos": "Política de datos – Agendality",
  "/legales/aviso-privacidad": "Aviso de privacidad – Agendality",
  "/aviso-privacidad": "Aviso de privacidad – Agendality",
  "/admin": "Panel de administración – Agendality",
  "/superadmin": "Superadmin – Agendality",
};

export default function RootLayout() {
  const ruta = usePathname();
  const [fuentesCargadas, errorFuentes] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.lang = "es";
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    // La Landing (/) ya gestiona su propio <Head><title>
    if (ruta === "/") return;

    const titulo =
      TITULOS_RUTAS[ruta] ??
      (ruta.startsWith("/pagar/")
        ? "Suscripción y pagos – Agendality"
        : "Reservar cita – Agendality");

    document.title = titulo;
  }, [ruta]);

  useEffect(() => {
    if (fuentesCargadas || errorFuentes) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fuentesCargadas, errorFuentes]);

  if (!fuentesCargadas && !errorFuentes) {
    return null;
  }

  return (
    <AppProviders>
      <ContenedorWeb>
        <Stack screenOptions={{ headerShown: false }} />
      </ContenedorWeb>
    </AppProviders>
  );
}
