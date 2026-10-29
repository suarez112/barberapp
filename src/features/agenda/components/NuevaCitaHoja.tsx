import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Boton from "@/components/ui/Boton";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTelefono from "@/components/ui/CampoTelefono";
import CampoTexto from "@/components/ui/CampoTexto";
import Chips from "@/components/ui/Chips";
import Desplegable from "@/components/ui/Desplegable";
import SelectorDias from "@/components/ui/SelectorDias";
import TelefonoConBandera from "@/components/ui/TelefonoConBandera";
import TextoInfo from "@/components/ui/TextoInfo";
import Tocable from "@/components/ui/Tocable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useTelefono } from "@/hooks/useTelefono";
import { describirError, registrarCausa } from "@/services/api/errores";
import { ApiError, esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Barbero, Dia } from "@/types";
import { crearDia, DIAS_MAXIMOS_RESERVA, fechaConDia, hoyColombiaISO, sumarDias } from "@/utils/fechas";
import { formatearPesos, normalizar } from "@/utils/formato";
import { soloDigitos } from "@/utils/telefonos";
import { Cliente, listarClientes } from "../../clientes/api";
import { useNegocio } from "../../negocio/NegocioProvider";
import SelectorHoras from "../../reservas/components/SelectorHoras";
import { useAvisarError } from "../../sesion/useAvisarError";
import { Personal } from "../../sesion/usePersonal";
import {
  consultarDisponibilidadPanel,
  crearCitaPanel,
  HoraDisponible,
  NuevaCitaPanel,
} from "../api";

type Props = {
  personal: Personal;
  // Solo el administrador elige el profesional; el empleado queda como él mismo
  esAdmin: boolean;
  // Quienes pueden recibir la cita (el administrador: todos los que atienden)
  profesionales: Barbero[];
  profesionalInicial: Barbero;
  diaInicial: Dia;
  onCerrar: () => void;
  // La cita se creó: el panel cierra la hoja, recarga la agenda y avisa
  onCreada: () => void;
};

type Modo = "existente" | "nuevo";
type Campo = "profesional" | "servicio" | "hora" | "cliente" | "nombre" | "autorizacion";
type Errores = Partial<Record<Campo, string>>;

const MODOS = [
  { id: "existente", label: "Cliente existente" },
  { id: "nuevo", label: "Cliente nuevo" },
] as const;

// Clientes que se listan a la vez; el resto se encuentra escribiendo en el buscador
const MAXIMO_CLIENTES = 6;

