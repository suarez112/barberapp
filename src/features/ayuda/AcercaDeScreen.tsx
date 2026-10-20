import Constants from "expo-constants";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import { APP_NOMBRE } from "@/config/app";
import DocumentoLegalModal from "@/features/legal/DocumentoLegalModal";
import { TipoDocumento } from "@/features/legal/api";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useVolver } from "./volverAyuda";

export default function AcercaDeScreen() {
  const { colors } = useAppTheme();
  const volver = useVolver();
  const [documento, setDocumento] = useState<TipoDocumento | null>(null);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>ACERCA DE</Text>
        <Text style={[styles.nombre, { color: colors.textPrimary }]}>{APP_NOMBRE}</Text>
        <Text style={[styles.version, { color: colors.textSecondary }]}>Versión {version}</Text>
        <Boton
          titulo="POLÍTICA DE DATOS"
          ayuda="Abre la Política de Tratamiento de Datos Personales"
          variante="neutro"
          onPress={() => setDocumento("politica-datos")}
          style={styles.boton}
        />
        <Boton
          titulo="TÉRMINOS Y CONDICIONES"
          ayuda="Abre los Términos y Condiciones de uso"
          variante="neutro"
          onPress={() => setDocumento("terminos")}
          style={styles.boton}
        />
      </View>
      <DocumentoLegalModal tipo={documento} onCerrar={() => setDocumento(null)} />
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
