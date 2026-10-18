import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { ErrorDeConexion, mensajeDeError } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { registrarEmpresa } from "./api";
import { useCuenta } from "./CuentaProvider";
import CamposEmpresa from "./formulario/CamposEmpresa";
import {
  VALORES_VACIOS,
  ValoresEmpresa,
  validarClave,
  validarEmpresa,
} from "./formulario/validarEmpresa";

// "Soy empresa": crea la empresa y su cuenta de administrador (prueba de 15 días)
export default function RegistroEmpresaScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const { iniciarCuenta } = useCuenta();
  const [valores, setValores] = useState<ValoresEmpresa>(VALORES_VACIOS);
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  const registrar = async () => {
    if (enviando) return;
    const resultado = validarEmpresa(valores);
    if (!resultado.ok) {
      avisar("Revisa el formulario", resultado.error);
      return;
    }
    const errorClave = validarClave(clave, confirmacion);
    if (errorClave) {
      avisar("Revisa el formulario", errorClave);
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await registrarEmpresa({ ...resultado.datos, clave });
      iniciarCuenta(respuesta.usuario, respuesta.token);
      avisar(
        "¡Empresa registrada!",
        `${respuesta.mensaje}\n\nCódigo para tus clientes: ${respuesta.empresa.codigoAcceso}\n\nPara volver a entrar usa el correo ${respuesta.usuario.correo} y tu contraseña.`,
      );
      replace("/admin");
    } catch (error) {
      if (error instanceof ErrorDeConexion) {
        avisar("Error de conexión", "No se pudo conectar con el servidor.");
      } else {
        avisar(
          "No se pudo registrar",
          mensajeDeError(error, "Intenta de nuevo en unos minutos."),
        );
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primary }]}>
          REGISTRA TU NEGOCIO
        </Text>
        <Text
          style={[
            estilosTexto.subtitulo,
            styles.centrado,
            { color: colors.textSecondary },
          ]}
        >
          Empieza hoy tu prueba gratuita de 15 días. Los campos con * son
          obligatorios.
        </Text>

        <CamposEmpresa
          valores={valores}
          onCambiar={(cambios) => setValores((v) => ({ ...v, ...cambios }))}
        />

        <TituloSeccion>ACCESO DEL ADMINISTRADOR</TituloSeccion>
        <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
          Entrarás con el correo del negocio y esta contraseña (8 a 64
          caracteres).
        </Text>
        <CampoTexto
          style={styles.clave}
          placeholder="Contraseña *"
          accessibilityLabel="Contraseña"
          secureTextEntry
          maxLength={64}
          value={clave}
          onChangeText={setClave}
        />
        <CampoTexto
          placeholder="Repite la contraseña *"
          accessibilityLabel="Repite la contraseña"
          secureTextEntry
          maxLength={64}
          value={confirmacion}
          onChangeText={setConfirmacion}
          onSubmitEditing={registrar}
        />

        <Boton
          titulo={enviando ? "REGISTRANDO…" : "REGISTRAR EMPRESA"}
          onPress={registrar}
          style={styles.boton}
        />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  centrado: { textAlign: "center", marginBottom: 6 },
  clave: { marginTop: 10 },
  boton: { marginTop: 10 },
});
