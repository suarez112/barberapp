import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Tocable from "@/components/ui/Tocable";
import { registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesion } from "../sesion/SesionProvider";
import { useAvisarError } from "../sesion/useAvisarError";
import { aceptarVersionVigente, EstadoLegal, obtenerEstadoLegal, TipoDocumento } from "./api";
import CasillaAutorizacion from "./CasillaAutorizacion";
import DocumentoLegalModal from "./DocumentoLegalModal";
import { COLORES } from "@/theme/paleta";

const DOCUMENTOS: { tipo: TipoDocumento; titulo: string }[] = [
  { tipo: "politica-datos", titulo: "Política de Tratamiento de Datos" },
  { tipo: "terminos", titulo: "Términos y Condiciones" },
  { tipo: "aviso-privacidad", titulo: "Aviso de privacidad" },
];

// Si publicamos una versión nueva de la política o los términos, quien tiene sesión
// (administrador, equipo o cliente) debe aceptarla antes de seguir: el modal no se
// puede cerrar ni saltar. Se revisa al abrir la sesión.
export default function ModalNuevaVersion() {
  const { colors } = useAppTheme();
  const { token: tokenPersonal } = useSesion();
  const { token: tokenCuenta, usuario, actualizarUsuario } = useCuenta();
  const avisarError = useAvisarError();
  const token = tokenPersonal || tokenCuenta;
  // Token de la sesión con documentos pendientes y las versiones que debe aceptar
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoLegal | null>(null);
  // Documento abierto para leerlo; este modal sigue debajo con su casilla y su estado
  const [abierto, setAbierto] = useState<TipoDocumento | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const mostrar = pendiente !== null && pendiente === token;

  useEffect(() => {
    if (!token) return;
    const controlador = new AbortController();
    obtenerEstadoLegal(token, controlador.signal)
      .then((nuevo) => {
        if (!nuevo.vigente) {
          setAcepta(false);
          setEstado(nuevo);
          setPendiente(token);
        }
      })
      // Si no se puede consultar no se bloquea a nadie: se vuelve a revisar en el próximo ingreso
      .catch((e) => {
        if (!esCancelada(e)) registrarCausa("Estado de los documentos", e);
      });
    return () => controlador.abort();
  }, [token]);

  const aceptar = async () => {
    setEnviando(true);
    try {
      await aceptarVersionVigente(token);
      if (usuario?.rol === "cliente") actualizarUsuario({ debeAceptarDocumentos: false });
      setPendiente(null);
    } catch (e) {
      avisarError(e, { titulo: "No se pudo registrar tu aceptación" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible={mostrar} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.fondo}>
        <View style={[styles.caja, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
              Actualizamos nuestros documentos
            </Text>
            <Text style={[styles.texto, { color: colors.textSecondary }]}>
              Publicamos una nueva versión de la Política de Tratamiento de Datos y de los Términos
              y Condiciones. Léelos y acéptalos para seguir usando la app.
            </Text>
            {estado ? (
              <Text style={[styles.version, { color: colors.textSecondary }]}>
                Versión {estado.versionPolitica} de la Política de Datos · Versión{" "}
                {estado.versionTerminos} de los Términos
              </Text>
            ) : null}
            {DOCUMENTOS.map(({ tipo, titulo }) => (
              <Tocable
                key={tipo}
                accessibilityRole="link"
                accessibilityLabel={`Leer: ${titulo}`}
                accessibilityHint="Abre el documento sin cerrar esta ventana"
                style={styles.enlace}
                onPress={() => setAbierto(tipo)}
              >
                <Text style={[styles.textoEnlace, { color: colors.primaryText }]}>{titulo}</Text>
              </Tocable>
            ))}
            <CasillaAutorizacion aceptada={acepta} onCambiar={setAcepta} />
            <Boton
              titulo={enviando ? "GUARDANDO…" : "ACEPTAR Y CONTINUAR"}
              ayuda="Registra tu aceptación de los documentos vigentes y continúa"
              deshabilitado={!acepta || enviando}
              onPress={aceptar}
              style={styles.boton}
            />
          </ScrollView>
        </View>
      </View>
      <DocumentoLegalModal tipo={abierto} onCerrar={() => setAbierto(null)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.velo, justifyContent: "center", padding: 20 },
  caja: { borderRadius: 16, borderWidth: 1, padding: 20, maxHeight: "90%" },
  titulo: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  texto: { fontSize: 14, lineHeight: 20 },
  version: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  enlace: { minHeight: 44, minWidth: 44, justifyContent: "center" },
  textoEnlace: { fontSize: 14, fontWeight: "bold", textDecorationLine: "underline" },
  boton: { marginTop: 12 },
});