// Hoja que sube desde abajo para agendar una cita desde el panel, por pasos.
// Se monta solo mientras está abierta: cada apertura parte de cero.
export default function NuevaCitaHoja({
  personal,
  esAdmin,
  profesionales,
  profesionalInicial,
  diaInicial,
  onCerrar,
  onCreada,
}: Props) {
  const { colors } = useAppTheme();
  const { bottom } = useSafeAreaInsets();
  const { servicios } = useNegocio();
  const avisarError = useAvisarError();
  const telefono = useTelefono();

  // Solo de hoy a 14 días después (hora de Colombia, como el backend)
  const primerDia = hoyColombiaISO();
  const ultimoDia = sumarDias(primerDia, DIAS_MAXIMOS_RESERVA);
  const diaValido = (d: Dia) => d.fechaFull >= primerDia && d.fechaFull <= ultimoDia;

  const [barberoId, setBarberoId] = useState(profesionalInicial.id);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [dia, setDia] = useState<Dia>(() => (diaValido(diaInicial) ? diaInicial : crearDia(primerDia)));
  const [hora, setHora] = useState("");
  const [modo, setModo] = useState<Modo>(esAdmin ? "existente" : "nuevo");
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  const barbero = profesionales.find((b) => b.id === barberoId) ?? profesionalInicial;
  const servicio = servicios.find((s) => s.id === servicioId) ?? null;

  const quitarError = (campo: Campo) => setErrores((e) => ({ ...e, [campo]: undefined }));

  // --- Horas libres: las calcula el backend para este profesional, servicio y día ---
  // Se guarda con la consulta que las pidió: si no coincide con la actual, aún carga.
  const [intentoHoras, setIntentoHoras] = useState(0);
  const [resultado, setResultado] = useState<{
    clave: string;
    horas: HoraDisponible[];
    error: string | null;
  } | null>(null);
  const fecha = dia.fechaFull;
  const clave = `${barbero.id}|${servicioId}|${fecha}|${intentoHoras}`;
  const hayConsulta = servicioId !== null;
  const cargandoHoras = hayConsulta && resultado?.clave !== clave;
  const horas = hayConsulta && !cargandoHoras ? (resultado?.horas ?? []) : [];
  const errorHoras = hayConsulta && !cargandoHoras ? (resultado?.error ?? null) : null;

  const token = personal.token;
  useEffect(() => {
    if (!servicioId) return;
    const control = new AbortController();
    consultarDisponibilidadPanel({ barberoId: barbero.id, servicioId, fecha }, token, control.signal)
      .then((r) => setResultado({ clave, horas: r.horas, error: null }))
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Horas disponibles:", e);
        setResultado({
          clave,
          horas: [],
          error: describirError(e, { titulo: "", porDefecto: "No se pudieron cargar las horas." })
            .mensaje,
        });
      });
    return () => control.abort();
  }, [barbero.id, servicioId, fecha, token, clave]);

  // --- Clientes existentes: solo el administrador puede leer la lista ---
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [errorClientes, setErrorClientes] = useState<string | null>(null);
  const [intentoClientes, setIntentoClientes] = useState(0);
  const verExistentes = esAdmin && modo === "existente";
  useEffect(() => {
    if (!verExistentes) return;
    const control = new AbortController();
    listarClientes(token, control.signal)
      .then((lista) => {
        setClientes(lista);
        setErrorClientes(null);
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Clientes:", e);
        setErrorClientes(
          describirError(e, { titulo: "", porDefecto: "No se pudieron cargar los clientes." }).mensaje,
        );
      });
    return () => control.abort();
  }, [verExistentes, token, intentoClientes]);

  const q = normalizar(busqueda);
  const qDigitos = soloDigitos(busqueda);
  const coincidencias = (clientes ?? [])
    .filter(
      (c) =>
        !q ||
        normalizar(c.nombre).includes(q) ||
        (qDigitos !== "" && soloDigitos(c.telefono).includes(qDigitos)),
    )
    .sort((a, b) => (b.fechaUltimaCita ?? "").localeCompare(a.fechaUltimaCita ?? ""));
  const clienteElegido = (clientes ?? []).find((c) => c.id === clienteId) ?? null;

  const elegirProfesional = (id: string) => {
    setBarberoId(id);
    setHora("");
    quitarError("profesional");
  };
  const elegirServicio = (id: string) => {
    setServicioId(id);
    setHora("");
    quitarError("servicio");
  };
  const elegirDia = (d: Dia) => {
    setDia(d);
    setHora("");
  };

  const agendar = async () => {
    if (enviando) return;
    const faltan: Errores = {};
    if (!servicio) faltan.servicio = "Elige el servicio.";
    if (servicio && !hora) faltan.hora = "Elige la hora de la cita.";
    if (verExistentes) {
      if (!clienteElegido) faltan.cliente = "Elige un cliente de la lista o pasa a “Cliente nuevo”.";
    } else if (nombre.trim().length < 2) {
      faltan.nombre = "Escribe el nombre del cliente.";
    }
    // validar() deja su propio error bajo el campo del teléfono
    const numero = verExistentes ? null : telefono.validar();
    if (!acepta) faltan.autorizacion = "Confirma que el cliente autorizó el registro de sus datos.";
    setErrores(faltan);
    const hayError = Object.values(faltan).some(Boolean) || (!verExistentes && !numero);
    if (hayError || !servicio) return;

    const comun = {
      barberoId: barbero.id,
      servicioId: servicio.id,
      fecha,
      hora,
      autorizacion_registrada_por_negocio: true,
    } as const;
    const cita: NuevaCitaPanel =
      verExistentes && clienteElegido
        ? { ...comun, clienteId: clienteElegido.id }
        : { ...comun, nombre: nombre.trim(), telefono: numero!.telefono, indicativo: numero!.indicativo };

    setEnviando(true);
    try {
      await crearCitaPanel(cita, token);
      onCreada();
    } catch (e) {
      // La hora se ocupó mientras se llenaba la hoja: se pide la lista de nuevo
      if (e instanceof ApiError && e.status === 409) {
        setHora("");
        setIntentoHoras((n) => n + 1);
      }
      avisarError(e, { titulo: "No se pudo agendar", tituloConflicto: "Hora no disponible" });
    } finally {
      setEnviando(false);
    }
  };

  // Los pasos se numeran según los que se muestran (el empleado no elige profesional)
  let paso = 0;
  const siguiente = () => ++paso;

  const resumen: [string, string | null][] = [
    ["Profesional", barbero.nombre],
    ["Servicio", servicio ? `${servicio.nombre} · ${servicio.duracion} · ${formatearPesos(servicio.precio)}` : null],
    ["Día", fechaConDia(fecha)],
    ["Hora", hora || null],
    [
      "Cliente",
      verExistentes ? (clienteElegido?.nombre ?? null) : nombre.trim() || null,
    ],
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCerrar}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.raiz}
      >
        {/* Fondo atenuado: no cierra al tocarlo, para no perder lo que se llenó */}
        <View style={styles.fondo} />
        <View
          style={[
            styles.hoja,
            { backgroundColor: colors.bg, borderColor: colors.cardBorder, paddingBottom: 12 + bottom },
          ]}
        >
          <View style={[styles.asa, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.cabecera}>
            <Text accessibilityRole="header" style={[styles.titulo, { color: colors.textPrimary }]}>
              Nueva cita
            </Text>
            <BotonIcono
              icono="close"
              color={colors.textPrimary}
              etiqueta="Cerrar"
              ayuda="Cierra la hoja sin agendar la cita"
              tamano={24}
              onPress={onCerrar}
              style={styles.cerrar}
            />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contenido}
          >
            {esAdmin ? (
              <>
                <TituloSeccion style={styles.paso}>{siguiente()}. PROFESIONAL</TituloSeccion>
                <Desplegable
                  etiqueta="Profesional"
                  ayuda="Elige quién atenderá la cita"
                  placeholder="Elige el profesional"
                  obligatorio
                  opciones={profesionales.map((b) => ({ valor: b.id, etiqueta: b.nombre }))}
                  valor={barbero.id}
                  onCambiar={elegirProfesional}
                  error={errores.profesional}
                />
              </>
            ) : null}

            <TituloSeccion style={styles.paso}>{siguiente()}. SERVICIO</TituloSeccion>
            {servicios.length === 0 ? (
              <TextoInfo>Aún no hay servicios. Agrégalos en la pestaña Equipo.</TextoInfo>
            ) : (
              <Desplegable
                etiqueta="Servicio"
                ayuda="Elige el servicio de la cita"
                placeholder="Elige el servicio"
                obligatorio
                opciones={servicios.map((s) => ({
                  valor: s.id,
                  etiqueta: `${s.nombre} · ${s.duracion} · ${formatearPesos(s.precio)}`,
                }))}
                valor={servicioId}
                onCambiar={elegirServicio}
                error={errores.servicio}
              />
            )}

            <TituloSeccion style={styles.paso}>{siguiente()}. DÍA Y HORA</TituloSeccion>
            <SelectorDias
              seleccionado={dia}
              onSeleccionar={elegirDia}
              desde={primerDia}
              hasta={ultimoDia}
            />
            <View style={styles.horas}>
              {!servicio ? (
                <TextoInfo>Elige primero el servicio para ver las horas libres.</TextoInfo>
              ) : cargandoHoras ? (
                <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
              ) : errorHoras ? (
                <View>
                  <TextoInfo>{errorHoras}</TextoInfo>
                  <Boton
                    titulo="REINTENTAR"
                    ayuda="Vuelve a cargar las horas libres"
                    variante="secundario"
                    onPress={() => setIntentoHoras((n) => n + 1)}
                  />
                </View>
              ) : (
                <SelectorHoras
                  horarios={horas}
                  horaSel={hora}
                  onSeleccionar={(h) => {
                    setHora(h);
                    quitarError("hora");
                  }}
                  colors={colors}
                />
              )}
              {errores.hora ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.error, { color: colors.error }]}
                >
                  {errores.hora}
                </Text>
              ) : null}
            </View>

            <TituloSeccion style={styles.paso}>{siguiente()}. CLIENTE</TituloSeccion>
            {esAdmin ? (
              <Chips
                opciones={MODOS}
                valor={modo}
                onCambiar={(m) => {
                  setModo(m);
                  setErrores((e) => ({ ...e, cliente: undefined, nombre: undefined }));
                  telefono.setError(null);
                }}
              />
            ) : null}
            <View style={styles.cliente}>
              {verExistentes ? (
                <>
                  <CampoTexto
                    etiqueta="Buscar cliente"
                    ayuda="Escribe el nombre o el número de celular del cliente"
                    placeholder="ej: Juan o 300 123"
                    value={busqueda}
                    onChangeText={setBusqueda}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {clientes === null && !errorClientes ? (
                    <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
                  ) : errorClientes && clientes === null ? (
                    <View>
                      <TextoInfo>{errorClientes}</TextoInfo>
                      <Boton
                        titulo="REINTENTAR"
                        ayuda="Vuelve a cargar los clientes"
                        variante="secundario"
                        onPress={() => {
                          setErrorClientes(null);
                          setIntentoClientes((n) => n + 1);
                        }}
                      />
                    </View>
                  ) : coincidencias.length === 0 ? (
                    <TextoInfo>
                      {clientes?.length
                        ? "Ningún cliente coincide. Pasa a “Cliente nuevo” para registrarlo."
                        : "Aún no tienes clientes. Pasa a “Cliente nuevo”."}
                    </TextoInfo>
                  ) : (
                    <View accessibilityRole="radiogroup" style={styles.lista}>
                      {coincidencias.slice(0, MAXIMO_CLIENTES).map((c) => (
                        <FilaCliente
                          key={c.id}
                          cliente={c}
                          elegido={c.id === clienteId}
                          onElegir={() => {
                            setClienteId(c.id);
                            quitarError("cliente");
                          }}
                        />
                      ))}
                      {coincidencias.length > MAXIMO_CLIENTES ? (
                        <Text style={[styles.nota, { color: colors.textSecondary }]}>
                          Se muestran {MAXIMO_CLIENTES} de {coincidencias.length}. Escribe para filtrar.
                        </Text>
                      ) : null}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <CampoTexto
                    etiqueta="Nombre del cliente"
                    ayuda="Escribe el nombre y el apellido del cliente"
                    placeholder="ej: Juan Pérez"
                    obligatorio
                    value={nombre}
                    onChangeText={(t) => {
                      setNombre(t);
                      quitarError("nombre");
                    }}
                    error={errores.nombre}
                    autoCapitalize="words"
                    autoComplete="name"
                    textContentType="name"
                  />
                  <CampoTelefono
                    telefono={telefono}
                    etiqueta="Celular del cliente"
                    obligatorio
                  />
                </>
              )}
              {errores.cliente ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.error, { color: colors.error }]}
                >
                  {errores.cliente}
                </Text>
              ) : null}
            </View>

            <TituloSeccion style={styles.paso}>{siguiente()}. AUTORIZACIÓN</TituloSeccion>
            <View style={styles.autorizacion}>
              <Tocable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acepta }}
                accessibilityLabel="El cliente autorizó el registro de sus datos"
                accessibilityHint={[
                  errores.autorizacion ? `Error: ${errores.autorizacion}` : null,
                  "Toca para marcar o desmarcar. Es obligatorio para agendar",
                ]
                  .filter(Boolean)
                  .join(". ")}
                style={styles.casilla}
                onPress={() => {
                  setAcepta(!acepta);
                  quitarError("autorizacion");
                }}
              >
                <Ionicons
                  name={acepta ? "checkbox" : "square-outline"}
                  size={26}
                  color={errores.autorizacion ? colors.error : colors.primaryText}
                />
              </Tocable>
              <Text
                style={[styles.textoAutorizacion, { color: colors.textPrimary }]}
                onPress={() => {
                  setAcepta(!acepta);
                  quitarError("autorizacion");
                }}
              >
                El cliente autorizó el registro de sus datos *
              </Text>
            </View>
            {errores.autorizacion ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.error, { color: colors.error }]}
              >
                {errores.autorizacion}
              </Text>
            ) : null}

            <TituloSeccion style={styles.paso}>RESUMEN</TituloSeccion>
            <View style={[styles.resumen, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {resumen.map(([titulo, valor]) => (
                <View key={titulo} style={styles.filaResumen}>
                  <Text style={[styles.tituloResumen, { color: colors.textSecondary }]}>{titulo}</Text>
                  <Text
                    style={[
                      styles.valorResumen,
                      { color: valor ? colors.textPrimary : colors.textSecondary },
                    ]}
                  >
                    {valor ?? "Sin elegir"}
                  </Text>
                </View>
              ))}
            </View>

            <Boton
              titulo={enviando ? "AGENDANDO..." : "AGENDAR"}
              ayuda="Agenda la cita con los datos de la hoja"
              onPress={agendar}
              deshabilitado={enviando}
              style={styles.agendar}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Un cliente de la lista; los que están en la lista negra no se pueden elegir (el backend responde 403)
function FilaCliente({
  cliente,
  elegido,
  onElegir,
}: {
  cliente: Cliente;
  elegido: boolean;
  onElegir: () => void;
}) {
  const { colors } = useAppTheme();
  const bloqueado = cliente.enListaNegra;
  return (
    <Tocable
      accessibilityRole="radio"
      accessibilityState={{ selected: elegido, disabled: bloqueado }}
      accessibilityLabel={`${cliente.nombre}${bloqueado ? ", en la lista negra" : ""}`}
      accessibilityHint={bloqueado ? "No se puede agendar a este cliente" : "Elige este cliente para la cita"}
      disabled={bloqueado}
      onPress={onElegir}
      style={[
        styles.filaCliente,
        {
          backgroundColor: elegido ? colors.cardSelectedBg : colors.cardBg,
          borderColor: elegido ? colors.primaryText : colors.cardBorder,
        },
        bloqueado && styles.bloqueado,
      ]}
    >
      <View style={styles.datosCliente}>
        <Text style={[styles.nombreCliente, { color: colors.textPrimary }]} numberOfLines={1}>
          {cliente.nombre}
        </Text>
        <TelefonoConBandera
          telefono={cliente.telefono}
          indicativo={cliente.indicativo}
          style={{ color: colors.textSecondary, fontSize: 13 }}
        />
        {bloqueado ? (
          <Text style={[styles.nota, { color: colors.peligroTexto }]}>En la lista negra</Text>
        ) : null}
      </View>
      {elegido ? <Ionicons name="checkmark-circle" size={22} color={colors.primaryText} /> : null}
    </Tocable>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, justifyContent: "flex-end" },
  fondo: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0, 0, 0, 0.5)" },
  hoja: {
    maxHeight: "92%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  asa: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 4 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titulo: { fontSize: 20, fontWeight: "bold", flex: 1 },
  cerrar: { width: 44, height: 44 },
  contenido: { paddingBottom: 16 },
  paso: { marginTop: 18, marginBottom: 8 },
  horas: { marginTop: 12 },
  cargando: { marginVertical: 16 },
  cliente: { marginTop: 12 },
  lista: { gap: 8 },
  filaCliente: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  datosCliente: { flex: 1, gap: 2 },
  nombreCliente: { fontSize: 15, fontWeight: "bold" },
  bloqueado: { opacity: 0.5 },
  nota: { fontSize: 12 },
  error: { fontSize: 13, marginTop: 6 },
  autorizacion: { flexDirection: "row", alignItems: "center", gap: 4 },
  casilla: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  textoAutorizacion: { flex: 1, fontSize: 14, lineHeight: 20 },
  resumen: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  filaResumen: { flexDirection: "row", gap: 12 },
  tituloResumen: { width: 84, fontSize: 13 },
  valorResumen: { flex: 1, fontSize: 14, fontWeight: "600" },
  agendar: { marginTop: 16 },
});
