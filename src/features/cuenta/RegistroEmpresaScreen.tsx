import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { ComponentProps, ComponentRef, useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoClave from "@/components/ui/CampoClave";
import CampoTexto, { PropsCampo } from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useTelefono } from "@/hooks/useTelefono";
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

// El registro va en 3 pasos; cada uno muestra parte de los campos de siempre
const PASOS = ["Tu negocio", "Ubicación y horario", "Tu cuenta"] as const;
type Paso = 1 | 2 | 3;
// Campos de validarEmpresa que se revisan en cada paso (el 3 usa validarAcceso)
const CAMPOS_PASO_1: CampoEmpresa[] = [
  "nombre",
  "categoria",
  "nombreAdministradora",
  "numeroEmpleados",
  "codigoAcceso",
];
const CAMPOS_PASO_2: CampoEmpresa[] = ["departamento", "ciudad", "direccion", "horario"];

// Desde este ancho se muestra el panel lateral con lo que incluye el registro
const ANCHO_CON_PANEL = 900;

// Solo lo que la app y el backend cumplen hoy (sin precios ni promesas)
const INCLUYE: { icono: ComponentProps<typeof Ionicons>["name"]; titulo: string; texto: string }[] = [
  {
    icono: "gift-outline",
    titulo: "15 días gratis",
    texto: "Tu prueba gratuita empieza el día que te registras.",
  },
  {
    icono: "card-outline",
    titulo: "Sin tarjeta",
    texto: "Para registrarte no se piden datos de pago.",
  },
  {
    icono: "link-outline",
    titulo: "Tu enlace para reservar",
    texto:
      "Al terminar recibes el enlace público de tu negocio, con tu propio código: tus clientes lo abren y reservan.",
  },
];

const MENSAJE_CODIGO_EN_USO = "Ese código ya lo usa otro negocio: escribe otro.";

// Solo los errores de estos campos
const soloCampos = (errores: Errores<CampoEmpresa>, campos: CampoEmpresa[]): Errores<CampoEmpresa> =>
  Object.fromEntries(
    Object.entries(errores).filter(([clave]) => campos.includes(clave as CampoEmpresa)),
  );

