import { Ionicons } from "@expo/vector-icons";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { ComponentProps, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import Pantalla from "@/components/layout/Pantalla";
import PantallaMarca from "@/components/layout/PantallaMarca";
import TarjetaMenu from "@/components/ui/TarjetaMenu";
import { useNegocio } from "@/features/negocio/NegocioProvider";
import { useDisenoMovil } from "@/hooks/useDisenoMovil";
import { useAppTheme } from "@/theme/ThemeProvider";

type Opcion = {
  ruta: Href;
  icono: ComponentProps<typeof Ionicons>["name"];
  titulo: string;
  descripcion: string;
};

const OPCIONES: Opcion[] = [
  {
    ruta: "/registro",
    icono: "storefront-outline",
    titulo: "Soy empresa",
    descripcion: "Registra tu negocio y empieza tu prueba gratuita de 15 días",
  },
  {
    ruta: "/cliente",
    icono: "person-outline",
    titulo: "Soy cliente",
    descripcion: "Reserva como invitado con el código del establecimiento, o con tu cuenta",
  },
];

export default function SeleccionRolScreen() {
  const { colors } = useAppTheme();
  const { push } = useRouter();
  const { salirDelNegocio } = useNegocio();
  const movil = useDisenoMovil();

  // Al volver aquí (flecha o botón atrás del sistema) no hay negocio activo
  useFocusEffect(useCallback(() => salirDelNegocio(), [salirDelNegocio]));

  const tarjetas = OPCIONES.map((o) => (
    <TarjetaMenu
      key={o.titulo}
      icono={o.icono}
      titulo={o.titulo}
      descripcion={o.descripcion}
      onPress={() => push(o.ruta)}
    />
  ));

  const enlaceLogin = (
    <>
      <Tocable
        accessibilityRole="link"
        accessibilityLabel="¿Ya tienes cuenta? Inicia sesión"
        accessibilityHint="Abre la pantalla para entrar con tu correo o usuario"
        style={styles.enlace}
        onPress={() => push("/login")}
      >
        <Text style={[styles.textoEnlace, { color: colors.textSecondary }]}>
          ¿Ya tienes cuenta?{" "}
          <Text style={{ color: colors.primaryText, textDecorationLine: "underline" }}>Inicia sesión</Text>
        </Text>
      </Tocable>
      <Text style={[styles.aclaracion, { color: colors.textSecondary }]}>
        Negocios, equipos de trabajo y clientes registrados
      </Text>
    </>
  );

  // Celular: franja de marca y las tarjetas centradas en el espacio que queda debajo
  if (movil) {
    return (
      <PantallaMarca titulo="¿Cómo deseas ingresar?" subtitulo="Selecciona tu perfil para continuar" centrado>
        {tarjetas}
        {enlaceLogin}
      </PantallaMarca>
    );
  }

  return (
    <Pantalla>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>
          ¿CÓMO DESEAS INGRESAR?
        </Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
          Selecciona tu perfil para continuar
        </Text>

        {tarjetas}
        {enlaceLogin}
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
  enlace: { alignSelf: "center", padding: 12, marginTop: 10 },
  textoEnlace: { fontSize: 14, fontWeight: "600" },
  aclaracion: { fontSize: 12, textAlign: "center", marginTop: -6 },
});
