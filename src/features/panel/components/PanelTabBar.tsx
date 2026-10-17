import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/theme/ThemeProvider";

export type PestanaPanel =
  | "AGENDAMIENTOS"
  | "BLOQUEOS"
  | "CLIENTES"
  | "CARTERA"
  | "NEGOCIO";

type Pestana = {
  id: PestanaPanel;
  icono: ComponentProps<typeof Ionicons>["name"];
  label: string;
  soloAdmin: boolean;
};

// Para agregar una sección nueva al panel, se agrega aquí y en PanelScreen
export const PESTANAS: Pestana[] = [
  { id: "AGENDAMIENTOS", icono: "list", label: "Agenda", soloAdmin: false },
  { id: "BLOQUEOS", icono: "calendar-outline", label: "Bloqueos", soloAdmin: true },
  { id: "CLIENTES", icono: "person-add-outline", label: "Clientes", soloAdmin: false },
  { id: "CARTERA", icono: "wallet-outline", label: "Cartera", soloAdmin: false },
  { id: "NEGOCIO", icono: "storefront-outline", label: "Negocio", soloAdmin: true },
];

type Props = {
  activa: PestanaPanel;
  esAdmin: boolean;
  onCambiar: (p: PestanaPanel) => void;
};

export default function PanelTabBar({ activa, esAdmin, onCambiar }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.barra,
        { backgroundColor: colors.bottomBarBg, borderTopColor: colors.cardBorder },
      ]}
    >
      {PESTANAS.filter((t) => !t.soloAdmin || esAdmin).map((t) => {
        const color = activa === t.id ? colors.primary : colors.textSecondary;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa === t.id }}
            style={styles.pestana}
            onPress={() => onCambiar(t.id)}
          >
            <Ionicons name={t.icono} size={18} color={color} />
            <Text style={[styles.label, { color }]}>{t.label}</Text>
          </Pressable>
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
