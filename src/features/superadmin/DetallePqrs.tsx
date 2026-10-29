import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import Insignia from "@/components/ui/Insignia";
import Selector from "@/components/ui/Selector";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar } from "@/utils/dialogos";
import { EstadoPqrs, obtenerPqrs, PqrsAdmin, responderPqrs } from "./api";
import EstadoCarga from "./components/EstadoCarga";
import Ficha from "./components/Ficha";
import { ESTADOS_PQRS, formatearFecha, TIPOS_PQRS } from "./formato";
import { useSuperadmin } from "./SuperadminContext";
import { useCargar } from "./useCargar";

const OPCIONES_ESTADO = [
  { id: "recibida", label: "Recibida" },
  { id: "en_proceso", label: "En proceso" },
  { id: "resuelta", label: "Resuelta" },
  { id: "cerrada", label: "Cerrada" },
] as const;

const RESPUESTA_MAX = 2000;

type Props = { radicado: string; onVolver: () => void };

// Detalle de una PQRS: el mensaje, quién la envió y el formulario para cambiar el estado y responder
export default function DetallePqrs({ radicado, onVolver }: Props) {
  const { colors } = useAppTheme();
  const { datos: p, cargando, error, recargar } = useCargar(
    (token, signal) => obtenerPqrs(token, radicado, signal),
    radicado,
  );

  return (
    <View>
      <Tocable
        accessibilityRole="button"
        accessibilityLabel="Volver a PQRS"
        accessibilityHint="Regresa a la lista de PQRS"
        onPress={onVolver}
        style={styles.volver}
      >
        <Ionicons name="arrow-back" size={20} color={colors.primaryText} />
        <Text style={[styles.textoVolver, { color: colors.primaryText }]}>Volver a PQRS</Text>
      </Tocable>
      <EstadoCarga cargando={cargando} error={error} hayDatos={p !== null} onReintentar={recargar}>
        {p ? (
          <View>
            <View style={styles.titulo}>
              <View style={styles.nombre}>
                <Text accessibilityRole="header" style={[styles.h1, { color: colors.textPrimary }]}>
                  {p.radicado}
                </Text>
                <Text style={[styles.subtitulo, { color: colors.textSecondary }]}>
                  {TIPOS_PQRS[p.tipo] ?? p.tipo} · recibida {formatearFecha(p.creadaEn, true)}
                </Text>
              </View>
              <Insignia texto={ESTADOS_PQRS[p.estado].texto} color={ESTADOS_PQRS[p.estado].color} />
            </View>

            <View style={styles.rejilla}>
              <Ficha
                titulo="Quién la envió"
                filas={[
                  ["Nombre", p.nombre],
                  ["Contacto", p.contacto],
                  ["Con cuenta", p.conCuenta ? "Sí" : "No (invitado)"],
                  ["Última actualización", formatearFecha(p.actualizadaEn, true)],
                ]}
              />
              <View
                style={[styles.mensaje, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.etiqueta, { color: colors.primaryText }]}>MENSAJE</Text>
                <Text selectable style={[styles.cuerpo, { color: colors.textPrimary }]}>
                  {p.mensaje}
                </Text>
                {p.respuesta ? (
                  <>
                    <Text style={[styles.etiqueta, styles.separado, { color: colors.primaryText }]}>
                      RESPUESTA ENVIADA {p.respondidaEn ? `· ${formatearFecha(p.respondidaEn, true)}` : ""}
                    </Text>
                    <Text selectable style={[styles.cuerpo, { color: colors.textPrimary }]}>
                      {p.respuesta}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>

            {/* Se vuelve a armar con los datos nuevos después de guardar */}
            <FormularioRespuesta key={`${p.radicado}-${p.actualizadaEn}`} pqrs={p} onGuardada={recargar} />
          </View>
        ) : null}
      </EstadoCarga>
    </View>
  );
}

function FormularioRespuesta({ pqrs, onGuardada }: { pqrs: PqrsAdmin; onGuardada: () => void }) {
  const { colors } = useAppTheme();
  const { token, avisarError } = useSuperadmin();
  const [estado, setEstado] = useState<EstadoPqrs>(pqrs.estado);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    try {
      const resultado = await responderPqrs(token, pqrs.radicado, {
        estado,
        // Sin texto, el backend conserva la respuesta anterior
        respuesta: respuesta.trim() || undefined,
      });
      avisar("Listo", resultado.mensaje, "exito");
      onGuardada();
    } catch (error) {
      avisarError("Responder PQRS", error, "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={[styles.formulario, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <Text accessibilityRole="header" style={[styles.etiqueta, { color: colors.primaryText }]}>
        CAMBIAR ESTADO Y RESPONDER
      </Text>
      <Selector opciones={OPCIONES_ESTADO} valor={estado} onCambiar={setEstado} />
      <CampoTexto
        etiqueta="Respuesta"
        ayuda="Escribe la respuesta para quien envió la PQRS. Si la dejas vacía se conserva la anterior"
        placeholder="ej: Gracias por escribirnos, ya revisamos tu caso..."
        value={respuesta}
        onChangeText={(t) => setRespuesta(t.slice(0, RESPUESTA_MAX))}
        multiline
        maxLength={RESPUESTA_MAX}
        estiloTexto={styles.respuesta}
      />
      <Boton
        titulo={enviando ? "GUARDANDO..." : "GUARDAR"}
        ayuda="Guarda el estado y la respuesta de la PQRS"
        deshabilitado={enviando}
        onPress={guardar}
        style={styles.guardar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  volver: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, marginBottom: 8, alignSelf: "flex-start" },
  textoVolver: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
  titulo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 },
  nombre: { flex: 1 },
  h1: { fontSize: 26, fontWeight: "bold" },
  subtitulo: { fontSize: 14, marginTop: 4 },
  rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  mensaje: { flexGrow: 2, flexBasis: 420, borderWidth: 1, borderRadius: 12, padding: 20 },
  etiqueta: { fontSize: 12, fontWeight: "bold", letterSpacing: 1 },
  separado: { marginTop: 20 },
  cuerpo: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  formulario: { marginTop: 16, borderWidth: 1, borderRadius: 12, padding: 20, maxWidth: 720 },
  respuesta: { minHeight: 120, textAlignVertical: "top" },
  guardar: { marginTop: 8, alignSelf: "flex-start", minWidth: 200 },
});
