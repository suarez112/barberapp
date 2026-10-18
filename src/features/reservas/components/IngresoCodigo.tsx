import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAbrirNegocio } from "@/features/negocio/useAbrirNegocio";
import { useAppTheme } from "@/theme/ThemeProvider";

export default function IngresoCodigo() {
  const { colors } = useAppTheme();
  const abrirNegocio = useAbrirNegocio();
  const [codigo, setCodigo] = useState("");

  const entrar = async () => {
    if (await abrirNegocio(codigo)) setCodigo("");
  };

  return (
    <View style={styles.contenedor}>
      <TituloSeccion>INGRESA EL CÓDIGO DEL ESTABLECIMIENTO</TituloSeccion>
      <Text
        style={[
          estilosTexto.subtitulo,
          styles.ayuda,
          { color: colors.textSecondary },
        ]}
      >
        Ingresa el código facilitado (Prueba: `INFINITY` o `BUNKER`)
      </Text>

      <CampoTexto
        style={styles.campo}
        placeholder="Escribir Código (ej: INFINITY)"
        autoCapitalize="characters"
        value={codigo}
        onChangeText={setCodigo}
        onSubmitEditing={entrar}
      />

      <Boton titulo="ENTRAR AL NEGOCIO" onPress={entrar} style={styles.boton} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 30 },
  ayuda: { marginBottom: 15 },
  campo: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  boton: { marginTop: 10 },
});
