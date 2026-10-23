import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTelefono from "@/components/ui/CampoTelefono";
import CampoTexto, { PropsCampo } from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import Selector from "@/components/ui/Selector";
import Tocable from "@/components/ui/Tocable";
import { useTelefono } from "@/hooks/useTelefono";
import { describirError, registrarCausa } from "@/services/api/errores";
import { ApiError } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, avisarCamposConError } from "@/utils/dialogos";
import { ACEPTACION } from "../legal/api";
import CasillaAutorizacion, { MENSAJE_AUTORIZACION } from "../legal/CasillaAutorizacion";
import { useSesion } from "../sesion/SesionProvider";
import { Destino, useIniciarSesion } from "../sesion/useIniciarSesion";
import { registrarCliente } from "./api";
import { useCuenta } from "./CuentaProvider";
import {
  CLIENTE_VACIO,
  Errores,
  hayErrores,
  sinErrores,
  ValoresCliente,
  validarCliente,
} from "./formulario/validarEmpresa";

type Modo = "ENTRAR" | "CREAR";

const MODOS = [
  { id: "ENTRAR", label: "Iniciar sesión" },
  { id: "CREAR", label: "Crear cuenta" },
] as const;

// Cuenta opcional del cliente: guarda sus negocios, ve sus citas y reserva sin
// volver a escribir sus datos. Se puede seguir reservando como invitado.
export default function CuentaClienteScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const [modo, setModo] = useState<Modo>("ENTRAR");

  const volver = () => {
    if (canGoBack()) back();
    else replace("/cliente");
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>TU CUENTA DE CLIENTE</Text>
        <Text style={[estilosTexto.subtitulo, styles.centrado, { color: colors.textSecondary }]}>
          Guarda tus negocios favoritos, reserva sin volver a escribir tus datos y mira tus citas.
        </Text>
        <Selector opciones={MODOS} valor={modo} onCambiar={setModo} />
        {modo === "ENTRAR" ? (
          <FormularioEntrar onListo={replace} />
        ) : (
          <FormularioCrear onListo={() => replace("/mis-negocios")} />
        )}
      </View>
    </Pantalla>
  );
}

function FormularioEntrar({ onListo }: { onListo: (destino: Destino) => void }) {
  const { colors } = useAppTheme();
  const { push } = useRouter();
  const iniciarSesion = useIniciarSesion();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null);
  const [errorClave, setErrorClave] = useState<string | null>(null);

  const ingresar = async () => {
    if (enviando) return;
    const faltaUsuario = !usuario.trim();
    setErrorUsuario(faltaUsuario ? "Escribe tu correo o tu nombre de usuario." : null);
    setErrorClave(!clave ? "Escribe tu contraseña." : null);
    if (faltaUsuario || !clave) return;
    setEnviando(true);
    const destino = await iniciarSesion(usuario, clave);
    setEnviando(false);
    // Si quien entra es una administradora o alguien del equipo, va a su panel
    if (destino) onListo(destino);
  };

  return (
    <View>
      <CampoTexto
        etiqueta="Correo o usuario"
        error={errorUsuario}
        ayuda="El correo o el nombre de usuario con el que creaste tu cuenta"
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
        ayuda="Tu contraseña de la cuenta de cliente"
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
        ayuda="Inicia sesión con tu cuenta de cliente"
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
}

