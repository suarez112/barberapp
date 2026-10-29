import { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";

type Props = {
  cargando: boolean;
  error: string | null;
  // Hay datos que mostrar (aunque sean los de la consulta anterior)
  hayDatos: boolean;
  onReintentar: () => void;
  children: ReactNode;
};

// Muestra los datos y, según el caso, un círculo de carga o el error con "Reintentar"
export default function EstadoCarga({ cargando, error, hayDatos, onReintentar, children }: Props) {
  const { colors } = useAppTheme();

  const reintentar = (
    <Boton titulo="REINTENTAR" ayuda="Vuelve a cargar los datos" onPress={onReintentar} style={styles.boton} />
  );

  if (!hayDatos) {
    if (error) {
      return (
        <View style={styles.centro}>
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          {reintentar}
        </View>
      );
    }
    return (
      <View style={styles.centro}>
        <ActivityIndicator accessibilityLabel="Cargando" color={colors.primaryText} />
      </View>
    );
  }

  return (
    <View>
      {error ? (
        <View style={[styles.aviso, { borderColor: colors.error }]}>
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
          {reintentar}
        </View>
      ) : null}
      <View style={cargando ? styles.cargando : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: "center", paddingVertical: 48 },
  error: { fontSize: 14, textAlign: "center", marginBottom: 12 },
  boton: { alignSelf: "center", minWidth: 160 },
  aviso: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, alignItems: "center" },
  cargando: { opacity: 0.5 },
});
