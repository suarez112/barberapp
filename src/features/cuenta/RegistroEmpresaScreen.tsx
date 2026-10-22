import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto, { PropsCampo } from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { describirError, registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, avisarCamposConError } from "@/utils/dialogos";
import EnlacePublico from "../enlace/EnlacePublico";
import { ACEPTACION } from "../legal/api";
import CasillaAutorizacion, { MENSAJE_AUTORIZACION } from "../legal/CasillaAutorizacion";
import { consultarCodigoDisponible, registrarEmpresa, RespuestaRegistroEmpresa } from "./api";
import { useSesion } from "../sesion/SesionProvider";
import { useCuenta } from "./CuentaProvider";
import CamposEmpresa from "./formulario/CamposEmpresa";
import {
  ACCESO_VACIO,
  CampoEmpresa,
  camposCambiados,
  Errores,
  hayErrores,
  sinErrores,
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
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Errores<CampoEmpresa>>({});
  const [erroresAcceso, setErroresAcceso] = useState<Errores<keyof ValoresAcceso>>({});
  const [errorAutorizacion, setErrorAutorizacion] = useState<string | null>(null);
  // Cuando se registra se muestra el enlace del negocio antes de entrar al panel
  const [registrada, setRegistrada] = useState<RespuestaRegistroEmpresa | null>(null);

  const volver = () => {
    if (canGoBack()) back();
    else replace("/");
  };

  const cambiarAcceso = (clave: keyof ValoresAcceso) => (texto: string) => {
    setAcceso((a) => ({ ...a, [clave]: texto }));
    setErroresAcceso((e) => sinErrores(e, [clave]));
  };

  const registrar = async () => {
    if (enviando) return;
    const resultado = validarEmpresa(valores);
    const nuevosErroresAcceso = validarAcceso(acceso);
    setErrores(resultado.ok ? {} : resultado.errores);
    setErroresAcceso(nuevosErroresAcceso);
    setErrorAutorizacion(aceptaDatos ? null : MENSAJE_AUTORIZACION);
    if (!resultado.ok || hayErrores(nuevosErroresAcceso) || !aceptaDatos) {
      avisarCamposConError();
      return;
    }

    setEnviando(true);
    try {
      // El código se vuelve a revisar justo antes de enviar
      const { disponible } = await consultarCodigoDisponible(resultado.datos.codigoAcceso);
      if (!disponible) {
        setErrores({ codigoAcceso: "Ese código ya lo usa otro negocio: escribe otro." });
        avisar("Código en uso", "Ese código ya lo usa otro negocio. Elige otro.", "error");
        return;
      }
      const respuesta = await registrarEmpresa({
        ...resultado.datos,
        correo: acceso.correo.trim().toLowerCase(),
        usuario: acceso.usuario.trim(),
        clave: acceso.clave,
        ...ACEPTACION,
      });
      await cerrarSesion();
      await iniciarCuenta(respuesta.usuario, respuesta.token);
      setRegistrada(respuesta);
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

  const campoAcceso = (
    clave: "correo" | "usuario",
    texto: string,
    props: Omit<PropsCampo, "etiqueta">,
  ) => (
    <CampoTexto
      etiqueta={texto}
      obligatorio
      error={erroresAcceso[clave]}
      autoCapitalize="none"
      autoCorrect={false}
      value={acceso[clave]}
      onChangeText={cambiarAcceso(clave)}
      {...props}
    />
  );

  if (registrada) {
    return (
      <Pantalla>
        <View style={styles.contenedor}>
          <Text style={[styles.titulo, { color: colors.primaryText }]}>¡EMPRESA REGISTRADA!</Text>
          <Text style={[estilosTexto.subtitulo, styles.centrado, { color: colors.textSecondary }]}>
            {registrada.mensaje}
          </Text>
          <TituloSeccion>ENLACE DE TU NEGOCIO</TituloSeccion>
          <Text style={[estilosTexto.subtitulo, styles.ayuda, { color: colors.textSecondary }]}>
            Compártelo con tus clientes: lo abren y reservan directo. El código para escribir a mano es{" "}
            {registrada.empresa.codigoAcceso}.
          </Text>
          <EnlacePublico
            enlace={registrada.empresa.enlacePublico}
            nombreNegocio={registrada.empresa.nombre}
          />
          <Text style={[estilosTexto.subtitulo, styles.ayuda, { color: colors.textSecondary }]}>
            Para volver a entrar usa tu correo ({registrada.usuario.correo}) o tu usuario (
            {registrada.usuario.usuario}) y tu contraseña. Tu código QR está en &quot;Mi
            negocio&quot;.
          </Text>
          <Boton
            titulo="IR A MI PANEL"
            ayuda="Abre el panel de tu negocio"
            onPress={() => replace("/admin")}
            style={styles.boton}
          />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>REGISTRA TU NEGOCIO</Text>
        <Text style={[estilosTexto.subtitulo, styles.centrado, { color: colors.textSecondary }]}>
          Empieza hoy tu prueba gratuita de 15 días. Los campos con * son obligatorios.
        </Text>

        <CamposEmpresa
          valores={valores}
          errores={errores}
          onCambiar={(cambios) => {
            setValores((v) => ({ ...v, ...cambios }));
            setErrores((e) => sinErrores(e, camposCambiados(cambios)));
          }}
        />

        <TituloSeccion>ACCESO DEL ADMINISTRADOR</TituloSeccion>
        <Text style={[estilosTexto.subtitulo, styles.ayuda, { color: colors.textSecondary }]}>
          Con tu correo o tu usuario y esta contraseña entrarás a tu panel.
        </Text>
        {campoAcceso("correo", "Correo", {
          placeholder: "ej: ejemplo@gmail.com",
          ayuda: "Con este correo inicias sesión",
          keyboardType: "email-address",
          autoComplete: "email",
          textContentType: "emailAddress",
          maxLength: 254,
        })}
        {campoAcceso("usuario", "Nombre de usuario", {
          placeholder: "ej: barberia.central",
          ayuda: "De 4 a 20 caracteres: letras, números, punto o guion bajo",
          autoComplete: "username-new",
          textContentType: "username",
          maxLength: 20,
        })}
        <CampoClave
          etiqueta="Contraseña"
          obligatorio
          error={erroresAcceso.clave}
          ayuda="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
          placeholder="ej: MiClave#2026"
          autoComplete="new-password"
          textContentType="newPassword"
          requisitos
          value={acceso.clave}
          onChangeText={cambiarAcceso("clave")}
        />
        <CampoClave
          etiqueta="Confirma la contraseña"
          obligatorio
          error={erroresAcceso.confirmacion}
          ayuda="Escribe otra vez la misma contraseña"
          autoComplete="new-password"
          textContentType="newPassword"
          confirmaDe={acceso.clave}
          value={acceso.confirmacion}
          onChangeText={cambiarAcceso("confirmacion")}
          onSubmitEditing={registrar}
        />

        <CasillaAutorizacion
          aceptada={aceptaDatos}
          error={errorAutorizacion}
          onCambiar={(a) => {
            setAceptaDatos(a);
            if (a) setErrorAutorizacion(null);
          }}
        />

        <Boton
          titulo={enviando ? "REGISTRANDO…" : "REGISTRAR EMPRESA"}
          ayuda="Crea tu negocio y empieza la prueba gratuita de 15 días"
          deshabilitado={enviando}
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
  boton: { marginTop: 10 },
});
