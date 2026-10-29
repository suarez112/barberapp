import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto from "@/components/ui/CampoTexto";
import Tocable from "@/components/ui/Tocable";
import { APP_NOMBRE } from "@/config/app";
import { describirError, registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, avisarCamposConError } from "@/utils/dialogos";
import { iniciarSesionSuperadmin, SesionSuperadmin } from "./api";

type Errores = { correo?: string; clave?: string; codigo?: string };

// Inicio de sesión del superadministrador: correo, contraseña y el código de 6 dígitos
// de su app autenticadora (segundo paso)
export default function LoginSuperadmin({ onEntrar }: { onEntrar: (sesion: SesionSuperadmin) => void }) {
  const { colors, esOscuro, alternarTema } = useAppTheme();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  const validar = (): Errores => {
    const e: Errores = {};
    if (!/^\S+@\S+\.\S+$/.test(correo.trim())) e.correo = "Escribe tu correo completo, por ejemplo: nombre@correo.com.";
    if (!clave) e.clave = "Escribe tu contraseña.";
    if (!/^\d{6}$/.test(codigo)) e.codigo = "El código tiene 6 dígitos y lo ves en tu app autenticadora.";
    return e;
  };

  const entrar = async () => {
    if (enviando) return;
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) {
      avisarCamposConError();
      return;
    }
    setEnviando(true);
    try {
      onEntrar(await iniciarSesionSuperadmin(correo.trim(), clave, codigo));
    } catch (error) {
      registrarCausa("Login superadmin", error);
      const aviso = describirError(error, {
        titulo: "No se pudo entrar",
        porDefecto: "Revisa tus datos e intenta de nuevo.",
        tituloNoAutorizado: "Datos incorrectos",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
      // El código sirve una sola vez: se pide uno nuevo
      setCodigo("");
      setEnviando(false);
    }
  };

  return (
    <View style={[styles.pagina, { backgroundColor: colors.bg }]}>
      <Tocable
        accessibilityRole="button"
        accessibilityLabel={esOscuro ? "Tema claro" : "Tema oscuro"}
        accessibilityHint="Cambia los colores del panel entre claro y oscuro"
        onPress={alternarTema}
        style={[styles.tema, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}
      >
        <Ionicons name={esOscuro ? "sunny-outline" : "moon-outline"} size={22} color={colors.textPrimary} />
      </Tocable>
      <ScrollView contentContainerStyle={styles.centro} keyboardShouldPersistTaps="handled">
        <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Ionicons name="shield-checkmark-outline" size={40} color={colors.primaryText} style={styles.icono} />
          <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
            Panel de {APP_NOMBRE}
          </Text>
          <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>Acceso del administrador de la plataforma</Text>

          <CampoTexto
            etiqueta="Correo"
            obligatorio
            ayuda="Escribe el correo de tu cuenta de superadministrador"
            placeholder="ej: tucorreo@gmail.com"
            value={correo}
            onChangeText={(t) => {
              setCorreo(t);
              setErrores((p) => ({ ...p, correo: undefined }));
            }}
            error={errores.correo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <CampoClave
            etiqueta="Contraseña"
            obligatorio
            ayuda="Escribe tu contraseña"
            value={clave}
            onChangeText={(t) => {
              setClave(t);
              setErrores((p) => ({ ...p, clave: undefined }));
            }}
            error={errores.clave}
            autoComplete="current-password"
            textContentType="password"
          />
          <CampoTexto
            etiqueta="Código de verificación"
            obligatorio
            ayuda="Escribe el código de 6 dígitos que muestra tu app autenticadora"
            placeholder="ej: 123456"
            value={codigo}
            onChangeText={(t) => {
              setCodigo(t.replace(/\D/g, "").slice(0, 6));
              setErrores((p) => ({ ...p, codigo: undefined }));
            }}
            error={errores.codigo}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            centrado
            onSubmitEditing={entrar}
          />
          <Boton
            titulo={enviando ? "ENTRANDO..." : "ENTRAR"}
            ayuda="Inicia sesión en el panel con tu correo, contraseña y código"
            deshabilitado={enviando}
            onPress={entrar}
            style={styles.entrar}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1 },
  tema: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  centro: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  tarjeta: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 32 },
  icono: { alignSelf: "center", marginBottom: 8 },
  titulo: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  subtitulo: { fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 20 },
  entrar: { marginTop: 16 },
});
