import { ReactNode, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/theme/ThemeProvider";
import AppHeader, { OpcionesCabecera } from "./AppHeader";

type Props = {
  children: ReactNode;
  cabecera?: OpcionesCabecera;
  // Contenido fijo bajo el scroll (ej. barra de pestañas)
  pie?: ReactNode;
  // Con esta función se puede deslizar hacia abajo para actualizar
  alRefrescar?: () => Promise<unknown>;
};

// Estructura común de todas las pantallas: cabecera, contenido con scroll y pie
export default function Pantalla({ children, cabecera, pie, alRefrescar }: Props) {
  const { colors, esOscuro } = useAppTheme();
  const [refrescando, setRefrescando] = useState(false);
  const refrescar = async () => {
    if (!alRefrescar) return;
    setRefrescando(true);
    try {
      await alRefrescar();
    } finally {
      setRefrescando(false);
    }
  };
  return (
    <SafeAreaView style={[styles.contenedor, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={esOscuro ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />
      <AppHeader {...cabecera} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contenedor}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={styles.scroll}
          automaticallyAdjustKeyboardInsets
          // Un botón o una opción se toca a la primera aunque el teclado esté abierto
          // (también las listas en modales, que reciben los toques a través de este ScrollView)
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            alRefrescar ? (
              <RefreshControl
                refreshing={refrescando}
                onRefresh={refrescar}
                colors={[colors.primary]}
                tintColor={colors.primaryText}
              />
            ) : undefined
          }
        >
          {children}
          <View style={styles.espacioFinal} />
        </ScrollView>
      </KeyboardAvoidingView>
      {pie}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  espacioFinal: { height: 40 },
});
