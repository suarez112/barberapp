import ContenedorWeb from "@/components/layout/ContenedorWeb";
import AppProviders from "@/providers/AppProviders";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

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
