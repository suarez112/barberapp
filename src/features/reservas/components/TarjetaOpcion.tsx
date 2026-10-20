import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  seleccionada: boolean;
  onPress: () => void;
  // Lo que lee TalkBack / VoiceOver
  etiqueta: string;
  ayuda: string;
  children: ReactNode;
};

// Tarjeta de la cuadrícula de 2 columnas (profesionales y servicios)
export default function TarjetaOpcion({ seleccionada, onPress, etiqueta, ayuda, children }: Props) {
  const { colors } = useAppTheme();
  return (
    <Tocable
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionada }}
      accessibilityLabel={etiqueta}
      accessibilityHint={ayuda}
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        seleccionada && {
          borderColor: colors.primary,
          backgroundColor: colors.cardSelectedBg,
        },
      ]}
      onPress={onPress}
    >
      {children}
    </Tocable>
  );
}

export const estilosCuadricula = StyleSheet.create({
  cuadricula: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
});

const styles = StyleSheet.create({
  tarjeta: { width: "48%", padding: 12, borderRadius: 8, borderWidth: 1 },
});
