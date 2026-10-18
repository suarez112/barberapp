import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useIniciarSesion } from "./useIniciarSesion";

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const iniciarSesion = useIniciarSesion();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  const ingresar = async () => {
    if (await iniciarSesion(usuario, clave)) {
      setUsuario("");
      setClave("");
      replace("/panel");
    }
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <TituloSeccion>ACCESO INTEGRANTES Y ADMINISTRADORES</TituloSeccion>
        <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
          Infinity Barbería: `jhon` / `1234` | Salón Glamour: `carlos` / `5678`
        </Text>

        <View style={styles.formulario}>
          <CampoTexto
            placeholder="Usuario"
            autoCapitalize="none"
            value={usuario}
            onChangeText={setUsuario}
          />
          <CampoTexto
            placeholder="Contraseña"
            secureTextEntry
            value={clave}
            onChangeText={setClave}
            onSubmitEditing={ingresar}
          />
          <Boton
            titulo="INGRESAR AL SISTEMA"
            onPress={ingresar}
            style={styles.boton}
          />
        </View>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  formulario: { marginTop: 20 },
  boton: { marginTop: 10 },
});
