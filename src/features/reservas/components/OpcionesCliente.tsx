import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import TarjetaMenu from "@/components/ui/TarjetaMenu";
import { useAppTheme } from "@/theme/ThemeProvider";

// "Soy cliente": reservar sin cuenta o con una cuenta (opcional)
export default function OpcionesCliente({ onInvitado, grande = false }: { onInvitado: () => void; grande?: boolean }) {
  const { colors } = useAppTheme();
  const { push } = useRouter();
  return (
    <View style={grande ? styles.contenedorGrande : styles.contenedor}>
      {/* Con la franja de marca (versión grande) el título ya está en la franja */}
      {grande ? null : <Text style={[styles.titulo, { color: colors.primaryText }]}>¿CÓMO QUIERES RESERVAR?</Text>}
      <Text style={[styles.subtitulo, grande && styles.subtituloGrande, { color: colors.textSecondary }]}>
        La cuenta es opcional: puedes reservar solo con el código del negocio.
      </Text>
      <TarjetaMenu
        icono="ticket-outline"
        titulo="Continuar como invitado"
        descripcion="Escribe el código del establecimiento y reserva"
        grande={grande}
        onPress={onInvitado}
      />
      <TarjetaMenu
        icono="person-circle-outline"
        titulo="Crear cuenta / Iniciar sesión"
        descripcion="Guarda tus negocios, reserva sin escribir tus datos y mira tus citas"
        grande={grande}
        onPress={() => push("/cuenta-cliente")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 40 },
  contenedorGrande: { marginTop: 16 },
  titulo: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  subtitulo: { fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 30 },
  subtituloGrande: { marginTop: 0, marginBottom: 20 },
});