function FormularioCrear({ onListo }: { onListo: () => void }) {
  const { colors } = useAppTheme();
  const { iniciarCuenta } = useCuenta();
  const { cerrarSesion } = useSesion();
  const tel = useTelefono();
  const [valores, setValores] = useState<ValoresCliente>(CLIENTE_VACIO);
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Errores<keyof ValoresCliente>>({});
  const [errorAutorizacion, setErrorAutorizacion] = useState<string | null>(null);

  const cambiar = (clave: keyof ValoresCliente) => (texto: string) => {
    setValores((v) => ({ ...v, [clave]: texto }));
    // Correo y usuario se piden juntos ("uno de los dos"): escribir en uno quita ese aviso
    setErrores((e) => sinErrores(e, clave === "usuario" ? ["usuario", "correo"] : [clave]));
  };

  const crear = async () => {
    if (enviando) return;
    const nuevosErrores = validarCliente(valores);
    const telefono = tel.validar();
    setErrores(nuevosErrores);
    setErrorAutorizacion(aceptaDatos ? null : MENSAJE_AUTORIZACION);
    if (hayErrores(nuevosErrores) || !telefono || !aceptaDatos) {
      avisarCamposConError();
      return;
    }

    const correo = valores.correo.trim().toLowerCase();
    const usuario = valores.usuario.trim();
    setEnviando(true);
    try {
      const respuesta = await registrarCliente({
        nombre: valores.nombre.trim(),
        // E.164 ("+573162781393") y su indicativo
        ...telefono,
        ...(correo ? { correo } : {}),
        ...(usuario ? { usuario } : {}),
        clave: valores.clave,
        ...ACEPTACION,
      });
      await cerrarSesion();
      // Acaba de aceptar la versión vigente de los documentos
      await iniciarCuenta({ ...respuesta.usuario, debeAceptarDocumentos: false }, respuesta.token);
      avisar(
        "¡Cuenta creada!",
        `La próxima vez entra con tu ${correo ? `correo (${correo})` : `usuario (${usuario})`} y tu contraseña.`,
        "exito",
      );
      onListo();
    } catch (e) {
      registrarCausa("Registro de cliente", e);
      // Teléfono inválido (400) o ya usado por otra cuenta (409): el aviso va bajo el campo
      if (e instanceof ApiError && /teléfono/i.test(e.message)) tel.setError(e.message);
      const aviso = describirError(e, {
        titulo: "No se pudo crear la cuenta",
        porDefecto: "Intenta de nuevo en unos minutos.",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
    } finally {
      setEnviando(false);
    }
  };

  const campo = (
    clave: "nombre" | "correo" | "usuario",
    etiqueta: string,
    props: Omit<PropsCampo, "etiqueta">,
  ) => (
    <CampoTexto
      etiqueta={etiqueta}
      error={errores[clave]}
      value={valores[clave]}
      onChangeText={cambiar(clave)}
      {...props}
    />
  );

  return (
    <View>
      {campo("nombre", "Nombre completo", {
        obligatorio: true,
        placeholder: "ej: Ana Pérez",
        ayuda: "Así te verán los negocios donde reserves",
        autoCapitalize: "words",
        autoComplete: "name",
        textContentType: "name",
        maxLength: 100,
      })}
      <CampoTelefono telefono={tel} etiqueta="Celular" obligatorio />
      <Text style={[estilosTexto.subtitulo, styles.ayuda, { color: colors.textSecondary }]}>
        Para iniciar sesión escribe tu correo, un nombre de usuario o los dos.
      </Text>
      {campo("correo", "Correo", {
        placeholder: "ej: ejemplo@gmail.com",
        ayuda: "Opcional si escribes un nombre de usuario",
        keyboardType: "email-address",
        autoCapitalize: "none",
        autoCorrect: false,
        autoComplete: "email",
        textContentType: "emailAddress",
        maxLength: 254,
      })}
      {campo("usuario", "Nombre de usuario", {
        placeholder: "ej: ana.perez",
        ayuda: "Opcional si escribes un correo. De 4 a 20 caracteres: letras, números, punto o guion bajo",
        autoCapitalize: "none",
        autoCorrect: false,
        autoComplete: "username-new",
        textContentType: "username",
        maxLength: 20,
      })}
      <CampoClave
        etiqueta="Contraseña"
        obligatorio
        error={errores.clave}
        ayuda="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
        placeholder="ej: MiClave#2026"
        autoComplete="new-password"
        textContentType="newPassword"
        requisitos
        value={valores.clave}
        onChangeText={cambiar("clave")}
      />
      <CampoClave
        etiqueta="Confirma la contraseña"
        obligatorio
        error={errores.confirmacion}
        ayuda="Escribe otra vez la misma contraseña"
        autoComplete="new-password"
        textContentType="newPassword"
        confirmaDe={valores.clave}
        value={valores.confirmacion}
        onChangeText={cambiar("confirmacion")}
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
        titulo={enviando ? "CREANDO…" : "CREAR CUENTA"}
        ayuda="Crea tu cuenta de cliente e inicia sesión"
        deshabilitado={enviando || !aceptaDatos}
        onPress={crear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  titulo: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  centrado: { textAlign: "center" },
  ayuda: { marginTop: 0, marginBottom: 8 },
  boton: { marginTop: 10 },
  enlace: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  textoEnlace: { fontSize: 14, fontWeight: "bold", textDecorationLine: "underline" },
});
