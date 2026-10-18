import { Ionicons } from "@expo/vector-icons";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { ComponentProps, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import Pantalla from "@/components/layout/Pantalla";
import { estilosTexto } from "@/components/ui/estilosTexto";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useAppTheme } from "@/theme/ThemeProvider";

type Opcion = {
  ruta: Href;
  icono: ComponentProps<typeof Ionicons>["name"];
  titulo: string;
  descripcion: string;
};

const OPCIONES: Opcion[] = [
  {
    ruta: "/cliente",
    icono: "person-outline",
    titulo: "Soy Cliente",
    descripcion: "Agendar citas con el código del establecimiento",
  },
  {
    ruta: "/login",
    icono: "key-outline",
    titulo: "Acceso Equipo / Administrador",
    descripcion: "Ingreso directo con credenciales",
  },
];

export default function SeleccionRolScreen() {
  const { colors } = useAppTheme();
  const { push } = useRouter();
  const { salirDelNegocio } = useNegocio();

  // Al volver aquí (flecha o botón atrás del sistema) no hay negocio activo
  useFocusEffect(useCallback(() => salirDelNegocio(), [salirDelNegocio]));

  return (
    <Pantalla>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primary }]}>
          ¿CÓMO DESEAS INGRESAR?
        </Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
          Selecciona tu perfil para continuar
        </Text>

        {OPCIONES.map((o) => (
          <Tocable
            key={o.titulo}
            accessibilityRole="button"
            style={[
              styles.tarjeta,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
            ]}
            onPress={() => push(o.ruta)}
          >
            <Ionicons name={o.icono} size={32} color={colors.primary} />
            <View style={styles.textos}>
              <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
                {o.titulo}
              </Text>
              <Text
                style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}
              >
                {o.descripcion}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </Tocable>
        ))}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 40 },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitulo: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 30,
  },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
  },
  textos: { marginLeft: 14, flex: 1 },
});
