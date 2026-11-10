import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import { APP_NOMBRE } from "@/config/app";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useVolver } from "./volverAyuda";

export default function AcercaDeScreen() {
  const { colors } = useAppTheme();
  const volver = useVolver();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>ACERCA DE</Text>
        <Text style={[styles.nombre, { color: colors.textPrimary }]}>{APP_NOMBRE}</Text>
        <Text style={[styles.version, { color: colors.textSecondary }]}>Versión {version}</Text>
        <Boton
          titulo="TÉRMINOS Y CONDICIONES"
          ayuda="Abre los Términos y Condiciones de uso"
          variante="secundario"
          onPress={() => router.push("/legales/terminos")}
          style={styles.boton}
        />
        <Boton
          titulo="POLÍTICA DE DATOS"
          ayuda="Abre la Política de Tratamiento de Datos Personales"
          variante="secundario"
          onPress={() => router.push("/legales/politica-de-datos")}
          style={styles.boton}
        />
        <Boton
          titulo="AVISO DE PRIVACIDAD"
          ayuda="Abre el Aviso de Privacidad"
          variante="secundario"
          onPress={() => router.push("/legales/aviso-privacidad")}
          style={styles.boton}
        />
        <Boton
          titulo="CENTRO LEGAL"
          ayuda="Abre el índice de documentos legales y PQRS"
          variante="secundario"
          onPress={() => router.push("/legales")}
          style={styles.boton}
        />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 24 },
  titulo: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  nombre: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 24 },
  version: { fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 24 },
  boton: { marginBottom: 12 },
});
