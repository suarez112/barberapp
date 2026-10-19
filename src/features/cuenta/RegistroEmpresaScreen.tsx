import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInputProps, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { describirError, registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { consultarCodigoDisponible, registrarEmpresa } from "./api";
import { useSesion } from "../sesion/SesionProvider";
import { useCuenta } from "./CuentaProvider";
import CamposEmpresa from "./formulario/CamposEmpresa";
import {
  ACCESO_VACIO,
  VALORES_VACIOS,
  ValoresAcceso,
  ValoresEmpresa,
  validarAcceso,
  validarEmpresa,
} from "./formulario/validarEmpresa";

// "Soy empresa": crea la empresa y su cuenta de administradora (prueba de 15 días)
export default function RegistroEmpresaScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const { iniciarCuenta } = useCuenta();
  const { cerrarSesion } = useSesion();
  const [valores, setValores] = useState<ValoresEmpresa>(VALORES_VACIOS);
  const [acceso, setAcceso] = useState<ValoresAcceso>(ACCESO_VACIO);
  const [enviando, setEnviando] = useState(false);

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  const cambiarAcceso = (clave: keyof ValoresAcceso) => (texto: string) =>
    setAcceso((a) => ({ ...a, [clave]: texto }));

  const registrar = async () => {
    if (enviando) return;
    const resultado = validarEmpresa(valores);
    if (!resultado.ok) {
      avisar("Revisa el formulario", resultado.error);
      return;
    }
    const errorAcceso = validarAcceso(acceso);
    if (errorAcceso) {
      avisar("Revisa el formulario", errorAcceso);
      return;
    }

    setEnviando(true);
    try {
      // El código se vuelve a revisar justo antes de enviar
      const { disponible } = await consultarCodigoDisponible(resultado.datos.codigoAcceso);
      if (!disponible) {
        avisar("Código en uso", "Ese código ya lo usa otro negocio. Elige otro.", "error");
        return;
      }
      const respuesta = await registrarEmpresa({
        ...resultado.datos,
        correo: acceso.correo.trim().toLowerCase(),
        usuario: acceso.usuario.trim(),
        clave: acceso.clave,
      });
      await cerrarSesion();
      await iniciarCuenta(respuesta.usuario, respuesta.token);
      avisar(
        "¡Empresa registrada!",
        `${respuesta.mensaje}\n\nCódigo para tus clientes: ${respuesta.empresa.codigoAcceso}\n\nPara volver a entrar usa tu correo (${respuesta.usuario.correo}) o tu usuario (${respuesta.usuario.usuario}) y tu contraseña.`,
        "exito",
      );
      replace("/admin");
    } catch (error) {
      registrarCausa("Registro de empresa", error);
      const aviso = describirError(error, {
        titulo: "No se pudo registrar",
        porDefecto: "Intenta de nuevo en unos minutos.",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
    } finally {
      setEnviando(false);
    }
  };

  const campoAcceso = (clave: "correo" | "usuario", texto: string, props: TextInputProps) => (
    <View>
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{texto}</Text>
      <CampoTexto
        accessibilityLabel={texto}
        autoCapitalize="none"
        autoCorrect={false}
        value={acceso[clave]}
        onChangeText={cambiarAcceso(clave)}
        {...props}
      />
    </View>
  );

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primary }]}>REGISTRA TU NEGOCIO</Text>
        <Text style={[estilosTexto.subtitulo, styles.centrado, { color: colors.textSecondary }]}>
          Empieza hoy tu prueba gratuita de 15 días. Los campos con * son obligatorios.
        </Text>

        <CamposEmpresa
          valores={valores}
          onCambiar={(cambios) => setValores((v) => ({ ...v, ...cambios }))}
        />

        <TituloSeccion>ACCESO DEL ADMINISTRADOR</TituloSeccion>
        <Text style={[estilosTexto.subtitulo, styles.ayuda, { color: colors.textSecondary }]}>
          Con tu correo o tu usuario y esta contraseña entrarás a tu panel.
        </Text>
        {campoAcceso("correo", "Correo *", {
          keyboardType: "email-address",
          autoComplete: "email",
          maxLength: 254,
        })}
        {campoAcceso("usuario", "Nombre de usuario * (4 a 20: letras, números, punto o _)", {
          autoComplete: "username",
          maxLength: 20,
        })}
        <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>
          Contraseña * (8 a 64 caracteres)
        </Text>
        <CampoClave
          accessibilityLabel="Contraseña"
          autoComplete="new-password"
          maxLength={64}
          value={acceso.clave}
          onChangeText={cambiarAcceso("clave")}
        />
        <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>
          Confirma la contraseña *
        </Text>
        <CampoClave
          accessibilityLabel="Confirma la contraseña"
          autoComplete="new-password"
          maxLength={64}
          value={acceso.confirmacion}
          onChangeText={cambiarAcceso("confirmacion")}
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
  titulo: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  centrado: { textAlign: "center", marginBottom: 6 },
  ayuda: { marginTop: 0, marginBottom: 8 },
  etiqueta: { fontSize: 12, marginBottom: 4 },
  boton: { marginTop: 10 },
});
