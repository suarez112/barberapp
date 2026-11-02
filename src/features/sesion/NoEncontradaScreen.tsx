import { Redirect, usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PantallaMarca from "@/components/layout/PantallaMarca";
import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";

// Direcciones viejas de la página de pago (/panel/pagar, /admin/pagar): llevan a /pagar
const RUTA_DE_PAGO = /^\/(panel|admin)\/pagar\/?$/;

// Página para direcciones que no existen (reemplaza la pantalla de error de Expo)
export default function NoEncontradaScreen() {
  const { colors } = useAppTheme();
  const ruta = usePathname();
  const { replace } = useRouter();
  if (RUTA_DE_PAGO.test(ruta)) return <Redirect href="/pagar" />;

  return (
    <PantallaMarca titulo="No encontramos esta página" centrado>
      <View style={styles.contenido}>
        <Text style={[styles.texto, { color: colors.textSecondary }]}>
          La dirección que abriste no existe o ya cambió de lugar.
        </Text>
        <Boton
          titulo="IR AL INICIO"
          ayuda="Abre la pantalla de inicio de la aplicación"
          onPress={() => replace("/")}
        />
      </View>
    </PantallaMarca>
  );
}

const styles = StyleSheet.create({
  contenido: { gap: 20, width: "100%", maxWidth: 420, alignSelf: "center", paddingVertical: 24 },
  texto: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
