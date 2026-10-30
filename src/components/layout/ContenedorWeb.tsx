import { usePathname } from "expo-router";
import { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

// Ancho cómodo para leer en una pantalla grande
const ANCHO_MAXIMO = 760;

// En la web, centra la app con un ancho máximo para que no se estire de lado a lado.
// El panel del superadmin y la página principal ("/") conservan su diseño de ancho completo. En el celular no hace nada.
export default function ContenedorWeb({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const ruta = usePathname();
  if (Platform.OS !== "web" || ruta.startsWith("/superadmin") || ruta === "/") return <>{children}</>;
  return (
    <View style={[styles.fondo, { backgroundColor: colors.bg }]}>
      <View style={styles.columna}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, alignItems: "center" },
  columna: { flex: 1, width: "100%", maxWidth: ANCHO_MAXIMO },
});
