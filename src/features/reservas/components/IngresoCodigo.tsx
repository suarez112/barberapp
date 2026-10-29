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
  const [error, setError] = useState<string | null>(null);

  const entrar = async () => {
    if (!codigo.trim()) {
      setError("Escribe el código que te dio el negocio.");
      return;
    }
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
        Ingresa el código que te dio el negocio
      </Text>

      <CampoTexto
        etiqueta="Código del negocio"
        error={error}
        ayuda="Letras y números que te dio el negocio"
        placeholder="Letras y números, máximo 10"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={10}
        value={codigo}
        onChangeText={(t) => {
          setCodigo(t);
          setError(null);
        }}
        onSubmitEditing={entrar}
        estiloTexto={styles.campo}
        centrado
      />

      <Boton
        titulo="ENTRAR AL NEGOCIO"
        ayuda="Abre el negocio para ver sus servicios y reservar"
        onPress={entrar}
        style={styles.boton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 30 },
  ayuda: { marginBottom: 15 },
  campo: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  boton: { marginTop: 10 },
});
