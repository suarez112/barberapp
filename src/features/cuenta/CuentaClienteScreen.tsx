import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInputProps, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import Selector from "@/components/ui/Selector";
import { describirError, registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { ACEPTACION } from "../legal/api";
import CasillaAutorizacion, { MENSAJE_AUTORIZACION } from "../legal/CasillaAutorizacion";
import CampoTelefono from "../reservas/components/CampoTelefono";
import { useTelefono } from "../reservas/hooks/useTelefono";
import { useSesion } from "../sesion/SesionProvider";
import { Destino, useIniciarSesion } from "../sesion/useIniciarSesion";
import { registrarCliente } from "./api";
import { useCuenta } from "./CuentaProvider";
import { CLIENTE_VACIO, ValoresCliente, validarCliente } from "./formulario/validarEmpresa";

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
        <Text style={[styles.titulo, { color: colors.primary }]}>TU CUENTA DE CLIENTE</Text>
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
  const iniciarSesion = useIniciarSesion();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);

  const ingresar = async () => {
    if (enviando) return;
    setEnviando(true);
    const destino = await iniciarSesion(usuario, clave);
    setEnviando(false);
    // Si quien entra es una administradora o alguien del equipo, va a su panel
    if (destino) onListo(destino);
  };

  return (
    <View>
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

  const cambiar = (clave: keyof ValoresCliente) => (texto: string) =>
    setValores((v) => ({ ...v, [clave]: texto }));

  const crear = async () => {
    if (enviando) return;
    const error = validarCliente({ ...valores, telefono: tel.telefono });
    if (error) {
      avisar("Revisa el formulario", error);
      return;
    }
    if (!aceptaDatos) {
      avisar("Autorización requerida", MENSAJE_AUTORIZACION);
      return;
    }

    const correo = valores.correo.trim().toLowerCase();
    const usuario = valores.usuario.trim();
    setEnviando(true);
    try {
      const respuesta = await registrarCliente({
        nombre: valores.nombre.trim(),
        telefono: tel.telefono.trim(),
        indicativo: tel.indicativo,
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
      const aviso = describirError(e, {
        titulo: "No se pudo crear la cuenta",
        porDefecto: "Intenta de nuevo en unos minutos.",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
    } finally {
      setEnviando(false);
    }
  };

  const campo = (clave: keyof ValoresCliente, etiqueta: string, props: TextInputProps = {}) => (
    <View>
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>{etiqueta}</Text>
      <CampoTexto
        accessibilityLabel={etiqueta}
        value={valores[clave]}
        onChangeText={cambiar(clave)}
        {...props}
      />
    </View>
  );

  return (
    <View>
      {campo("nombre", "Nombre completo *", { autoComplete: "name", maxLength: 100 })}
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>Celular *</Text>
      <CampoTelefono
        telefono={tel.telefono}
        indicativo={tel.indicativo}
        onCambiarTelefono={tel.cambiarTelefono}
        onElegirPais={tel.elegirPais}
      />
      <Text style={[estilosTexto.subtitulo, styles.ayuda, { color: colors.textSecondary }]}>
        Para iniciar sesión escribe tu correo, un nombre de usuario o los dos.
      </Text>
      {campo("correo", "Correo", {
        keyboardType: "email-address",
        autoCapitalize: "none",
        autoCorrect: false,
        autoComplete: "email",
        maxLength: 254,
      })}
      {campo("usuario", "Nombre de usuario (4 a 20: letras, números, punto o _)", {
        autoCapitalize: "none",
        autoCorrect: false,
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
        value={valores.clave}
        onChangeText={cambiar("clave")}
      />
      <Text style={[styles.etiqueta, { color: colors.textSecondary }]}>
        Confirma la contraseña *
      </Text>
      <CampoClave
        accessibilityLabel="Confirma la contraseña"
        autoComplete="new-password"
        maxLength={64}
        value={valores.confirmacion}
        onChangeText={cambiar("confirmacion")}
      />

      <CasillaAutorizacion aceptada={aceptaDatos} onCambiar={setAceptaDatos} />

      <Boton titulo={enviando ? "CREANDO…" : "CREAR CUENTA"} onPress={crear} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  titulo: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  centrado: { textAlign: "center" },
  ayuda: { marginTop: 0, marginBottom: 8 },
  etiqueta: { fontSize: 12, marginBottom: 4 },
  boton: { marginTop: 10 },
});
