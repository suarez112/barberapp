import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto from "@/components/ui/CampoTexto";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useIniciarSesion } from "../sesion/useIniciarSesion";

// Inicio de sesión dentro de la página de pago. En la web la sesión vive solo en memoria,
// así que al volver del pago hay que entrar otra vez para confirmarlo.
export default function LoginPago({ texto }: { texto: string }) {
  const { colors } = useAppTheme();
  const iniciar = useIniciarSesion();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (enviando) return;
    setEnviando(true);
    try {
      await iniciar(usuario, clave);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View>
      <Text style={[styles.texto, { color: colors.textSecondary }]}>{texto}</Text>
      <CampoTexto
        etiqueta="Correo o usuario"
        placeholder="ej: ejemplo@gmail.com"
        autoCapitalize="none"
        autoComplete="username"
        keyboardType="email-address"
        value={usuario}
        onChangeText={setUsuario}
      />
      <CampoClave etiqueta="Contraseña" value={clave} onChangeText={setClave} onSubmitEditing={entrar} />
      <Boton
        titulo={enviando ? "ENTRANDO…" : "ENTRAR"}
        ayuda="Inicia sesión para continuar con el pago"
        deshabilitado={enviando}
        onPress={entrar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  texto: { fontSize: 14, marginBottom: 12 },
});
