import { StyleSheet, Text, View } from "react-native";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { PerfilEmpresa } from "../../cuenta/api";
import CodigoQr from "../../enlace/CodigoQr";
import EnlacePublico from "../../enlace/EnlacePublico";
import { useGuia } from "../../guia/guiaContexto";

// "Tu enlace público": la dirección para compartir, con su código QR
export default function EnlacePublicoNegocio({ perfil }: { perfil: PerfilEmpresa }) {
  const { colors } = useAppTheme();
  const { marcarEnlace } = useGuia();
  if (!perfil.enlacePublico) return null;
  return (
    <View>
      <TituloSeccion>TU ENLACE PÚBLICO</TituloSeccion>
      <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
        Tus clientes lo abren y entran directo a reservar en tu negocio. Si cambias el código, el
        enlace cambia con él.
      </Text>
      <EnlacePublico
        enlace={perfil.enlacePublico}
        nombreNegocio={perfil.nombre}
        onCompartido={marcarEnlace}
      />
      <CodigoQr enlace={perfil.enlacePublico} codigo={perfil.codigoAcceso} />
    </View>
  );
}

const styles = StyleSheet.create({
  ayuda: { fontSize: 12, marginBottom: 8 },
});
