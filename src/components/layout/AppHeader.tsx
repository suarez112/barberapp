import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { APP_NOMBRE } from "@/config/app";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import BotonCabecera from "./BotonCabecera";
import MenuCabecera from "./MenuCabecera";

export type OpcionesCabecera = {
  onVolver?: () => void;
  // Cerrar sesión (pide confirmación); aparece en el menú
  onSalir?: () => void;
};

// Alto fijo de la barra: los botones miden 44 px
const ALTO = 56;

// Barra compacta: volver (si aplica), nombre del negocio y un menú con el tema
// y, con una sesión abierta, "Cerrar sesión"
export default function AppHeader({ onVolver, onSalir }: OpcionesCabecera) {
  const { colors } = useAppTheme();
  const { empresa } = useNegocio();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <View
      style={[
        styles.barra,
        { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder },
      ]}
    >
      {onVolver ? (
        <Tocable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          accessibilityHint="Regresa a la pantalla anterior"
          style={styles.volver}
          onPress={onVolver}
        >
          <Ionicons name="arrow-back-outline" size={24} color={colors.primaryText} />
        </Tocable>
      ) : null}

      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[styles.titulo, { color: colors.primaryText }]}
      >
        {empresa ? empresa.nombre : APP_NOMBRE.toUpperCase()}
      </Text>

      <BotonCabecera
        icono="menu-outline"
        etiqueta="Menú"
        ayuda={onSalir ? "Abre las opciones de tema y cerrar sesión" : "Abre las opciones de tema"}
        onPress={() => setMenuAbierto(true)}
      />

      <MenuCabecera
        visible={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        onSalir={onSalir}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: ALTO,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  volver: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  titulo: { flex: 1, fontSize: 16, fontWeight: "bold", letterSpacing: 0.5, paddingHorizontal: 4 },
});
