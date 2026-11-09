import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import TarjetaMenu from "@/components/ui/TarjetaMenu";
import { useAppTheme } from "@/theme/ThemeProvider";
import PaginaLegal, { useMenuLateral } from "./PaginaLegal";
import { ENTRADAS_LEGALES } from "./secciones";

// /legales: índice público del Centro Legal. En el computador los documentos están en
// el menú lateral; en el celular, como tarjetas.
export default function CentroLegalScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const menuLateral = useMenuLateral();

  return (
    <PaginaLegal tituloPestana="Centro Legal" activa={null}>
      <Text accessibilityRole="header" style={[styles.titulo, { color: colors.primaryText }]}>
        CENTRO LEGAL
      </Text>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        {menuLateral
          ? "Aquí están los documentos que regulan el uso de la plataforma y el tratamiento de tus datos. Elige uno en el menú para leerlo o radica una PQRS."
          : "Aquí están los documentos que regulan el uso de la plataforma y el tratamiento de tus datos."}
      </Text>
      {menuLateral
        ? null
        : ENTRADAS_LEGALES.map((e) => (
            <TarjetaMenu
              key={e.clave}
              icono={e.icono}
              titulo={e.nombre}
              descripcion={e.descripcion}
              onPress={() => router.push(e.ruta)}
            />
          ))}
    </PaginaLegal>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 18, fontWeight: "bold", letterSpacing: 1, marginTop: 8 },
  intro: { fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 20 },
});
