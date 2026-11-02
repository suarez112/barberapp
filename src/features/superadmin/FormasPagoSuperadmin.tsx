import { useEffect, useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTelefono from "@/components/ui/CampoTelefono";
import CampoTexto from "@/components/ui/CampoTexto";
import ZonaFoto from "@/components/ui/ZonaFoto";
import { useTelefono } from "@/hooks/useTelefono";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { avisar, confirmar } from "@/utils/dialogos";
import { elegirImagenQr, formularioQr } from "@/utils/imagenes";
import { TipoQr } from "../pagos/api";
import ImagenQr from "../pagos/components/ImagenQr";
import {
  borrarQrPago,
  CambiosFormasPago,
  FormasPagoAdmin,
  guardarFormasPago,
  obtenerFormasPago,
  rutaQrSuperadmin,
  subirQrPago,
} from "./api";
import Encabezado from "./components/Encabezado";
import EstadoCarga from "./components/EstadoCarga";
import { formatearFecha } from "./formato";
import { useCargar } from "./useCargar";
import { useSuperadmin } from "./SuperadminContext";

// Desde este ancho de ventana: datos a la izquierda y códigos QR a la derecha
const ANCHO_DOS_COLUMNAS = 1100;

type Configurada = Extract<FormasPagoAdmin, { configurada: true }>;

const TIPOS_QR: { tipo: TipoQr; nombre: string }[] = [
  { tipo: "nequi", nombre: "QR de Nequi" },
  { tipo: "breb", nombre: "QR de Bre-B" },
];

// Formas de pago que ven los administradores al pagar su plan (pagos manuales)
export default function FormasPagoSuperadmin() {
  const [local, setLocal] = useState<FormasPagoAdmin | null>(null);
  const { datos, cargando, error, recargar } = useCargar(
    (token, signal) => obtenerFormasPago(token, signal),
    "formas",
  );
  const config = local ?? datos;

  return (
    <View>
      <Encabezado
        titulo="Formas de pago"
        subtitulo="Lo que ve el administrador de un negocio cuando paga su plan: Nequi, llave Bre-B y códigos QR."
      />
      <EstadoCarga
        cargando={cargando}
        error={error}
        hayDatos={config !== null}
        onReintentar={recargar}
      >
        {config ? (
          <Formulario config={config} onActualizado={setLocal} />
        ) : null}
      </EstadoCarga>
    </View>
  );
}

type Props = {
  config: FormasPagoAdmin;
  onActualizado: (c: FormasPagoAdmin) => void;
};

function Formulario({ config, onActualizado }: Props) {
  const { colors } = useAppTheme();
  const { token, cerrarSiVencio } = useSuperadmin();
  const actual: Configurada | null = config.configurada ? config : null;
  const dosColumnas = useWindowDimensions().width >= ANCHO_DOS_COLUMNAS;

  const whatsapp = useTelefono();
  const [titular, setTitular] = useState(actual?.titular ?? "");
  const [nequi, setNequi] = useState(actual?.nequi.numero ?? "");
  const [llave, setLlave] = useState(actual?.llaveBreb.llave ?? "");
  const [nequiActivo, setNequiActivo] = useState(actual?.nequi.activo ?? false);
  const [llaveActiva, setLlaveActiva] = useState(
    actual?.llaveBreb.activa ?? false,
  );
  const [qrActivo, setQrActivo] = useState(actual?.qr.activo ?? false);
  const [errores, setErrores] = useState<{ titular?: string }>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState<TipoQr | null>(null);
  // Cada subida o borrado cambia la versión para volver a descargar la vista previa
  const [version, setVersion] = useState(0);

  // El teléfono se carga una sola vez, al abrir
  useEffect(() => {
    if (actual) whatsapp.cargar(actual.whatsapp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mostrarError = (e: unknown, porDefecto: string) => {
    if (esCancelada(e) || cerrarSiVencio(e)) return;
    registrarCausa("Formas de pago", e);
    setErrorServidor(describirError(e, { titulo: "", porDefecto }).mensaje);
  };

  // Vuelve a poner en el formulario lo que guardó el servidor
  const aplicar = (c: FormasPagoAdmin) => {
    onActualizado(c);
    if (!c.configurada) return;
    setTitular(c.titular);
    setNequi(c.nequi.numero ?? "");
    setLlave(c.llaveBreb.llave ?? "");
    setNequiActivo(c.nequi.activo);
    setLlaveActiva(c.llaveBreb.activa);
    setQrActivo(c.qr.activo);
    whatsapp.cargar(c.whatsapp);
  };

  const guardar = async () => {
    if (guardando) return;
    setErrorServidor(null);
    const nuevos: { titular?: string } = {};
    if (!titular.trim())
      nuevos.titular = "Escribe el nombre del titular de las cuentas.";
    setErrores(nuevos);
    const tel = !actual ? whatsapp.validar() : whatsapp.validarOpcional();
    if (nuevos.titular || tel === null) return;

    const cambios: CambiosFormasPago = {
      titular: titular.trim(),
      nequiNumero: nequi.trim() || null,
      llaveBreb: llave.trim() || null,
      nequiActivo,
      llaveBrebActiva: llaveActiva,
      qrActivo,
    };
    if (tel !== "vacio") {
      cambios.whatsapp = tel.telefono;
      cambios.indicativo = tel.indicativo;
    }

    setGuardando(true);
    try {
      const r = await guardarFormasPago(token, cambios);
      aplicar(r.formasPago);
      avisar("Listo", r.mensaje, "exito");
    } catch (e) {
      mostrarError(e, "No se pudieron guardar las formas de pago.");
    } finally {
      setGuardando(false);
    }
  };

  const subirQr = async (tipo: TipoQr) => {
    if (subiendo) return;
    setErrorServidor(null);
    const imagen = await elegirImagenQr();
    if (!imagen) return;
    setSubiendo(tipo);
    try {
      const r = await subirQrPago(token, tipo, formularioQr(imagen));
      setVersion((v) => v + 1);
      onActualizado(r.formasPago);
      avisar("Listo", r.mensaje, "exito");
    } catch (e) {
      mostrarError(e, "No se pudo subir el código QR.");
    } finally {
      setSubiendo(null);
    }
  };

  const quitarQr = async (tipo: TipoQr, nombre: string) => {
    if (subiendo) return;
    setErrorServidor(null);
    const seguir = await confirmar({
      titulo: `¿Quitar el ${nombre}?`,
      mensaje: "Los administradores dejarán de verlo al pagar.",
      destructivo: true,
      textoAceptar: "QUITAR",
    });
    if (!seguir) return;
    setSubiendo(tipo);
    try {
      const r = await borrarQrPago(token, tipo);
      setVersion((v) => v + 1);
      // Si el servidor no dejó el interruptor activo, el formulario lo refleja
      onActualizado(r.formasPago);
      if (r.formasPago.configurada) setQrActivo(r.formasPago.qr.activo);
      avisar("Listo", r.mensaje, "exito");
    } catch (e) {
      mostrarError(e, "No se pudo quitar el código QR.");
    } finally {
      setSubiendo(null);
    }
  };

  const interruptor = (
    texto: string,
    ayuda: string,
    valor: boolean,
    cambiar: (v: boolean) => void,
  ) => (
    <View style={styles.interruptor}>
      <View style={styles.textoInterruptor}>
        <Text
          style={[styles.etiquetaInterruptor, { color: colors.textPrimary }]}
        >
          {texto}
        </Text>
        <Text
          style={[
            styles.estado,
            { color: valor ? colors.exitoTexto : colors.textSecondary },
          ]}
        >
          {valor ? "Activa: la ven los administradores" : "Desactivada"}
        </Text>
      </View>
      <Switch
        value={valor}
        onValueChange={cambiar}
        disabled={guardando}
        accessibilityLabel={`${texto}: ${valor ? "activa" : "desactivada"}`}
        accessibilityHint={ayuda}
        trackColor={{ false: colors.inputBorder, true: colors.primary }}
      />
    </View>
  );

  const tarjeta = [
    styles.tarjeta,
    { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
  ];
  const titulo = (texto: string) => (
    <Text
      accessibilityRole="header"
      style={[styles.titulo, { color: colors.primaryText }]}
    >
      {texto}
    </Text>
  );

  return (
    <View style={styles.columna}>
      {!actual ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.aviso,
            { borderColor: colors.cardBorder, backgroundColor: colors.cardBg },
          ]}
        >
          <Text style={[styles.textoAviso, { color: colors.textPrimary }]}>
            Todavía no hay formas de pago. Escribe el titular y el WhatsApp,
            guarda, y luego sube los códigos QR.
          </Text>
        </View>
      ) : null}

      <View style={dosColumnas ? styles.dosColumnas : styles.columna}>
        <View style={dosColumnas ? styles.izquierda : styles.columna}>
          <View style={styles.fila}>
            <View style={[tarjeta, styles.mitad]}>
              {titulo("QUIÉN COBRA")}
              <CampoTexto
                etiqueta="Titular"
                obligatorio
                placeholder="ej: Juan Pérez"
                ayuda="Nombre de la persona a quien se paga"
                value={titular}
                maxLength={100}
                onChangeText={(t) => {
                  setTitular(t);
                  setErrores({});
                }}
                error={errores.titular}
              />
              <CampoTelefono
                telefono={whatsapp}
                etiqueta="WhatsApp para recibir comprobantes"
                ayuda="Número al que los administradores envían el comprobante. Para otro país, toca la bandera."
                obligatorio={!actual}
              />
            </View>

            <View style={[tarjeta, styles.mitad]}>
              {titulo("DATOS DE PAGO")}
              <CampoTexto
                etiqueta="Número de Nequi"
                placeholder="ej: 3001234567"
                ayuda="Celular colombiano de 10 dígitos que empieza en 3. Déjalo vacío para quitarlo."
                keyboardType="number-pad"
                value={nequi}
                maxLength={10}
                onChangeText={(t) => setNequi(t.replace(/\D/g, ""))}
              />
              <CampoTexto
                etiqueta="Llave Bre-B"
                placeholder="ej: @juanperez"
                ayuda="Entre 3 y 60 caracteres. Déjala vacía para quitarla."
                autoCapitalize="none"
                value={llave}
                maxLength={60}
                onChangeText={setLlave}
              />
            </View>
          </View>

          <View style={tarjeta}>
            {titulo("FORMAS ACTIVAS")}
            {interruptor(
              "Nequi",
              "Muestra u oculta el número de Nequi a los administradores",
              nequiActivo,
              setNequiActivo,
            )}
            {interruptor(
              "Llave Bre-B",
              "Muestra u oculta la llave Bre-B a los administradores",
              llaveActiva,
              setLlaveActiva,
            )}
            {interruptor(
              "Código QR",
              "Muestra u oculta los códigos QR a los administradores",
              qrActivo,
              setQrActivo,
            )}
            <Text style={[styles.nota, { color: colors.textSecondary }]}>
              Debe quedar al menos una forma activa, y cada una necesita sus
              datos (el QR, al menos una imagen).
            </Text>
            {errorServidor ? (
              <Text
                accessibilityRole="alert"
                style={[styles.error, { color: colors.error }]}
              >
                {errorServidor}
              </Text>
            ) : null}
            <Boton
              titulo={guardando ? "GUARDANDO…" : "GUARDAR CAMBIOS"}
              ayuda="Guarda el titular, el WhatsApp, los datos de pago y las formas activas"
              deshabilitado={guardando}
              onPress={guardar}
              style={styles.guardar}
            />
            {actual ? (
              <Text style={[styles.nota, { color: colors.textSecondary }]}>
                Última actualización:{" "}
                {formatearFecha(actual.actualizadoEn, true)} por{" "}
                {actual.actualizadoPor}.
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[tarjeta, dosColumnas && styles.derecha]}>
          {titulo("CÓDIGOS QR")}
          <Text style={[styles.nota, { color: colors.textSecondary }]}>
            Imagen JPG, PNG o WEBP de hasta 1 MB. Se sube tal cual, sin
            recortar, para que se pueda leer.
          </Text>
          <View style={styles.fila}>
            {TIPOS_QR.map(({ tipo, nombre }) => {
              const hay = actual?.qr[tipo] ?? false;
              return (
                <View key={tipo} style={styles.qr}>
                  <Text
                    style={[
                      styles.etiquetaInterruptor,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {nombre}
                  </Text>
                  <ZonaFoto
                    etiqueta={
                      hay ? `Reemplazar el ${nombre}` : `Subir el ${nombre}`
                    }
                    ayuda="Abre el explorador de archivos para elegir la imagen del código QR"
                    onPress={() => subirQr(tipo)}
                    style={styles.zona}
                  >
                    {hay ? (
                      <ImagenQr
                        ruta={rutaQrSuperadmin(tipo)}
                        token={token}
                        etiqueta={nombre}
                        version={version}
                        tamano={240}
                      />
                    ) : (
                      <Text
                        style={[styles.vacio, { color: colors.textPrimary }]}
                      >
                        {subiendo === tipo
                          ? "Subiendo…"
                          : `Toca para subir el ${nombre}`}
                      </Text>
                    )}
                  </ZonaFoto>
                  {hay ? (
                    <Text
                      style={[styles.nota, { color: colors.textSecondary }]}
                    >
                      {subiendo === tipo
                        ? "Subiendo…"
                        : "Toca la imagen para reemplazarla."}
                    </Text>
                  ) : null}
                  {hay ? (
                    <Boton
                      titulo="QUITAR"
                      ayuda={`Borra el ${nombre} después de pedir confirmación`}
                      variante="peligro"
                      deshabilitado={subiendo !== null}
                      onPress={() => quitarQr(tipo, nombre)}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columna: { gap: 16 },
  dosColumnas: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  izquierda: { flex: 1, minWidth: 0, gap: 16 },
  derecha: { flex: 1, minWidth: 0, alignSelf: "flex-start" },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  tarjeta: { borderWidth: 1, borderRadius: 12, padding: 20, gap: 8 },
  mitad: { flexGrow: 1, flexBasis: 320 },
  titulo: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  aviso: { borderWidth: 1, borderRadius: 12, padding: 16 },
  textoAviso: { fontSize: 14, lineHeight: 20 },
  interruptor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    minHeight: 56,
  },
  textoInterruptor: { flex: 1 },
  etiquetaInterruptor: { fontSize: 15, fontWeight: "600" },
  estado: { fontSize: 13, marginTop: 2 },
  nota: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  guardar: { marginTop: 8 },
  qr: { flexGrow: 1, flexBasis: 280, gap: 8 },
  zona: { minHeight: 200 },
  vacio: { fontSize: 14, fontWeight: "600", textAlign: "center", padding: 12 },
});
