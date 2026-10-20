import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import Desplegable from "@/components/ui/Desplegable";
import Insignia from "@/components/ui/Insignia";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useVolver } from "@/features/ayuda/volverAyuda";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar, avisarCamposConError } from "@/utils/dialogos";
import { EstadoPqrs, Pqrs, TipoPqrs, listarMisPqrs, radicarPqrs } from "./api";

const TIPOS: { valor: TipoPqrs; etiqueta: string }[] = [
  { valor: "peticion", etiqueta: "Petición" },
  { valor: "queja", etiqueta: "Queja" },
  { valor: "reclamo", etiqueta: "Reclamo" },
  { valor: "sugerencia", etiqueta: "Sugerencia" },
];

const ESTADOS: Record<EstadoPqrs, { texto: string; color: string }> = {
  recibida: { texto: "RECIBIDA", color: COLORES.info },
  en_proceso: { texto: "EN PROCESO", color: COLORES.advertenciaOscuro },
  resuelta: { texto: "RESUELTA", color: COLORES.exito },
  cerrada: { texto: "CERRADA", color: COLORES.neutro },
};

const nombreDelTipo = (t: TipoPqrs) => TIPOS.find((x) => x.valor === t)?.etiqueta ?? t;

type Errores = { tipo?: string; mensaje?: string; nombre?: string; contacto?: string };

// PQRS: formulario (como invitado o con la cuenta) y la lista de las enviadas con la cuenta
export default function PqrsScreen() {
  const { colors } = useAppTheme();
  const volver = useVolver();
  const { usuario, token } = useCuenta();
  const senal = useSenalDeSalida();
  const [tipo, setTipo] = useState<TipoPqrs | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [mias, setMias] = useState<Pqrs[] | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!usuario) return;
    setErrorLista(null);
    listarMisPqrs(token, senal())
      .then(setMias)
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Mis PQRS", e);
        setErrorLista(
          describirError(e, { titulo: "", porDefecto: "No se pudieron cargar tus solicitudes." }).mensaje,
        );
      });
  }, [usuario, token, senal]);

  useFocusEffect(cargar);

  // Al cambiar un campo se borra su error
  const cambiar = (clave: keyof Errores, poner: (v: string) => void) => (v: string) => {
    poner(v);
    setErrores((e) => ({ ...e, [clave]: undefined }));
  };

  const enviar = async () => {
    const nuevos: Errores = {};
    if (!tipo) nuevos.tipo = "Elige el tipo de solicitud.";
    if (!mensaje.trim()) nuevos.mensaje = "Cuéntanos qué pasó o qué necesitas.";
    if (!usuario) {
      if (!nombre.trim()) nuevos.nombre = "Escribe tu nombre.";
      if (!contacto.trim()) nuevos.contacto = "Escribe un correo o teléfono para responderte.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length || !tipo) {
      avisarCamposConError();
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await radicarPqrs(
        usuario
          ? { tipo, mensaje: mensaje.trim() }
          : { tipo, mensaje: mensaje.trim(), nombre: nombre.trim(), contacto: contacto.trim() },
        usuario ? token : undefined,
      );
      avisar("Solicitud enviada", respuesta.mensaje, "exito");
      setTipo(null);
      setMensaje("");
      cargar();
    } catch (e) {
      registrarCausa("Enviar PQRS", e);
      const aviso = describirError(e, { titulo: "No se pudo enviar", porDefecto: "Intenta de nuevo." });
      avisar(aviso.titulo, aviso.mensaje, "error");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>PQRS</Text>
        <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
          Peticiones, quejas, reclamos y sugerencias
        </Text>

        <Desplegable
          etiqueta="Tipo de solicitud"
          obligatorio
          ayuda="Elige si es una petición, queja, reclamo o sugerencia"
          placeholder="Elige el tipo"
          opciones={TIPOS}
          valor={tipo}
          onCambiar={(v) => {
            setTipo(v);
            setErrores((e) => ({ ...e, tipo: undefined }));
          }}
          error={errores.tipo}
        />
        <CampoTexto
          etiqueta="Mensaje"
          obligatorio
          ayuda="Cuéntanos con detalle tu solicitud, hasta 2000 caracteres"
          placeholder="ej: la app se cierra al reservar"
          value={mensaje}
          onChangeText={cambiar("mensaje", setMensaje)}
          error={errores.mensaje}
          multiline
          maxLength={2000}
          estiloTexto={styles.mensaje}
        />
        {usuario ? null : (
          <>
            <CampoTexto
              etiqueta="Nombre"
              obligatorio
              ayuda="Escribe tu nombre"
              placeholder="ej: Ana Pérez"
              value={nombre}
              onChangeText={cambiar("nombre", setNombre)}
              error={errores.nombre}
              maxLength={100}
              autoComplete="name"
              textContentType="name"
            />
            <CampoTexto
              etiqueta="Correo o teléfono"
              obligatorio
              ayuda="Escribe cómo podemos responderte"
              placeholder="ej: ejemplo@gmail.com"
              value={contacto}
              onChangeText={cambiar("contacto", setContacto)}
              error={errores.contacto}
              maxLength={150}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </>
        )}
        <Boton
          titulo={enviando ? "ENVIANDO..." : "ENVIAR SOLICITUD"}
          ayuda="Envía tu solicitud y te damos un número de radicado"
          deshabilitado={enviando}
          onPress={enviar}
        />

        {usuario ? (
          <View>
            <TituloSeccion>MIS SOLICITUDES</TituloSeccion>
            {mias === null ? (
              errorLista ? (
                <View>
                  <TextoInfo>{errorLista}</TextoInfo>
                  <Boton
                    titulo="REINTENTAR"
                    ayuda="Vuelve a cargar tus solicitudes"
                    variante="neutro"
                    onPress={cargar}
                  />
                </View>
              ) : (
                <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
              )
            ) : mias.length === 0 ? (
              <Text style={[styles.vacio, { color: colors.textSecondary }]}>
                Aún no has enviado solicitudes con tu cuenta.
              </Text>
            ) : (
              mias.map((p) => (
                <View
                  key={p.radicado}
                  style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.encabezado}>
                    <Text style={[styles.radicado, { color: colors.textPrimary }]}>{p.radicado}</Text>
                    <Insignia texto={ESTADOS[p.estado].texto} color={ESTADOS[p.estado].color} />
                  </View>
                  <Text style={[styles.detalle, { color: colors.primaryText }]}>{nombreDelTipo(p.tipo)}</Text>
                  <Text style={[styles.detalle, { color: colors.textSecondary }]}>{p.mensaje}</Text>
                  {p.respuesta ? (
                    <Text style={[styles.respuesta, { color: colors.textPrimary }]}>
                      Respuesta: {p.respuesta}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 24 },
  titulo: { fontSize: 18, fontWeight: "bold", textAlign: "center", letterSpacing: 1 },
  subtitulo: { fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 20 },
  mensaje: { minHeight: 110, textAlignVertical: "top" },
  cargando: { marginVertical: 20 },
  vacio: { fontSize: 14, textAlign: "center", marginTop: 10 },
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 10 },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  radicado: { fontSize: 14, fontWeight: "bold", flexShrink: 1 },
  detalle: { fontSize: 13, marginTop: 6 },
  respuesta: { fontSize: 13, marginTop: 8, fontWeight: "600" },
});
