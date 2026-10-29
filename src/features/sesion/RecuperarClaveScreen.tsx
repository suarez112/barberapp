import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import { claveValida, MENSAJE_CLAVE } from "@/utils/clave";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { describirError, registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { restablecerContrasena, solicitarRecuperacion } from "./api";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errores = { correo?: string; codigo?: string; clave?: string; confirmacion?: string };

// Recuperar la contraseña en dos pasos: 1) el correo, 2) el código de 6 dígitos
// que llega al correo y la contraseña nueva
export default function RecuperarClaveScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  // Lo que respondió el backend al pedir el código (igual exista o no la cuenta)
  const [mensajeEnvio, setMensajeEnvio] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  const volver = () => {
    if (paso === 2) setPaso(1);
    else if (canGoBack()) back();
    else replace("/login");
  };

  // El botón atrás de Android en el paso 2 vuelve al paso 1
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (paso !== 2) return false;
        setPaso(1);
        return true;
      });
      return () => sub.remove();
    }, [paso]),
  );

  const cambiar = (campo: keyof Errores, guardar: (t: string) => void) => (t: string) => {
    guardar(t);
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const avisarError = (contexto: string, error: unknown) => {
    registrarCausa(contexto, error);
    const aviso = describirError(error, {
      titulo: "Revisa los datos",
      porDefecto: "No se pudo completar la acción. Intenta de nuevo.",
    });
    avisar(aviso.titulo, aviso.mensaje, "error");
  };

  const pedirCodigo = async () => {
    if (enviando) return;
    const limpio = correo.trim().toLowerCase();
    const error = !limpio
      ? "Escribe el correo de tu cuenta."
      : !CORREO.test(limpio)
        ? "Escribe un correo válido, por ejemplo nombre@gmail.com."
        : undefined;
    setErrores(error ? { correo: error } : {});
    if (error) return;
    setEnviando(true);
    try {
      const { mensaje } = await solicitarRecuperacion(limpio);
      setMensajeEnvio(mensaje);
      setCodigo("");
      setPaso(2);
    } catch (e) {
      avisarError("Pedir código de recuperación:", e);
    } finally {
      setEnviando(false);
    }
  };

  const cambiarClave = async () => {
    if (enviando) return;
    const nuevos: Errores = {
      codigo: /^\d{6}$/.test(codigo) ? undefined : "Escribe los 6 dígitos del código que te llegó.",
      clave: claveValida(clave) ? undefined : MENSAJE_CLAVE,
      confirmacion:
        clave === confirmacion
          ? undefined
          : "Las contraseñas no coinciden: escríbela igual en los dos campos.",
    };
    setErrores(nuevos);
    if (nuevos.codigo || nuevos.clave || nuevos.confirmacion) return;
    setEnviando(true);
    try {
      const { mensaje } = await restablecerContrasena({
        correo: correo.trim().toLowerCase(),
        codigo,
        clave,
      });
      setClave("");
      setConfirmacion("");
      avisar("Contraseña cambiada", mensaje, "exito");
      replace("/login");
    } catch (e) {
      avisarError("Restablecer contraseña:", e);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <TituloSeccion>RECUPERAR CONTRASEÑA</TituloSeccion>

        {paso === 1 ? (
          <>
            <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
              Paso 1 de 2. Escribe el correo de tu cuenta y te enviaremos un código de 6 dígitos.
            </Text>
            <View
              style={[styles.aviso, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}
            >
              <Text style={[styles.textoAviso, { color: colors.textPrimary }]}>
                ¿Eres parte del equipo de un negocio y entras con un usuario, sin correo? Pídele a tu
                administrador que te cambie la contraseña desde la pestaña Equipo.
              </Text>
            </View>
            <CampoTexto
              etiqueta="Correo"
              obligatorio
              error={errores.correo}
              ayuda="El correo con el que creaste tu cuenta"
              placeholder="ej: ejemplo@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={254}
              value={correo}
              onChangeText={cambiar("correo", setCorreo)}
              onSubmitEditing={pedirCodigo}
            />
            <Boton
              titulo={enviando ? "ENVIANDO…" : "ENVIAR CÓDIGO"}
              ayuda="Envía un código de 6 dígitos a tu correo"
              deshabilitado={enviando}
              onPress={pedirCodigo}
              style={styles.boton}
            />
          </>
        ) : (
          <>
            <Text style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}>
              Paso 2 de 2. Escribe el código y tu contraseña nueva.
            </Text>
            <View
              style={[styles.aviso, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}
            >
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.textoAviso, { color: colors.textPrimary }]}
              >
                {mensajeEnvio}
              </Text>
              <Text style={[styles.textoAviso, styles.correo, { color: colors.textSecondary }]}>
                Correo: {correo.trim().toLowerCase()}
              </Text>
            </View>
            <CampoTexto
              etiqueta="Código de 6 dígitos"
              obligatorio
              error={errores.codigo}
              ayuda="El código que llegó a tu correo. Vence en 15 minutos"
              placeholder="ej: 123456"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              value={codigo}
              onChangeText={cambiar("codigo", (t) => setCodigo(t.replace(/\D/g, "")))}
              estiloTexto={styles.codigo}
              centrado
            />
            <CampoClave
              etiqueta="Contraseña nueva"
              obligatorio
              error={errores.clave}
              ayuda="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
              placeholder="ej: MiClave#2026"
              autoComplete="new-password"
              textContentType="newPassword"
              requisitos
              value={clave}
              onChangeText={cambiar("clave", setClave)}
            />
            <CampoClave
              etiqueta="Confirma la contraseña"
              obligatorio
              error={errores.confirmacion}
              ayuda="Escribe otra vez la contraseña nueva"
              autoComplete="new-password"
              textContentType="newPassword"
              confirmaDe={clave}
              value={confirmacion}
              onChangeText={cambiar("confirmacion", setConfirmacion)}
              onSubmitEditing={cambiarClave}
            />
            <Boton
              titulo={enviando ? "GUARDANDO…" : "CAMBIAR CONTRASEÑA"}
              ayuda="Guarda la contraseña nueva y vuelve a iniciar sesión"
              deshabilitado={enviando}
              onPress={cambiarClave}
              style={styles.boton}
            />
            <Boton
              titulo="PEDIR OTRO CÓDIGO"
              ayuda="Envía un código nuevo al mismo correo; el anterior deja de servir"
              variante="secundario"
              deshabilitado={enviando}
              onPress={pedirCodigo}
              style={styles.boton}
            />
          </>
        )}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  aviso: { borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 16 },
  textoAviso: { fontSize: 13, lineHeight: 19 },
  correo: { marginTop: 6 },
  codigo: { fontSize: 20, fontWeight: "bold", letterSpacing: 4 },
  boton: { marginTop: 10 },
});
