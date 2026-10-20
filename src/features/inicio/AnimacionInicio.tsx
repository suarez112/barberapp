import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { APP_NOMBRE } from "@/config/app";
import { useAppTheme } from "@/theme/ThemeProvider";

const DURACION_MS = 1800;

// Logo y nombre que aparecen con un pequeño rebote antes de elegir el perfil
export default function AnimacionInicio({ onTerminar }: { onTerminar: () => void }) {
  const { colors } = useAppTheme();
  const [logo] = useState(() => new Animated.Value(0));
  const [nombre] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logo, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.back(1.8)),
        useNativeDriver: true,
      }),
      Animated.timing(nombre, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    const espera = setTimeout(onTerminar, DURACION_MS);
    return () => clearTimeout(espera);
  }, [logo, nombre, onTerminar]);

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.bg }]}>
      <Animated.View
        style={[
          styles.logo,
          { backgroundColor: colors.primary, opacity: logo, transform: [{ scale: logo }] },
        ]}
      >
        <Ionicons name="calendar" size={64} color={colors.onPrimary} />
      </Animated.View>
      <Animated.Text
        accessibilityRole="header"
        style={[
          styles.nombre,
          {
            color: colors.primaryText,
            opacity: nombre,
            transform: [{ translateY: nombre.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          },
        ]}
      >
        {APP_NOMBRE.toUpperCase()}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  logo: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  nombre: { fontSize: 26, fontWeight: "bold", letterSpacing: 2 },
});
