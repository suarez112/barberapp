import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";

export type PestanaPanel =
  | "AGENDAMIENTOS"
  | "BLOQUEOS"
  | "CLIENTES"
  | "CARTERA"
  | "NEGOCIO"
  | "MI_NEGOCIO"
  // Solo con la suscripción vencida
  | "PLANES";

export type Pestana = {
  id: PestanaPanel;
  icono: ComponentProps<typeof Ionicons>["name"];
  label: string;
};

type Props = {
  pestanas: Pestana[];
  activa: PestanaPanel;
  onCambiar: (p: PestanaPanel) => void;
};

export default function PanelTabBar({ pestanas, activa, onCambiar }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.barra,
        { backgroundColor: colors.bottomBarBg, borderTopColor: colors.cardBorder },
      ]}
    >
      {pestanas.map((t) => {
        const color = activa === t.id ? colors.primary : colors.textSecondary;
        return (
          <Tocable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa === t.id }}
            style={styles.pestana}
            onPress={() => onCambiar(t.id)}
          >
            <Ionicons name={t.icono} size={18} color={color} />
            <Text style={[styles.label, { color }]}>{t.label}</Text>
          </Tocable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: 10,
    justifyContent: "space-around",
  },
  pestana: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 10, marginTop: 3, fontWeight: "600" },
});