// "Soy empresa": crea la empresa y su cuenta de administradora (prueba de 15 días)
export default function RegistroEmpresaScreen() {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const { iniciarCuenta } = useCuenta();
  const { cerrarSesion } = useSesion();
  const whatsapp = useTelefono();
  const [valores, setValores] = useState<ValoresEmpresa>(VALORES_VACIOS);
  const [acceso, setAcceso] = useState<ValoresAcceso>(ACCESO_VACIO);
  const [aceptaDatos, setAceptaDatos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Errores<CampoEmpresa>>({});
  const [erroresAcceso, setErroresAcceso] = useState<Errores<keyof ValoresAcceso>>({});
  const [errorAutorizacion, setErrorAutorizacion] = useState<string | null>(null);
  // Cuando se registra se muestra el enlace del negocio antes de entrar al panel
  const [registrada, setRegistrada] = useState<RespuestaRegistroEmpresa | null>(null);
  const [paso, setPaso] = useState<Paso>(1);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const refScroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const refNombre = useRef<ComponentRef<typeof TextInput>>(null);
  const refCorreo = useRef<ComponentRef<typeof TextInput>>(null);
  const conPanel = useWindowDimensions().width >= ANCHO_CON_PANEL;
  // Últimos valores escritos: para saber qué cambió mientras se consultaba si el código está libre
  const refValores = useRef(valores);
  useEffect(() => {
    refValores.current = valores;
  }, [valores]);

  // Al cambiar de paso: vuelve arriba, anuncia el paso y enfoca su primer campo de texto.
  // Al abrir la pantalla no se enfoca nada (no se abre el teclado de golpe).
  const pasoAnterior = useRef(paso);
  useEffect(() => {
    if (pasoAnterior.current === paso) return;
    pasoAnterior.current = paso;
    refScroll.current?.scrollTo({ y: 0, animated: false });
    // En Android y en la web lo anuncia la región "polite" del indicador de pasos
    if (Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(`Paso ${paso} de 3: ${PASOS[paso - 1]}`);
    }
    if (paso === 1) refNombre.current?.focus();
    if (paso === 3) refCorreo.current?.focus();
  }, [paso]);

  const volver = useCallback(() => {
    if (canGoBack()) back();
    else replace("/");
  }, [back, canGoBack, replace]);

  // Atrás (cabecera o botón): al paso anterior sin perder lo escrito; en el paso 1 sale
  const atras = useCallback(() => {
    if (enviando || verificandoCodigo) return;
    if (paso > 1) setPaso((paso - 1) as Paso);
    else volver();
  }, [enviando, verificandoCodigo, paso, volver]);

  // Botón atrás de Android: en los pasos 2 y 3 hace lo mismo que `atras`; en el paso 1 deja la
  // salida normal, salvo mientras se envía o se verifica el código (ahí no hace nada, como la
  // cabecera). Con la empresa ya registrada no interviene.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (registrada) return false;
        if (paso > 1) {
          atras();
          return true;
        }
        return enviando || verificandoCodigo;
      });
      return () => sub.remove();
    }, [registrada, paso, enviando, verificandoCodigo, atras]),
  );

  const cambiarAcceso = (clave: keyof ValoresAcceso) => (texto: string) => {
    setAcceso((a) => ({ ...a, [clave]: texto }));
    setErroresAcceso((e) => sinErrores(e, [clave]));
  };

  // Muestra los errores de estos campos (mismas reglas y mensajes de validarEmpresa) sin
  // tocar los de otros pasos. True si no hay nada por corregir.
  const revisarCampos = (campos: CampoEmpresa[], datos: ValoresEmpresa = valores) => {
    const resultado = validarEmpresa(datos);
    const delPaso = resultado.ok ? {} : soloCampos(resultado.errores, campos);
    setErrores((e) => ({ ...sinErrores(e, campos), ...delPaso }));
    return !hayErrores(delPaso);
  };

  const continuar = async () => {
    if (verificandoCodigo) return;
    if (paso === 1) {
      if (!revisarCampos(CAMPOS_PASO_1)) {
        avisarCamposConError();
        return;
      }
      // Si el código cambia mientras se consulta, la respuesta ya no aplica: se ignora y no se
      // avanza (la persona vuelve a tocar Continuar con el código nuevo)
      const codigo = valores.codigoAcceso;
      const cambioElCodigo = () => refValores.current.codigoAcceso !== codigo;
      setVerificandoCodigo(true);
      try {
        const { disponible } = await consultarCodigoDisponible(codigo);
        if (cambioElCodigo()) return;
        if (!disponible) {
          setErrores((e) => ({ ...e, codigoAcceso: MENSAJE_CODIGO_EN_USO }));
          avisar("Código en uso", "Ese código ya lo usa otro negocio. Elige otro.", "error");
          return;
        }
      } catch (error) {
        // Si no se pudo consultar (sin conexión, servidor caído o demasiadas consultas) se deja
        // seguir: el código se vuelve a comprobar en registrar(), justo antes de enviar
        registrarCausa("Registro de empresa: código", error);
      } finally {
        setVerificandoCodigo(false);
      }
      if (cambioElCodigo()) return;
      // Los demás campos del paso pudieron cambiar durante la consulta: se revisan otra vez con
      // lo último escrito
      if (!revisarCampos(CAMPOS_PASO_1, refValores.current)) {
        avisarCamposConError();
        return;
      }
      setPaso(2);
    } else if (paso === 2) {
      const camposOk = revisarCampos(CAMPOS_PASO_2);
      const contacto = whatsapp.validarOpcional();
      if (!camposOk || contacto === null) {
        avisarCamposConError();
        return;
      }
      setPaso(3);
    }
  };

  const registrar = async () => {
    if (enviando) return;
    const resultado = validarEmpresa(valores);
    const nuevosErroresAcceso = validarAcceso(acceso);
    const contacto = whatsapp.validarOpcional();
    setErrores(resultado.ok ? {} : resultado.errores);
    setErroresAcceso(nuevosErroresAcceso);
    setErrorAutorizacion(aceptaDatos ? null : MENSAJE_AUTORIZACION);
    if (!resultado.ok || contacto === null || hayErrores(nuevosErroresAcceso) || !aceptaDatos) {
      avisarCamposConError();
      // Lleva al primer paso que tenga algo por corregir
      if (!resultado.ok && hayErrores(soloCampos(resultado.errores, CAMPOS_PASO_1))) setPaso(1);
      else if (!resultado.ok || contacto === null) setPaso(2);
      return;
    }

    setEnviando(true);
    try {
      // El código se vuelve a revisar justo antes de enviar
      const { disponible } = await consultarCodigoDisponible(resultado.datos.codigoAcceso);
      if (!disponible) {
        setErrores({ codigoAcceso: MENSAJE_CODIGO_EN_USO });
        avisar("Código en uso", "Ese código ya lo usa otro negocio. Elige otro.", "error");
        // El campo del código está en el paso 1
        setPaso(1);
        return;
      }
      const respuesta = await registrarEmpresa({
        ...resultado.datos,
        // Sin número no se envía nada
        ...(contacto !== "vacio"
          ? { whatsappContacto: contacto.telefono, indicativoWhatsapp: contacto.indicativo }
          : {}),
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
    <Pantalla cabecera={{ onVolver: atras }} refScroll={refScroll}>
      <View style={conPanel ? styles.cuerpoAncho : null}>
        <View style={[styles.contenedor, conPanel && styles.formulario]}>
          <Text style={[styles.titulo, { color: colors.primaryText }]}>REGISTRA TU NEGOCIO</Text>
          <Text style={[estilosTexto.subtitulo, styles.centrado, { color: colors.textSecondary }]}>
            Empieza hoy tu prueba gratuita de 15 días. Los campos con * son obligatorios.
          </Text>

          <View style={styles.indicador} accessibilityLiveRegion="polite">
            <Text style={[styles.numeroPaso, { color: colors.textSecondary }]}>
              Paso {paso} de 3
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.nombrePaso, { color: colors.textPrimary }]}
            >
              {PASOS[paso - 1]}
            </Text>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Progreso del registro"
              accessibilityValue={{ min: 0, max: 3, now: paso, text: `Paso ${paso} de 3` }}
              style={styles.barra}
            >
              {PASOS.map((nombre, i) => (
                <View
                  key={nombre}
                  style={[
                    styles.segmento,
                    { backgroundColor: i < paso ? colors.primaryText : colors.cardBorder },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Pasos 1 y 2: siempre montado (oculto en el paso 3) para no perder listas ni estado */}
          <View style={paso === 3 ? styles.oculto : null}>
            <CamposEmpresa
              valores={valores}
              errores={errores}
              whatsapp={whatsapp}
              secciones={paso === 2 ? "operacion" : "negocio"}
              refNombre={refNombre}
              alEnviarCodigo={continuar}
              onCambiar={(cambios) => {
                setValores((v) => ({ ...v, ...cambios }));
                setErrores((e) => sinErrores(e, camposCambiados(cambios)));
              }}
            />
          </View>

          {paso === 3 ? (
            <>
              <TituloSeccion>ACCESO DEL ADMINISTRADOR</TituloSeccion>
              <Text style={[estilosTexto.subtitulo, styles.ayuda, { color: colors.textSecondary }]}>
                Con tu correo o tu usuario y esta contraseña entrarás a tu panel.
              </Text>
              {campoAcceso("correo", "Correo", {
                inputRef: refCorreo,
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

              {/* Activo sin la casilla: al tocarlo sin marcarla se muestra MENSAJE_AUTORIZACION */}
              <Boton
                titulo={enviando ? "REGISTRANDO…" : "REGISTRAR EMPRESA"}
                ayuda="Crea tu negocio y empieza la prueba gratuita de 15 días"
                deshabilitado={enviando}
                onPress={registrar}
                style={styles.boton}
              />
            </>
          ) : (
            <Boton
              titulo={verificandoCodigo ? "VERIFICANDO…" : "CONTINUAR"}
              ayuda={`Revisa este paso y pasa a "${PASOS[paso]}"`}
              deshabilitado={verificandoCodigo}
              onPress={continuar}
              style={styles.boton}
            />
          )}
          {paso > 1 ? (
            <Boton
              titulo="ATRÁS"
              ayuda={`Vuelve a "${PASOS[paso - 2]}" sin perder lo escrito`}
              variante="secundario"
              deshabilitado={enviando}
              onPress={atras}
              style={styles.boton}
            />
          ) : null}
        </View>

        {conPanel ? (
          <View
            style={[styles.panel, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          >
            <Text
              accessibilityRole="header"
              style={[styles.tituloPanel, { color: colors.textPrimary }]}
            >
              Al registrarte
            </Text>
            {INCLUYE.map((item) => (
              <View key={item.titulo} style={styles.itemPanel}>
                <Ionicons name={item.icono} size={22} color={colors.primaryText} />
                <View style={styles.textoPanel}>
                  <Text style={[styles.tituloItem, { color: colors.textPrimary }]}>
                    {item.titulo}
                  </Text>
                  <Text style={[styles.detalleItem, { color: colors.textSecondary }]}>
                    {item.texto}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
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
  oculto: { display: "none" },
  indicador: { marginTop: 10, marginBottom: 4 },
  numeroPaso: { fontSize: 12, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" },
  nombrePaso: { fontSize: 17, fontWeight: "bold", marginTop: 2 },
  barra: { flexDirection: "row", gap: 6, marginTop: 8 },
  segmento: { flex: 1, height: 6, borderRadius: 3 },
  // Pantalla ancha: formulario y panel lado a lado
  cuerpoAncho: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  formulario: { flex: 1, minWidth: 0 },
  panel: { width: 250, marginTop: 20, borderWidth: 1, borderRadius: 12, padding: 16, gap: 14 },
  tituloPanel: { fontSize: 15, fontWeight: "bold" },
  itemPanel: { flexDirection: "row", gap: 10 },
  textoPanel: { flex: 1 },
  tituloItem: { fontSize: 14, fontWeight: "bold" },
  detalleItem: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
