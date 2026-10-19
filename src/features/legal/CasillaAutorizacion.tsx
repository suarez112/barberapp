import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { TipoDocumento } from "./api";
import DocumentoLegalModal from "./DocumentoLegalModal";

type Props = { aceptada: boolean; onCambiar: (aceptada: boolean) => void };

// Casilla obligatoria (empieza sin marcar) para autorizar el tratamiento de datos
// y aceptar los Términos. Cada enlace abre su documento en un modal.
export default function CasillaAutorizacion({ aceptada, onCambiar }: Props) {
  const { colors } = useAppTheme();
  const [abierto, setAbierto] = useState<TipoDocumento | null>(null);

  const enlace = (texto: string, tipo: TipoDocumento) => (
    <Text
      accessibilityRole="link"
      style={[styles.enlace, { color: colors.primary }]}
      onPress={() => setAbierto(tipo)}
    >
      {texto}
    </Text>
  );

  return (
    <>
      <Tocable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: aceptada }}
        style={styles.fila}
        onPress={() => onCambiar(!aceptada)}
      >
        <Ionicons
          name={aceptada ? "checkbox" : "square-outline"}
          size={22}
          color={colors.primary}
        />
        <Text style={[styles.texto, { color: colors.textSecondary }]}>
          Autorizo el {enlace("tratamiento de mis datos personales", "politica-datos")} y
          acepto los {enlace("Términos y Condiciones", "terminos")}
        </Text>
      </Tocable>
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
  },
  texto: { flex: 1, fontSize: 12, lineHeight: 17 },
  enlace: { fontWeight: "bold", textDecorationLine: "underline" },
});
