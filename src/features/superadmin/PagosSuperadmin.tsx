import { useRef, useState } from "react";
import { Linking, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Chips from "@/components/ui/Chips";
import CampoTexto from "@/components/ui/CampoTexto";
import Insignia from "@/components/ui/Insignia";
import { esEstado } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, confirmar } from "@/utils/dialogos";
import { formatearPesos } from "@/utils/formato";
import { EstadoOrden } from "../pagos/api";
import { ESTADOS_ORDEN } from "../pagos/estados";
import { aprobarPago, listarOrdenesPago, OrdenSuperadmin, rechazarPago } from "./api";
import Encabezado from "./components/Encabezado";
import EstadoCarga from "./components/EstadoCarga";
import ModalAccion from "./components/ModalAccion";
import Paginacion from "./components/Paginacion";
import Tabla, { Columna } from "./components/Tabla";
import { formatearFecha } from "./formato";
import { useSuperadmin } from "./SuperadminContext";
import { useCargar } from "./useCargar";

const POR_PAGINA = 25;
const MOTIVO_MAX = 300;
// Desde este ancho de ventana las órdenes se ven como tabla; abajo, como tarjetas
const ANCHO_TABLA = 1100;

const FILTROS: { id: EstadoOrden; label: string }[] = [
  { id: "pendiente", label: "Pendientes" },
  { id: "aprobada", label: "Aprobados" },
  { id: "rechazada", label: "Rechazados" },
  { id: "anulada", label: "Anulados" },
];

type Revision = { orden: OrdenSuperadmin; accion: "aprobar" | "rechazar" };

// Pagos manuales: órdenes por estado (las más antiguas primero) para aprobarlas o rechazarlas
export default function PagosSuperadmin() {
  const { token, avisarError } = useSuperadmin();
  const [estado, setEstado] = useState<EstadoOrden>("pendiente");
  const [pagina, setPagina] = useState(1);
  const [revision, setRevision] = useState<Revision | null>(null);
  const enTabla = useWindowDimensions().width >= ANCHO_TABLA;

  const { datos, cargando, error, recargar } = useCargar(
    (tk, signal) => listarOrdenesPago(tk, { estado, pagina, limite: POR_PAGINA }, signal),
    `${estado}|${pagina}`,
  );

  return (
    <View>
      <Encabezado
        titulo="Pagos"
        subtitulo="Pagos por Nequi, Bre-B o QR. Revisa el comprobante que llegó por WhatsApp y aprueba o rechaza."
      />
      <Chips
        opciones={FILTROS}
        valor={estado}
        onCambiar={(id) => {
          setEstado(id);
          setPagina(1);
        }}
      />
      <View style={styles.lista}>
        <EstadoCarga cargando={cargando} error={error} hayDatos={datos !== null} onReintentar={recargar}>
          {datos ? (
            <>
              {datos.datos.length === 0 ? (
                <VacioPagos estado={estado} />
              ) : enTabla ? (
                <TablaOrdenes ordenes={datos.datos} onRevisar={(orden, accion) => setRevision({ orden, accion })} />
              ) : (
                <View style={styles.tarjetas}>
                  {datos.datos.map((o) => (
                    <TarjetaOrden key={o.referencia} orden={o} onRevisar={(accion) => setRevision({ orden: o, accion })} />
                  ))}
                </View>
              )}
              <Paginacion total={datos.total} pagina={datos.pagina} limite={datos.limite} onCambiar={setPagina} />
            </>
          ) : null}
        </EstadoCarga>
      </View>

      {revision ? (
        <RevisarPago
          revision={revision}
          onCerrar={() => setRevision(null)}
          onHecho={() => {
            setRevision(null);
            recargar();
          }}
          // Un 409 (ya revisada, negocio suspendido...) deja la lista desactualizada
          onConflicto={recargar}
          token={token}
          avisarError={avisarError}
        />
      ) : null}
    </View>
  );
}

