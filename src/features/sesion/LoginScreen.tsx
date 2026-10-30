import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import PantallaMarca from "@/components/layout/PantallaMarca";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import Tocable from "@/components/ui/Tocable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useDisenoMovil } from "@/hooks/useDisenoMovil";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useIniciarSesion } from "./useIniciarSesion";

// Una sola pantalla de ingreso: la administradora, el personal y los clientes
// con cuenta entran con su correo o usuario; el backend decide adónde va cada quien.
export default function LoginScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, push, replace } = useRouter();
  const iniciarSesion = useIniciarSesion();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null);
  const [errorClave, setErrorClave] = useState<string | null>(null);

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  const ingresar = async () => {
    if (enviando) return;
    const faltaUsuario = !usuario.trim();
    setErrorUsuario(faltaUsuario ? "Escribe tu correo o tu nombre de usuario." : null);
    setErrorClave(!clave ? "Escribe tu contraseña." : null);
    if (faltaUsuario || !clave) return;
    setEnviando(true);
    const destino = await iniciarSesion(usuario, clave);
    setEnviando(false);
    if (!destino) return;
    setUsuario("");
    setClave("");
    replace(destino);
  };

  const movil = useDisenoMovil();

  const formulario = (
    <View style={styles.formulario}>
      <CampoTexto
        etiqueta="Correo o usuario"
        error={errorUsuario}
        ayuda="El correo o el nombre de usuario de tu cuenta"
        placeholder="ej: ejemplo@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        value={usuario}
        onChangeText={(t) => {
          setUsuario(t);
          setErrorUsuario(null);
        }}
      />
      <CampoClave
        etiqueta="Contraseña"
        error={errorClave}
        ayuda="La contraseña de tu cuenta"
        autoComplete="current-password"
        textContentType="password"
        value={clave}
        onChangeText={(t) => {
          setClave(t);
          setErrorClave(null);
        }}
        onSubmitEditing={ingresar}
      />
      <Boton
        titulo={enviando ? "INGRESANDO…" : "INGRESAR"}
        ayuda="Entra a tu panel o a tu cuenta de cliente"
        deshabilitado={enviando}
        onPress={ingresar}
        style={styles.boton}
      />
      <Tocable
        accessibilityRole="link"
        accessibilityLabel="¿Olvidaste tu contraseña?"
        accessibilityHint="Abre los pasos para cambiarla con un código enviado a tu correo"
        style={styles.enlace}
        onPress={() => push("/recuperar-clave")}
      >
        <Text style={[styles.textoEnlace, { color: colors.primaryText }]}>
          ¿Olvidaste tu contraseña?
        </Text>
      </Tocable>
    </View>
  );

  if (movil) {
    return (
      <PantallaMarca
        titulo="Bienvenido de nuevo"
        onVolver={volver}
        pie={
          <>
            <View style={styles.separador}>
              <View style={[styles.linea, { backgroundColor: colors.cardBorder }]} />
              <Text style={[styles.textoSeparador, { color: colors.textSecondary }]}>¿No tienes cuenta?</Text>
              <View style={[styles.linea, { backgroundColor: colors.cardBorder }]} />
            </View>
            <Boton
              titulo="Tengo un negocio: regístralo gratis"
              ayuda="Abre el registro de tu negocio"
              variante="secundario"
              style={{ backgroundColor: "transparent", borderColor: colors.inputBorder }}
              textStyle={styles.textoOpcion}
              onPress={() => push("/registro")}
            />
            <Boton
              titulo="Voy a reservar una cita"
              ayuda="Abre la reserva de citas como cliente"
              variante="secundario"
              style={{ backgroundColor: "transparent", borderColor: colors.inputBorder }}
              textStyle={styles.textoOpcion}
              onPress={() => push("/cliente")}
            />
          </>
        }
      >
        {formulario}
      </PantallaMarca>
    );
  }

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <TituloSeccion>INICIAR SESIÓN</TituloSeccion>
        <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
          Administradoras, equipo del negocio y clientes con cuenta: entra con tu correo o tu usuario.
        </Text>

        {formulario}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  formulario: { marginTop: 20 },
  boton: { marginTop: 10 },
  enlace: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  textoEnlace: { fontSize: 14, fontWeight: "bold", textDecorationLine: "underline" },
  separador: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  linea: { flex: 1, height: 1 },
  textoSeparador: { fontSize: 13, fontWeight: "600" },
  textoOpcion: { letterSpacing: 0, fontSize: 14 },
});
