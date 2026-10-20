import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import TarjetaMenu from "@/components/ui/TarjetaMenu";
import { CONTACTO } from "@/config/app";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import { useCerrarSesion } from "@/features/sesion/useCerrarSesion";
import { describirError, registrarCausa } from "@/services/api/errores";
import { ApiError } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, confirmar } from "@/utils/dialogos";
import { eliminarCuenta } from "./api";
import { useVolver } from "./volverAyuda";

const correoContacto = CONTACTO.correo.trim();

// Ayuda: PQRS, acerca de, contacto con el desarrollador y, con una cuenta abierta, eliminarla
export default function AyudaScreen() {
  const { colors } = useAppTheme();
  const { push, replace } = useRouter();
  const volver = useVolver();
  const { usuario, token } = useCuenta();
  const cerrarSesion = useCerrarSesion();
  const [pidiendoClave, setPidiendoClave] = useState(false);
  const [clave, setClave] = useState("");
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const escribirAlDesarrollador = () =>
    Linking.openURL(`mailto:${correoContacto}`).catch(() =>
      avisar("No se pudo abrir el correo", `Escribe a ${correoContacto} desde tu aplicación de correo.`, "error"),
    );

  const empezarEliminacion = async () => {
    const seguir = await confirmar({
      titulo: "¿Eliminar tu cuenta?",
      mensaje: "Se borrarán tu cuenta y tus datos personales. Esta acción no se puede deshacer.",
      destructivo: true,
    });
    if (seguir) setPidiendoClave(true);
  };

  const eliminar = async () => {
    if (!clave) {
      setErrorClave("Escribe tu contraseña para confirmar.");
      return;
    }
    // Segunda confirmación, ya con la contraseña escrita
    const seguro = await confirmar({
      titulo: "Última confirmación",
      mensaje: "¿Seguro que quieres eliminar tu cuenta para siempre?",
      destructivo: true,
      textoAceptar: "ELIMINAR",
    });
    if (!seguro) return;

    setEliminando(true);
    let eliminarNegocio = false;
    try {
      for (;;) {
        try {
          await eliminarCuenta(token, clave, eliminarNegocio);
          break;
        } catch (e) {
          // Es la única administradora: el backend pide decidir si se cierra también el negocio
          if (e instanceof ApiError && e.status === 409 && !eliminarNegocio) {
            const cerrar = await confirmar({
              titulo: "Eres la única administradora",
              mensaje: `${e.message}\n\n¿Quieres eliminar tu cuenta y cerrar también el negocio?`,
              destructivo: true,
              textoAceptar: "CERRAR NEGOCIO",
            });
            if (!cerrar) return;
            eliminarNegocio = true;
            continue;
          }
          throw e;
        }
      }
      await cerrarSesion();
      avisar("Cuenta eliminada", "Tu cuenta y tus datos personales fueron eliminados.", "exito");
      replace("/");
    } catch (e) {
      registrarCausa("Eliminar cuenta", e);
      const aviso = describirError(e, {
        titulo: "No se pudo eliminar",
        porDefecto: "Intenta de nuevo.",
        tituloNoAutorizado: "Contraseña incorrecta",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>AYUDA</Text>
        <TarjetaMenu
          icono="chatbubble-ellipses-outline"
          titulo="PQRS"
          descripcion="Envía una petición, queja, reclamo o sugerencia y consulta su estado"
          onPress={() => push("/pqrs")}
        />
        <TarjetaMenu
          icono="information-circle-outline"
          titulo="Acerca de"
          descripcion="Versión de la app, Política de datos y Términos"
          onPress={() => push("/acerca-de")}
        />

        {correoContacto ? (
          <View style={[styles.contacto, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text accessibilityRole="header" style={[styles.tituloContacto, { color: colors.primaryText }]}>
              CONTACTO
            </Text>
            <Text selectable style={[styles.correo, { color: colors.textPrimary }]}>
              {correoContacto}
            </Text>
            <Boton
              titulo="ESCRIBIR AL CORREO"
              ayuda="Abre tu aplicación de correo para escribirle al desarrollador"
              onPress={escribirAlDesarrollador}
            />
          </View>
        ) : null}

        {usuario ? (
          pidiendoClave ? (
            <View style={styles.eliminar}>
              <CampoClave
                etiqueta="Contraseña"
                obligatorio
                ayuda="Escribe tu contraseña para confirmar que quieres eliminar tu cuenta"
                value={clave}
                onChangeText={(t) => {
                  setClave(t);
                  setErrorClave(null);
                }}
                error={errorClave}
                autoComplete="current-password"
                textContentType="password"
              />
              <Boton
                titulo={eliminando ? "ELIMINANDO..." : "ELIMINAR MI CUENTA PARA SIEMPRE"}
                ayuda="Pide una última confirmación y elimina tu cuenta y tus datos personales"
                variante="peligro"
                deshabilitado={eliminando}
                onPress={eliminar}
              />
              <Boton
                titulo="CANCELAR"
                ayuda="No elimina nada y oculta el campo de contraseña"
                variante="secundario"
                deshabilitado={eliminando}
                style={styles.cancelar}
                onPress={() => {
                  setPidiendoClave(false);
                  setClave("");
                  setErrorClave(null);
                }}
              />
            </View>
          ) : (
            <Boton
              titulo="ELIMINAR MI CUENTA"
              ayuda="Empieza el proceso para borrar tu cuenta y tus datos personales"
              variante="peligro"
              style={styles.eliminar}
              onPress={empezarEliminacion}
            />
          )
        ) : null}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 24 },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 20,
  },
  contacto: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 8 },
  tituloContacto: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 6 },
  correo: { fontSize: 15, marginBottom: 8 },
  eliminar: { marginTop: 24 },
  cancelar: { marginTop: 10 },
});
