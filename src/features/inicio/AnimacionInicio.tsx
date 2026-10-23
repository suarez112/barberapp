import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from "react-native";
import { APP_LEMA, APP_NOMBRE } from "@/config/app";
import { useAppTheme } from "@/theme/ThemeProvider";

const DURACION_MS = 1800;

// Mini intro: el logo aparece con un brillo suave, luego el nombre y el lema, con un
// indicador de carga abajo. Dura menos de 2 s y sigue la elección de perfil.
export default function AnimacionInicio({ onTerminar }: { onTerminar: () => void }) {
  const { colors } = useAppTheme();
  const [logo] = useState(() => new Animated.Value(0));
  const [brillo] = useState(() => new Animated.Value(0));
  const [textos] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logo, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // El brillo sube y baja una vez, suave
      Animated.sequence([
        Animated.timing(brillo, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(brillo, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(textos, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
    const espera = setTimeout(onTerminar, DURACION_MS);
    return () => clearTimeout(espera);
  }, [logo, brillo, textos, onTerminar]);

  return (
    <View style={[styles.contenedor, { backgroundColor: colors.bg }]}>
      <View style={styles.zonaLogo}>
        <Animated.View
          style={[
            styles.brillo,
            {
              backgroundColor: colors.primary,
              opacity: brillo.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }),
              transform: [{ scale: brillo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) }],
            },
          ]}
        />
        <Animated.Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`Logo de ${APP_NOMBRE}`}
          source={require("../../../assets/logo.png")}
          style={[
            styles.logo,
            { opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] },
          ]}
        />
      </View>
      <Animated.View
        style={{
          alignItems: "center",
          gap: 6,
          opacity: textos,
          transform: [{ translateY: textos.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <Animated.Text accessibilityRole="header" style={[styles.nombre, { color: colors.primaryText }]}>
          {APP_NOMBRE}
        </Animated.Text>
        <Animated.Text style={[styles.lema, { color: colors.textSecondary }]}>{APP_LEMA}</Animated.Text>
      </Animated.View>
      <ActivityIndicator
        accessibilityLabel="Cargando"
        color={colors.primaryText}
        style={styles.cargando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24, padding: 24 },
  zonaLogo: { width: 180, height: 180, alignItems: "center", justifyContent: "center" },
  brillo: { position: "absolute", width: 180, height: 180, borderRadius: 90 },
  logo: { width: 140, height: 140, resizeMode: "contain" },
  nombre: { fontSize: 30, fontWeight: "bold", letterSpacing: 1 },
  lema: { fontSize: 15, textAlign: "center" },
  cargando: { position: "absolute", bottom: 56 },
});
