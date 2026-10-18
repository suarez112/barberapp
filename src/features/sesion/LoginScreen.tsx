import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import Selector from "@/components/ui/Selector";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useIniciarSesionCuenta } from "@/features/cuenta/useIniciarSesionCuenta";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useIniciarSesion } from "./useIniciarSesion";

type Modo = "PERSONAL" | "EMPRESA";

const MODOS = [
  { id: "PERSONAL", label: "Personal" },
  { id: "EMPRESA", label: "Empresa" },
] as const;

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const iniciarSesion = useIniciarSesion();
  const iniciarSesionCuenta = useIniciarSesionCuenta();
  const [modo, setModo] = useState<Modo>("PERSONAL");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  const ingresar = async () => {
    if (modo === "EMPRESA") {
      // El admin va a su panel; un cliente solo a su apartado
      const rol = await iniciarSesionCuenta(usuario, clave);
      if (!rol) return;
      setUsuario("");
      setClave("");
      replace(rol === "admin" ? "/admin" : "/cliente");
      return;
    }
    if (await iniciarSesion(usuario, clave)) {
      setUsuario("");
      setClave("");
      replace("/panel");
    }
  };

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    setUsuario("");
    setClave("");
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <TituloSeccion>ACCESO INTEGRANTES Y ADMINISTRADORES</TituloSeccion>
        <Selector opciones={MODOS} valor={modo} onCambiar={cambiarModo} />
        <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
          {modo === "PERSONAL"
            ? "Integrantes del equipo con usuario. Infinity Barbería: `jhon` / `1234` | Salón Glamour: `carlos` / `5678`"
            : "Administradores de empresa: el correo con el que registraste el negocio."}
        </Text>

        <View style={styles.formulario}>
          <CampoTexto
            placeholder={modo === "PERSONAL" ? "Usuario" : "Correo"}
            accessibilityLabel={modo === "PERSONAL" ? "Usuario" : "Correo"}
            keyboardType={modo === "EMPRESA" ? "email-address" : "default"}
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
