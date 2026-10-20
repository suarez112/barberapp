import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
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
// y aceptar los Términos. Encima va el Aviso de privacidad corto y cada enlace abre
// su documento en un modal.
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
      <AvisoPrivacidad />
      <Tocable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceptada }}
        accessibilityLabel="Autorizo el tratamiento de mis datos personales y acepto los Términos y Condiciones"
        accessibilityHint={[
          error ? `Error: ${error}` : null,
          "Toca para marcar o desmarcar. Usa las acciones para leer cada documento",
        ]
          .filter(Boolean)
          .join(". ")}
        accessibilityActions={[
          { name: "politica", label: "Leer la política de tratamiento de datos" },
          { name: "terminos", label: "Leer los Términos y Condiciones" },
        ]}
        onAccessibilityAction={(e) =>
          setAbierto(e.nativeEvent.actionName === "politica" ? "politica-datos" : "terminos")
        }
        style={styles.fila}
        onPress={() => onCambiar(!aceptada)}
      >
        <Ionicons
          name={aceptada ? "checkbox" : "square-outline"}
          size={26}
          color={error ? colors.error : colors.primaryText}
        />
        <Text style={[styles.texto, { color: colors.textPrimary }]}>
          Autorizo el {enlace("tratamiento de mis datos personales", "politica-datos")} y
          acepto los {enlace("Términos y Condiciones", "terminos")}
        </Text>
      </Tocable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
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
    gap: 10,
    marginVertical: 10,
    paddingHorizontal: 4,
    minHeight: 44,
  },
  texto: { flex: 1, fontSize: 13, lineHeight: 18 },
  error: { fontSize: 12, marginTop: -6, marginBottom: 8, lineHeight: 16 },
  enlace: { fontWeight: "bold", textDecorationLine: "underline" },
});
