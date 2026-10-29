import { Stack } from "expo-router";
import ContenedorWeb from "@/components/layout/ContenedorWeb";
import AppProviders from "@/providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <ContenedorWeb>
        <Stack screenOptions={{ headerShown: false }} />
      </ContenedorWeb>
    </AppProviders>
  );
}
