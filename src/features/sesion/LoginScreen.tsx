import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useIniciarSesion } from "./useIniciarSesion";

// Una sola pantalla de ingreso: la administradora, el personal y los clientes
// con cuenta entran con su correo o usuario; el backend decide adónde va cada quien.
export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const iniciarSesion = useIniciarSesion();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  const ingresar = async () => {
    if (enviando) return;
    setEnviando(true);
    const destino = await iniciarSesion(usuario, clave);
    setEnviando(false);
    if (!destino) return;
    setUsuario("");
    setClave("");
    replace(destino);
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <TituloSeccion>INICIAR SESIÓN</TituloSeccion>
        <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
          Administradoras, equipo del negocio y clientes con cuenta: entra con tu correo o tu usuario.
        </Text>

        <View style={styles.formulario}>
          <CampoTexto
            placeholder="Correo o usuario"
            accessibilityLabel="Correo o usuario"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            value={usuario}
            onChangeText={setUsuario}
          />
          <CampoClave
            placeholder="Contraseña"
            accessibilityLabel="Contraseña"
            autoComplete="current-password"
            value={clave}
            onChangeText={setClave}
            onSubmitEditing={ingresar}
          />
          <Boton
            titulo={enviando ? "INGRESANDO…" : "INGRESAR"}
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
