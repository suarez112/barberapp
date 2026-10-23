import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { TipoDocumento } from "./api";
import AvisoPrivacidad from "./AvisoPrivacidad";
import DocumentoLegalModal from "./DocumentoLegalModal";

type Props = {
  aceptada: boolean;
  onCambiar: (aceptada: boolean) => void;
  // Qué falta; se muestra debajo de la casilla
  error?: string | null;
};

// Casilla obligatoria (empieza sin marcar) para autorizar el tratamiento de datos
// y aceptar los Términos. El texto corto con los enlaces siempre se ve; el Aviso de
// privacidad completo va plegado debajo y cada enlace abre su documento en un modal.
export default function CasillaAutorizacion({ aceptada, onCambiar, error }: Props) {
  const { colors } = useAppTheme();
  const [abierto, setAbierto] = useState<TipoDocumento | null>(null);

  const enlace = (texto: string, tipo: TipoDocumento) => (
    <Text
      accessibilityRole="link"
      style={[styles.enlace, { color: colors.primaryText }]}
      onPress={() => setAbierto(tipo)}
    >
      {texto}
    </Text>
  );

  return (
    <>
      {/* La casilla y el texto con enlaces son hermanos: ningún tocable queda dentro de otro */}
      <View style={styles.fila}>
        <Tocable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: aceptada }}
          accessibilityLabel="Autorizo el tratamiento de mis datos personales y acepto los Términos y Condiciones"
          accessibilityHint={[error ? `Error: ${error}` : null, "Toca para marcar o desmarcar"]
            .filter(Boolean)
            .join(". ")}
          style={styles.casilla}
          onPress={() => onCambiar(!aceptada)}
        >
          <Ionicons
            name={aceptada ? "checkbox" : "square-outline"}
            size={26}
            color={error ? colors.error : colors.primaryText}
          />
        </Tocable>
        <Text
          style={[styles.texto, { color: colors.textPrimary }]}
          onPress={() => onCambiar(!aceptada)}
        >
          Autorizo el tratamiento de mis datos según la{" "}
          {enlace("Política de Datos", "politica-datos")} y acepto los{" "}
          {enlace("Términos y Condiciones", "terminos")}.
        </Text>
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
      {/* El aviso completo va plegado debajo de la casilla */}
      <AvisoPrivacidad />
      <DocumentoLegalModal tipo={abierto} onCerrar={() => setAbierto(null)} />
    </>
  );
}

// Aviso cuando se intenta continuar sin marcar la casilla
export const MENSAJE_AUTORIZACION =
  "Para continuar, marca la casilla para autorizar el tratamiento de tus datos personales y aceptar los Términos y Condiciones.";

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 6,
  },
  casilla: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  texto: { flex: 1, fontSize: 13, lineHeight: 18 },
  error: { fontSize: 12, marginBottom: 8, lineHeight: 16 },
  enlace: { fontWeight: "bold", textDecorationLine: "underline" },
});