function VacioPagos({ estado }: { estado: EstadoOrden }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.vacio, { borderColor: colors.cardBorder, backgroundColor: colors.cardBg }]}>
      <Text style={[styles.textoVacio, { color: colors.textSecondary }]}>
        {estado === "pendiente" ? "No hay pagos por revisar." : "No hay pagos en este estado."}
      </Text>
    </View>
  );
}

const abrirWhatsAppDe = (whatsapp: string) =>
  Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, "")}`).catch(() =>
    avisar("No se pudo abrir WhatsApp", `Escribe al ${whatsapp}.`, "error"),
  );

// Pantalla ancha: una fila por orden con negocio, plan, monto, fecha, contacto y acciones
function TablaOrdenes({
  ordenes,
  onRevisar,
}: {
  ordenes: OrdenSuperadmin[];
  onRevisar: (orden: OrdenSuperadmin, accion: "aprobar" | "rechazar") => void;
}) {
  const { colors } = useAppTheme();
  const texto = (t: string, extra?: object) => (
    <Text selectable style={[styles.celdaTexto, { color: colors.textPrimary }, extra]}>
      {t}
    </Text>
  );
  const suave = (t: string) => <Text style={[styles.celdaSuave, { color: colors.textSecondary }]}>{t}</Text>;

  const columnas: Columna<OrdenSuperadmin>[] = [
    {
      clave: "negocio",
      titulo: "Negocio",
      ancho: 2,
      render: (o) => (
        <>
          {texto(o.negocio.nombre, styles.negrita)}
          {suave(`Código ${o.negocio.codigoAcceso}`)}
        </>
      ),
    },
    {
      clave: "plan",
      titulo: "Plan",
      ancho: 1.7,
      render: (o) => (
        <>
          {texto(o.plan.nombre)}
          {suave(`${o.profesionales} ${o.profesionales === 1 ? "profesional" : "profesionales"} · ${o.periodo === "mensual" ? "Mensual" : "Anual"}`)}
        </>
      ),
    },
    { clave: "monto", titulo: "Monto", ancho: 1.1, render: (o) => texto(`$${formatearPesos(o.monto)}`, styles.negrita) },
    { clave: "fecha", titulo: "Fecha", ancho: 1.4, render: (o) => texto(formatearFecha(o.creadaEn, true)) },
    {
      clave: "contacto",
      titulo: "Contacto",
      ancho: 2.6,
      render: (o) => (
        <>
          {texto(o.contacto.administradora)}
          {suave(o.contacto.correo ?? "Sin correo")}
          {suave(o.contacto.whatsapp ?? "Sin WhatsApp")}
          {o.contacto.whatsapp ? (
            <Boton
              titulo="ABRIR WHATSAPP"
              ayuda={`Abre una conversación de WhatsApp con ${o.contacto.administradora}`}
              variante="secundario"
              onPress={() => abrirWhatsAppDe(o.contacto.whatsapp as string)}
              style={styles.botonTabla}
            />
          ) : null}
        </>
      ),
    },
    {
      clave: "accion",
      titulo: "Revisión",
      ancho: 2,
      render: (o) =>
        o.estado === "pendiente" ? (
          <View style={styles.accionesTabla}>
            <Boton
              titulo="APROBAR"
              ayuda={`Aprueba el pago de ${o.negocio.nombre} y activa su plan`}
              onPress={() => onRevisar(o, "aprobar")}
              style={styles.botonTabla}
            />
            <Boton
              titulo="RECHAZAR"
              ayuda={`Rechaza el pago de ${o.negocio.nombre}; el plan no cambia`}
              variante="peligro"
              onPress={() => onRevisar(o, "rechazar")}
              style={styles.botonTabla}
            />
          </View>
        ) : (
          <>
            <Insignia texto={ESTADOS_ORDEN[o.estado].texto} color={ESTADOS_ORDEN[o.estado].color} />
            {suave(`${o.revisadaPor ?? "—"} · ${formatearFecha(o.revisadaEn, true)}`)}
            {o.motivoRevision ? suave(`Motivo: ${o.motivoRevision}`) : null}
          </>
        ),
    },
  ];

  return <Tabla columnas={columnas} filas={ordenes} clave={(o) => o.referencia} vacio="No hay pagos." />;
}

function TarjetaOrden({ orden, onRevisar }: { orden: OrdenSuperadmin; onRevisar: (a: "aprobar" | "rechazar") => void }) {
  const { colors } = useAppTheme();
  const { contacto } = orden;
  const profesionales = `${orden.profesionales} ${orden.profesionales === 1 ? "profesional" : "profesionales"}`;

  const dato = (titulo: string, valor: string) => (
    <View style={styles.dato}>
      <Text style={[styles.titulo, { color: colors.textSecondary }]}>{titulo.toUpperCase()}</Text>
      <Text selectable style={[styles.valor, { color: colors.textPrimary }]}>
        {valor}
      </Text>
    </View>
  );

  const abrirWhatsApp = () => {
    if (contacto.whatsapp) abrirWhatsAppDe(contacto.whatsapp);
  };

  return (
    <View
      accessible={false}
      style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
    >
      <View style={styles.cabecera}>
        <View style={styles.negocio}>
          <Text accessibilityRole="header" style={[styles.nombre, { color: colors.textPrimary }]}>
            {orden.negocio.nombre}
          </Text>
          <Text style={[styles.codigo, { color: colors.textSecondary }]}>Código {orden.negocio.codigoAcceso}</Text>
        </View>
        <Insignia texto={ESTADOS_ORDEN[orden.estado].texto} color={ESTADOS_ORDEN[orden.estado].color} />
      </View>

      <View style={styles.datos}>
        {dato("Monto", `$${formatearPesos(orden.monto)}`)}
        {dato("Plan", `${orden.plan.nombre} · ${profesionales}`)}
        {dato("Periodo", orden.periodo === "mensual" ? "Mensual" : "Anual")}
        {dato("Fecha", formatearFecha(orden.creadaEn, true))}
      </View>

      <View style={[styles.contacto, { borderColor: colors.cardBorder }]}>
        <View style={styles.datos}>
          {dato("Administrador", contacto.administradora)}
          {dato("Correo", contacto.correo ?? "—")}
          {dato("WhatsApp", contacto.whatsapp ?? "—")}
        </View>
        {contacto.whatsapp ? (
          <Boton
            titulo="ABRIR WHATSAPP"
            ayuda={`Abre una conversación de WhatsApp con ${contacto.administradora}`}
            variante="secundario"
            onPress={abrirWhatsApp}
            style={styles.botonContacto}
          />
        ) : null}
      </View>

      {orden.estado === "pendiente" ? (
        <View style={styles.acciones}>
          <Boton
            titulo="APROBAR"
            ayuda={`Aprueba el pago de ${orden.negocio.nombre} y activa su plan`}
            onPress={() => onRevisar("aprobar")}
            style={styles.accion}
          />
          <Boton
            titulo="RECHAZAR"
            ayuda={`Rechaza el pago de ${orden.negocio.nombre}; el plan no cambia`}
            variante="peligro"
            onPress={() => onRevisar("rechazar")}
            style={styles.accion}
          />
        </View>
      ) : (
        <View style={styles.datos}>
          {dato("Revisó", orden.revisadaPor ?? "—")}
          {dato("Revisada", formatearFecha(orden.revisadaEn, true))}
          {orden.motivoRevision ? dato("Motivo", orden.motivoRevision) : null}
        </View>
      )}
    </View>
  );
}

type PropsRevisar = {
  revision: Revision;
  token: string;
  onCerrar: () => void;
  onHecho: () => void;
  onConflicto: () => void;
  avisarError: (contexto: string, error: unknown, titulo: string) => void;
};

// Ventana para aprobar (motivo opcional) o rechazar (motivo obligatorio), con confirmación final
function RevisarPago({ revision, token, onCerrar, onHecho, onConflicto, avisarError }: PropsRevisar) {
  const { orden, accion } = revision;
  const aprobar = accion === "aprobar";
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  // Evita un segundo envío antes de que React pinte el botón desactivado
  const enCurso = useRef(false);

  const enviar = async () => {
    if (enCurso.current) return;
    const texto = motivo.trim();
    if (!aprobar && !texto) {
      setErrorMotivo("Escribe el motivo: el administrador lo verá en su historial de pagos.");
      return;
    }
    enCurso.current = true;
    try {
      const seguir = await confirmar({
        titulo: aprobar ? "¿Aprobar este pago?" : "¿Rechazar este pago?",
        mensaje: aprobar
          ? `Se activará la suscripción de ${orden.negocio.nombre} (${orden.plan.nombre}, ${orden.periodo}) por $${formatearPesos(orden.monto)}. Esto no se puede deshacer.`
          : `El plan de ${orden.negocio.nombre} no cambiará y se le avisará al administrador. Esto no se puede deshacer.`,
        destructivo: !aprobar,
        textoAceptar: aprobar ? "APROBAR" : "RECHAZAR",
      });
      if (!seguir) return;
      setEnviando(true);
      const r = aprobar
        ? await aprobarPago(token, orden.referencia, texto || undefined)
        : await rechazarPago(token, orden.referencia, texto);
      avisar("Listo", r.mensaje, "exito");
      onHecho();
    } catch (e) {
      if (esEstado(e, 409)) onConflicto();
      avisarError(aprobar ? "Aprobar pago" : "Rechazar pago", e, "No se pudo completar");
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  };

  return (
    <ModalAccion
      titulo={aprobar ? "Aprobar pago" : "Rechazar pago"}
      descripcion={
        aprobar
          ? `Activa o extiende la suscripción de ${orden.negocio.nombre}. Solo se aplica una vez.`
          : `No cambia la suscripción de ${orden.negocio.nombre}. Se avisa al administrador.`
      }
      textoConfirmar={aprobar ? "APROBAR PAGO" : "RECHAZAR PAGO"}
      ayudaConfirmar={aprobar ? "Pide una confirmación y aprueba el pago" : "Pide una confirmación y rechaza el pago"}
      destructivo={!aprobar}
      enviando={enviando}
      onConfirmar={enviar}
      onCerrar={onCerrar}
    >
      <CampoTexto
        etiqueta={aprobar ? "Motivo (opcional)" : "Motivo"}
        obligatorio={!aprobar}
        ayuda={aprobar ? "Queda guardado en el registro de actividad" : "El administrador lo ve en su historial de pagos"}
        placeholder={aprobar ? "ej: comprobante verificado" : "ej: no encontramos el pago"}
        value={motivo}
        onChangeText={(t) => {
          setMotivo(t.slice(0, MOTIVO_MAX));
          setErrorMotivo(undefined);
        }}
        error={errorMotivo}
        multiline
        maxLength={MOTIVO_MAX}
      />
    </ModalAccion>
  );
}

const styles = StyleSheet.create({
  lista: { marginTop: 16 },
  tarjetas: { gap: 12 },
  vacio: { borderWidth: 1, borderRadius: 12, padding: 32, alignItems: "center" },
  textoVacio: { fontSize: 14 },
  tarjeta: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 16 },
  cabecera: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  negocio: { flexShrink: 1 },
  nombre: { fontSize: 18, fontWeight: "bold" },
  codigo: { fontSize: 13, marginTop: 2 },
  datos: { flexDirection: "row", flexWrap: "wrap", columnGap: 32, rowGap: 12 },
  dato: { minWidth: 120, flexShrink: 1 },
  titulo: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.8, marginBottom: 2 },
  valor: { fontSize: 15, fontWeight: "600" },
  contacto: { borderTopWidth: 1, paddingTop: 16, gap: 12 },
  botonContacto: { alignSelf: "flex-start", minWidth: 180 },
  acciones: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  accion: { flexGrow: 1, flexBasis: 160 },
  celdaTexto: { fontSize: 14 },
  celdaSuave: { fontSize: 12, marginTop: 2 },
  negrita: { fontWeight: "bold" },
  accionesTabla: { gap: 8, alignSelf: "stretch", paddingVertical: 8 },
  botonTabla: { minHeight: 44, alignSelf: "flex-start", minWidth: 140, marginTop: 6 },
});
