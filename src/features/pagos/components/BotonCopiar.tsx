import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";

type Props = { texto: string; nombre: string };

// Copia un dato (número de Nequi, llave Bre-B) y lo confirma con "Copiado"
export default function BotonCopiar({ texto, nombre }: Props) {
  const { colors } = useAppTheme();
  const [copiado, setCopiado] = useState(false);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reloj.current), []);

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(texto);
      setCopiado(true);
      clearTimeout(reloj.current);
      reloj.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      avisar("No se pudo copiar", `Selecciona y copia ${nombre} a mano.`, "error");
    }
  };

  return (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel={copiado ? `${nombre} copiado` : `Copiar ${nombre}`}
      accessibilityHint={`Copia ${nombre} para pegarlo en tu app de pagos`}
      onPress={copiar}
      style={[styles.boton, { backgroundColor: colors.secundarioBg, borderColor: colors.secundarioBorde }]}
    >
      <Ionicons name={copiado ? "checkmark" : "copy-outline"} size={18} color={colors.secundarioTexto} />
      <Text style={[styles.texto, { color: colors.secundarioTexto }]}>{copiado ? "Copiado" : "Copiar"}</Text>
    </Tocable>
  );
}

const styles = StyleSheet.create({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  texto: { fontSize: 14, fontWeight: "bold" },
});
