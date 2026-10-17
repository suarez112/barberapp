import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BloqueoSemanal from "../components/BloqueoSemanal";
import CarteraPanel from "../components/CarteraPanel";
import CatalogoProductos, { Producto } from "../components/CatalogoProductos";
import ConfirmacionCita from "../components/ConfirmacionCita";
import FotoBarbero from "../components/FotoBarbero";
import SelectorHoras from "../components/SelectorHoras";
import { API_BASE_URL } from "../constants/api";
import { DIAS, EMPRESAS_DB } from "../data/datos";
import {
  INDICATIVO_POR_DEFECTO,
  PAISES,
  detectarIndicativo,
  separarIndicativo,
} from "../data/paises";
import {
  Barbero,
  BloqueoHorario,
  ClienteRegistrado,
  ElementoListaNegra,
  EmpresaConfig,
  NotificacionCliente,
  Servicio,
} from "../types";
import {
  duracionEnMinutos,
  horaAMinutos,
  obtenerHorariosDisponibles,
} from "../utils/disponibilidad";

// Fecha de hoy según el celular, en formato 2026-10-11
const AHORA = new Date();
const HOY_STR = `${AHORA.getFullYear()}-${String(AHORA.getMonth() + 1).padStart(2, "0")}-${String(AHORA.getDate()).padStart(2, "0")}`;

export default function HomeScreen() {
  // Enlace o QR del negocio: ej. ...?codigo=INFINITY entra directo como cliente
  const params = useLocalSearchParams<{ codigo?: string }>();
  const codigoEnlace = (typeof params.codigo === "string" ? params.codigo : "")
    .trim()
    .toUpperCase();
  const modoEnlace = codigoEnlace !== "";
  const empresaDelEnlace = modoEnlace
    ? Object.values(EMPRESAS_DB).find((e) => e.codigoAcceso === codigoEnlace)
    : undefined;

  const [tema, setTema] = useState<"OSCURO" | "CLARO">("OSCURO");
  const [pantallaActual, setPantallaActual] = useState<
    "SELECCION_ROL" | "CLIENTE" | "LOGIN_BARBERO" | "PANEL_BARBERO"
  >(modoEnlace ? "CLIENTE" : "SELECCION_ROL");

  const [empresaActiva, setEmpresaActiva] = useState<EmpresaConfig | null>(
    empresaDelEnlace ?? null,
  );
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [barberos, setBarberos] = useState<Barbero[]>(
    empresaDelEnlace?.barberos ?? [],
  );
  const [serviciosEmpresa, setServiciosEmpresa] = useState<Servicio[]>(
    empresaDelEnlace?.servicios ?? [],
  );

  const [clientesRegistrados, setClientesRegistrados] = useState<
    ClienteRegistrado[]
  >([
    {
      telefono: "3109876543",
      nombre: "Carlos Mendoza",
      fechaUltimaCita: "2026-10-08",
      totalCitas: 3,
    },
    {
      telefono: "3112223344",
      nombre: "Andrés Gomez",
      fechaUltimaCita: "2026-09-15",
      totalCitas: 1,
    },
    {
      telefono: "3001112233",
      nombre: "Laura Restrepo",
      fechaUltimaCita: "2026-08-01",
      totalCitas: 0,
    },
  ]);

  const [listaNegra, setListaNegra] = useState<ElementoListaNegra[]>([
    { id: "1", nombre: "Laura Restrepo", telefono: "3001112233" },
    { id: "2", nombre: "Carlos Mendoza", telefono: "3109876543" },
  ]);
  const [inputTelListaNegra, setInputTelListaNegra] = useState("");
  const [busquedaBloqueados, setBusquedaBloqueados] = useState("");

  // Despliegue de formularios (Acordeón)
  const [mostrarFormIntegrante, setMostrarFormIntegrante] = useState(false);
  const [mostrarFormServicio, setMostrarFormServicio] = useState(false);

  // Formulario integrante (Creación y Edición)
  const [integranteEnEdicion, setIntegranteEnEdicion] =
    useState<Barbero | null>(null);
  const [nuevoNombreBarbero, setNuevoNombreBarbero] = useState("");
  const [nuevoUsuarioBarbero, setNuevoUsuarioBarbero] = useState("");
  const [nuevaClaveBarbero, setNuevaClaveBarbero] = useState("");
  const [nuevaEspecialidadBarbero, setNuevaEspecialidadBarbero] = useState("");
  const [nuevoPorcentajeBarbero, setNuevoPorcentajeBarbero] = useState("");

  // Estado para creación y edición de servicios
  const [servicioEnEdicion, setServicioEnEdicion] = useState<Servicio | null>(
    null,
  );
  const [nombreServicio, setNombreServicio] = useState("");
  const [precioServicio, setPrecioServicio] = useState("");
  const [duracionServicio, setDuracionServicio] = useState("");

  // Login y Supervisión
  const [userInput, setUserInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [barberoLogueado, setBarberoLogueado] = useState<Barbero | null>(null);
  const [token, setToken] = useState("");
  const [empleadoSupervisado, setEmpleadoSupervisado] =
    useState<Barbero | null>(null);

  const [menuBarbero, setMenuBarbero] = useState<
    "AGENDAMIENTOS" | "BLOQUEOS" | "CLIENTES" | "CARTERA" | "NEGOCIO"
  >("AGENDAMIENTOS");
  const [subClientes, setSubClientes] = useState<"HISTORIAL" | "LISTA_NEGRA">(
    "HISTORIAL",
  );
  const [subNegocio, setSubNegocio] = useState<
    "EQUIPO" | "SERVICIOS" | "PRODUCTOS"
  >("EQUIPO");

  // Filtros de Clientes
  const [filtroEstadoCliente, setFiltroEstadoCliente] = useState<
    "TODOS" | "ACTIVOS" | "INACTIVOS"
  >("TODOS");

  const [criterioOrdenCliente, setCriterioOrdenCliente] = useState<
    "DIAS_DESC" | "DIAS_ASC" | "CITAS_DESC" | "CITAS_ASC"
  >("DIAS_DESC");

  const [notificacionesCliente, setNotificacionesCliente] = useState<
    NotificacionCliente[]
  >([]);
  const [hayNotificacionesSinLeer, setHayNotificacionesSinLeer] =
    useState(false);
  const [modalNotifVisible, setModalNotifVisible] = useState(false);

  const [citas, setCitas] = useState<any[]>([
    {
      id: "101",
      cliente: "Carlos Mendoza",
      telefono: "3109876543",
      servicio: "Corte Clásico",
      barberoId: "b3",
      barberoNombre: "Jhon Álvarez",
      empresaId: "infinity",
      fecha: "2026-10-08",
      hora: "12:20 PM",
      precio: 25000,
      estado: "CONFIRMADA",
    },
    {
      id: "102",
      cliente: "Andrés Gomez",
      telefono: "3112223344",
      servicio: "Corte + Barba",
      barberoId: "b1",
      barberoNombre: "Anthonny Beleño",
      empresaId: "infinity",
      fecha: "2026-10-07",
      hora: "02:20 PM",
      precio: 40000,
      estado: "COMPLETADA",
    },
  ]);

  const [bloqueos, setBloqueos] = useState<BloqueoHorario[]>([]);
  // Horas ya tomadas en el negocio (sin datos personales), vienen del servidor
  const [citasOcupadas, setCitasOcupadas] = useState<any[]>([]);

  // Días y Filtros
  const [barberoSel, setBarberoSel] = useState<Barbero | null>(null);
  const [servicioSel, setServicioSel] = useState<Servicio | null>(null);
  const [diaSel, setDiaSel] = useState<any>(
    DIAS.find((d) => d.fechaFull >= HOY_STR) ?? DIAS[0],
  );
  const [diaFiltroCitas, setDiaFiltroCitas] = useState<any>(
    DIAS.find((d) => d.fechaFull === HOY_STR) ?? DIAS[7],
  );
  const [horaSel, setHoraSel] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [indicativo, setIndicativo] = useState(INDICATIVO_POR_DEFECTO);
  const [mostrarPaises, setMostrarPaises] = useState(false);
  // true cuando el cliente eligió el país a mano (o lo escribió con "+"): no se cambia solo
  const [indicativoManual, setIndicativoManual] = useState(false);
  const [aceptaHabeasData, setAceptaHabeasData] = useState(false);
  const [citaConfirmada, setCitaConfirmada] = useState<any>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [vistaCliente, setVistaCliente] = useState<"RESERVAR" | "PRODUCTOS">(
    "RESERVAR",
  );

  // Formulario de productos (administrador)
  const [mostrarFormProducto, setMostrarFormProducto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(
    null,
  );
  const [nombreProducto, setNombreProducto] = useState("");
  const [precioProducto, setPrecioProducto] = useState("");
  const [fotoProducto, setFotoProducto] = useState<string | undefined>(
    undefined,
  );

  // Si el código del enlace llega después de abrir la página, entra al negocio
  useEffect(() => {
    if (!codigoEnlace) return;
    setPantallaActual("CLIENTE");
    if (empresaDelEnlace) {
      setEmpresaActiva(empresaDelEnlace);
      setBarberos(empresaDelEnlace.barberos);
      setServiciosEmpresa(empresaDelEnlace.servicios);
      setVistaCliente("RESERVAR");
    }
  }, [codigoEnlace]);

  const colorPrimarioActivo = empresaActiva
    ? empresaActiva.colorPrimario
    : "#EAB308";
  const colorSecundarioActivo = empresaActiva
    ? empresaActiva.colorSecundario
    : "#0D0D0D";

  const esOscuro = tema === "OSCURO";
  const colors = {
    bg: esOscuro ? colorSecundarioActivo : "#F3F4F6",
    headerBg: esOscuro ? "#1A1A1A" : "#FFFFFF",
    cardBg: esOscuro ? "#171717" : "#FFFFFF",
    cardBorder: esOscuro ? "#262626" : "#E5E7EB",
    textPrimary: esOscuro ? "#FFFFFF" : "#111827",
    textSecondary: esOscuro ? "#A3A3A3" : "#6B7280",
    primary: colorPrimarioActivo,
    cardSelectedBg: esOscuro ? "#262419" : "#FEF9C3",
    inputBg: esOscuro ? "#171717" : "#FFFFFF",
    bottomBarBg: esOscuro ? "#141414" : "#FFFFFF",
  };

  const manejarCerrarSesion = () => {
    const accionSalida = () => {
      setBarberoLogueado(null);
      setEmpleadoSupervisado(null);
      setToken(""); // <- línea nueva
      setCitas([]); // <- línea nueva
      setPantallaActual("LOGIN_BARBERO");
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "¿Deseas cerrar sesión? Se enviará a la pantalla de credenciales.",
        )
      ) {
        accionSalida();
      }
    } else {
      Alert.alert("Cerrar Sesión", "¿Deseas salir del sistema?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", style: "destructive", onPress: accionSalida },
      ]);
    }
  };

  const manejarCambioTelefono = (val: string) => {
    // Si escribe o pega el número con "+52 ..." o "0052 ...", se detecta el país
    const separado = separarIndicativo(val);
    if (separado) {
      setIndicativo(separado.indicativo);
      setIndicativoManual(true);
      setCelular(separado.telefono);
      return;
    }
    setCelular(val);
    // Sin "+": se va adivinando el país según los dígitos que escribe
    if (!indicativoManual) {
      setIndicativo(detectarIndicativo(val.replace(/\D/g, "")));
    }
  };

  // Selector de opciones: todas visibles en una barra fija
  const dibujarSelector = (
    opciones: { id: string; label: string }[],
    valor: string,
    onCambiar: (id: any) => void,
  ) => {
    return (
      <View
        style={{
          flexDirection: "row",
          marginTop: 15,
          marginBottom: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          overflow: "hidden",
        }}
      >
        {opciones.map((o) => {
          const activo = valor === o.id;
          return (
            <TouchableOpacity
              key={o.id}
              onPress={() => onCambiar(o.id)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                backgroundColor: activo ? colors.primary : colors.cardBg,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 12,
                  color: activo ? "#000" : colors.textSecondary,
                }}
              >
                {o.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const cargarCitasOcupadas = async (empresaId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/citas/ocupadas?empresaId=${empresaId}`,
      );
      if (response.ok) setCitasOcupadas(await response.json());
    } catch (error) {
      console.error("Error al cargar horas ocupadas:", error);
    }
  };

  const validarCodigoBarberia = async () => {
    const cod = codigoIngresado.trim().toUpperCase();
    if (!cod) {
      Alert.alert("Código requerido", "Ingresa el código del establecimiento.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/empresas/validar/${cod}`,
      );
      const data = await response.json();

      if (response.ok) {
        setEmpresaActiva(data.empresa);
        setBarberos(data.barberos);
        setServiciosEmpresa(data.servicios);
        cargarCitasOcupadas(data.empresa.id);
        setVistaCliente("RESERVAR");
        setCodigoIngresado("");
      } else {
        Alert.alert(
          "Código Inválido",
          data.error || "Establecimiento no encontrado.",
        );
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
      Alert.alert(
        "Error de conexión",
        "No fue posible conectar con el servidor backend. Verifica que el servidor esté activo.",
      );
    }
  };

  const horariosDisponibles =
    barberoSel && servicioSel && diaSel && empresaActiva
      ? obtenerHorariosDisponibles({
          empresa: empresaActiva,
          barberoId: barberoSel.id,
          servicio: servicioSel,
          fecha: diaSel.fechaFull,
          diaNom: diaSel.diaNom,
          citas: [...citas, ...citasOcupadas],
          bloqueos,
          duracionMinimaServicios: serviciosEmpresa.length
            ? Math.min(
                ...serviciosEmpresa.map((s) => duracionEnMinutos(s.duracion)),
              )
            : undefined,
        })
      : [];

  const agendarCita = async () => {
    const telLimpio = celular.trim().toLowerCase();

    const enListaNegra = listaNegra.some(
      (item) => item.telefono.toLowerCase() === telLimpio,
    );

    if (enListaNegra) {
      Alert.alert(
        "No se puede procesar",
        "No fue posible completar la reserva. Por favor contacte directamente al establecimiento.",
      );
      return;
    }

    const faltantes: string[] = [];
    if (!barberoSel) faltantes.push("Seleccionar Profesional");
    if (!servicioSel) faltantes.push("Seleccionar un Servicio");
    if (!horaSel) faltantes.push("Seleccionar la Hora de la cita");
    if (!celular.trim()) faltantes.push("Escribir tu Teléfono / Celular");
    if (!nombre.trim()) faltantes.push("Escribir tu Nombre Completo");
    if (!aceptaHabeasData)
      faltantes.push("Aceptar la Autorización de Datos (Ley 1581)");

    if (faltantes.length > 0) {
      Alert.alert(
        "Paso Incompleto",
        `Para completar tu reserva te falta:\n\n• ${faltantes.join("\n• ")}`,
      );
      return;
    }

    if (!horariosDisponibles.includes(horaSel)) {
      Alert.alert(
        "Hora no disponible",
        "Esa hora acaba de ocuparse. Por favor elige otra.",
      );
      setHoraSel("");
      return;
    }

    // Enviamos la cita al servidor para que la guarde en la base de datos
    let citaGuardada: any;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: empresaActiva?.id,
          barberoId: barberoSel?.id,
          servicioId: servicioSel?.id,
          fecha: diaSel.fechaFull,
          hora: horaSel,
          nombre: nombre.trim(),
          telefono: celular.trim(),
          indicativo,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert("No se pudo agendar", data.error || "Intenta de nuevo.");
        if (response.status === 409) {
          setHoraSel("");
          if (empresaActiva) cargarCitasOcupadas(empresaActiva.id);
        }
        return;
      }
      citaGuardada = data.cita;
    } catch (error) {
      console.error("Error al agendar:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
      return;
    }

    const yaEsCliente = clientesRegistrados.some(
      (c) => c.telefono.trim() === celular.trim(),
    );

    if (!yaEsCliente) {
      setClientesRegistrados([
        ...clientesRegistrados,
        {
          telefono: celular.trim(),
          indicativo,
          nombre: nombre.trim(),
          fechaUltimaCita: diaSel.fechaFull,
          totalCitas: 1,
        },
      ]);
    } else {
      setClientesRegistrados(
        clientesRegistrados.map((c) =>
          c.telefono.trim() === celular.trim()
            ? {
                ...c,
                fechaUltimaCita: diaSel.fechaFull,
                totalCitas: (c.totalCitas || 0) + 1,
              }
            : c,
        ),
      );
    }

    const nuevaCita = citaGuardada;

    setCitas([...citas, nuevaCita]);
    setCitaConfirmada({
      negocio: empresaActiva?.nombre ?? "",
      profesional: barberoSel?.nombre ?? "",
      foto: barberoSel?.foto,
      servicio: servicioSel?.nombre ?? "",
      duracionMin: duracionEnMinutos(servicioSel?.duracion),
      precio: servicioSel?.precio ?? 0,
      fecha: diaSel.fechaFull,
      hora: horaSel,
    });

    setBarberoSel(null);
    setServicioSel(null);
    setHoraSel("");
    setNombre("");
    setCelular("");
    setIndicativo(INDICATIVO_POR_DEFECTO);
    setIndicativoManual(false);
    setAceptaHabeasData(false);
  };

  const cambiarEstadoCita = async (id: string, nuevoEstado: string) => {
    const citaActualizada = citas.find((c) => c.id === id);

    // Primero le pedimos permiso al servidor. Si lo rechaza, no cambiamos nada.
    let datosServidor: any = {};
    if (nuevoEstado === "CANCELADA") {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/citas/${id}/cancelar`,
          { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json();
        if (!response.ok) {
          Alert.alert("No se pudo cancelar", data.error || "Intenta de nuevo.");
          return;
        }
        datosServidor = data;
      } catch (error) {
        console.error("Error al cancelar:", error);
        Alert.alert(
          "Error de conexión",
          "No se pudo conectar con el servidor.",
        );
        return;
      }
    }

    setCitas((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              estado: nuevoEstado,
              ...(nuevoEstado === "CANCELADA"
                ? {
                    canceladaEn:
                      datosServidor.canceladaEn ?? new Date().toISOString(),
                    canceladaPor:
                      datosServidor.canceladaPor ?? barberoLogueado?.nombre,
                  }
                : {}),
            }
          : c,
      ),
    );

    if (citaActualizada && nuevoEstado === "CANCELADA") {
      const msjNotif: NotificacionCliente = {
        id: Date.now().toString(),
        titulo: "❌ CITA CANCELADA",
        mensaje: `${citaActualizada.barberoNombre} canceló tu cita del ${citaActualizada.fecha} a las ${citaActualizada.hora}. Por favor elige otro horario.`,
        fecha: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setNotificacionesCliente((prev) => [msjNotif, ...prev]);
      setHayNotificacionesSinLeer(true);
    }
  };

  // Poner en false cuando termines de probar
  const MODO_PRUEBAS = true;

  const fechaHoraCita = (fecha: string, hora: string) => {
    const [h12, resto] = hora.split(":");
    const [min, ampm] = resto.split(" ");
    let h = parseInt(h12) % 12;
    if (ampm === "PM") h += 12;
    const [y, m, d] = fecha.split("-").map(Number);
    return new Date(y, m - 1, d, h, parseInt(min));
  };

  const formatearHora = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const minutosDespuesDeLaCita = (c: any) =>
    c.completadaEn
      ? (new Date(c.completadaEn).getTime() -
          fechaHoraCita(c.fecha, c.hora).getTime()) /
        60000
      : 0;

  const completarCita = (c: any) => {
    if (c.barberoId !== barberoLogueado?.id) {
      Alert.alert(
        "No permitido",
        "Solo el profesional de la cita puede marcarla como completada.",
      );
      return;
    }
    if (!MODO_PRUEBAS && new Date() < fechaHoraCita(c.fecha, c.hora)) {
      Alert.alert(
        "Aún no es la hora",
        "No puedes completar una cita antes de su hora.",
      );
      return;
    }
    Alert.alert(
      "Completar servicio",
      `¿Confirmas que el servicio de ${c.cliente} ya se realizó? Se registrará la hora exacta.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, completado",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/api/v1/citas/${c.id}/completar`,
                {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              const data = await response.json();
              if (!response.ok) {
                Alert.alert(
                  "No se pudo completar",
                  data.error || "Intenta de nuevo.",
                );
                return;
              }

              const ahora = data.completadaEn;
              setCitas((prev) =>
                prev.map((x) =>
                  x.id === c.id
                    ? {
                        ...x,
                        estado: "COMPLETADA",
                        completadaEn: data.completadaEn,
                        completadaPor: data.completadaPor,
                      }
                    : x,
                ),
              );
              setNotificacionesCliente((prev) => [
                {
                  id: Date.now().toString(),
                  titulo: "✅ SERVICIO REGISTRADO",
                  mensaje: `Se registró tu servicio de ${c.servicio} con ${c.barberoNombre} a las ${formatearHora(ahora)}. Si no fue así, avisa al establecimiento.`,
                  fecha: formatearHora(ahora),
                },
                ...prev,
              ]);
              setHayNotificacionesSinLeer(true);
            } catch (error) {
              console.error("Error al completar:", error);
              Alert.alert(
                "Error de conexión",
                "No se pudo conectar con el servidor.",
              );
            }
          },
        },
      ],
    );
  };

  const abrirModalNotificaciones = () => {
    setModalNotifVisible(true);
    setHayNotificacionesSinLeer(false);
  };

  const eliminarUnaNotificacion = (id: string) => {
    setNotificacionesCliente(notificacionesCliente.filter((n) => n.id !== id));
  };

  const borrarTodasNotificaciones = () => {
    setNotificacionesCliente([]);
  };

  const guardarFotoBarbero = (id: string, uri: string) => {
    const nuevosBarberos = barberos.map((b) =>
      b.id === id ? { ...b, foto: uri } : b,
    );
    setBarberos(nuevosBarberos);

    if (empresaActiva && EMPRESAS_DB[empresaActiva.id]) {
      EMPRESAS_DB[empresaActiva.id].barberos = nuevosBarberos;
    }

    if (barberoLogueado?.id === id) {
      setBarberoLogueado({ ...barberoLogueado, foto: uri });
    }
  };

  // CREAR O EDITAR INTEGRANTE
  const guardarIntegrante = () => {
    if (
      !nuevoNombreBarbero.trim() ||
      !nuevoUsuarioBarbero.trim() ||
      !nuevaClaveBarbero.trim()
    ) {
      Alert.alert(
        "Datos Incompletos",
        "Completa Nombre, Usuario y Contraseña para el integrante.",
      );
      return;
    }

    const pctParsed = parseFloat(nuevoPorcentajeBarbero);
    const pct = isNaN(pctParsed) ? 50 : pctParsed;

    let nuevosBarberos: Barbero[] = [];

    if (integranteEnEdicion) {
      nuevosBarberos = barberos.map((b) =>
        b.id === integranteEnEdicion.id
          ? {
              ...b,
              nombre: nuevoNombreBarbero.trim(),
              usuario: nuevoUsuarioBarbero.trim().toLowerCase(),
              clave: nuevaClaveBarbero.trim(),
              especialidad:
                nuevaEspecialidadBarbero.trim() || "Estilista · Especialista",
              porcentajeGanancia: pct,
            }
          : b,
      );

      if (barberoLogueado?.id === integranteEnEdicion.id) {
        setBarberoLogueado({
          ...barberoLogueado,
          nombre: nuevoNombreBarbero.trim(),
          usuario: nuevoUsuarioBarbero.trim().toLowerCase(),
          clave: nuevaClaveBarbero.trim(),
          especialidad:
            nuevaEspecialidadBarbero.trim() || "Estilista · Especialista",
          porcentajeGanancia: pct,
        });
      }

      Alert.alert(
        "¡Actualizado!",
        `Los datos de "${nuevoNombreBarbero}" han sido guardados.`,
      );
      setIntegranteEnEdicion(null);
    } else {
      const nuevo: Barbero = {
        id: Date.now().toString(),
        nombre: nuevoNombreBarbero.trim(),
        usuario: nuevoUsuarioBarbero.trim().toLowerCase(),
        clave: nuevaClaveBarbero.trim(),
        esAdmin: false,
        especialidad:
          nuevaEspecialidadBarbero.trim() || "Estilista · Especialista",
        equipo: `${empresaActiva?.nombre} TEAM`,
        porcentajeGanancia: pct,
      };

      nuevosBarberos = [...barberos, nuevo];
      Alert.alert(
        "¡Éxito!",
        `${nuevo.nombre} registrado con ${pct}% de ganancia.`,
      );
    }

    setBarberos(nuevosBarberos);

    if (empresaActiva && EMPRESAS_DB[empresaActiva.id]) {
      EMPRESAS_DB[empresaActiva.id].barberos = nuevosBarberos;
    }

    setNuevoNombreBarbero("");
    setNuevoUsuarioBarbero("");
    setNuevaClaveBarbero("");
    setNuevaEspecialidadBarbero("");
    setNuevoPorcentajeBarbero("");
    setMostrarFormIntegrante(false);
  };

  const iniciarEdicionIntegrante = (b: Barbero) => {
    setMostrarFormIntegrante(true);
    setIntegranteEnEdicion(b);
    setNuevoNombreBarbero(b.nombre);
    setNuevoUsuarioBarbero(b.usuario);
    setNuevaClaveBarbero(b.clave);
    setNuevaEspecialidadBarbero(b.especialidad);
    setNuevoPorcentajeBarbero(b.porcentajeGanancia.toString());
  };

  const cancelarEdicionIntegrante = () => {
    setIntegranteEnEdicion(null);
    setNuevoNombreBarbero("");
    setNuevoUsuarioBarbero("");
    setNuevaClaveBarbero("");
    setNuevaEspecialidadBarbero("");
    setNuevoPorcentajeBarbero("");
    setMostrarFormIntegrante(false);
  };

  const eliminarBarberoDelEquipo = (
    id: string,
    nombreBarbero: string,
    esAdmin: boolean,
  ) => {
    if (esAdmin) {
      Alert.alert(
        "Acción no permitida",
        "No se puede eliminar la cuenta del Administrador principal.",
      );
      return;
    }

    Alert.alert("Confirmar", `¿Deseas retirar a ${nombreBarbero} del equipo?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          const nuevosBarberos = barberos.filter((b) => b.id !== id);
          setBarberos(nuevosBarberos);

          if (empresaActiva && EMPRESAS_DB[empresaActiva.id]) {
            EMPRESAS_DB[empresaActiva.id].barberos = nuevosBarberos;
          }

          if (integranteEnEdicion?.id === id) cancelarEdicionIntegrante();

          Alert.alert("Eliminado", `${nombreBarbero} retirado.`);
        },
      },
    ]);
  };

  const guardarServicioEmpresa = () => {
    if (!nombreServicio.trim() || !precioServicio.trim()) {
      Alert.alert(
        "Datos Incompletos",
        "Escribe el nombre y precio del servicio.",
      );
      return;
    }

    let nuevosServicios: Servicio[] = [];

    if (servicioEnEdicion) {
      nuevosServicios = serviciosEmpresa.map((s) =>
        s.id === servicioEnEdicion.id
          ? {
              ...s,
              nombre: nombreServicio.trim(),
              duracion: duracionServicio.trim() || "30 min",
              precio: parseFloat(precioServicio) || 0,
            }
          : s,
      );
      Alert.alert(
        "¡Actualizado!",
        `Servicio "${nombreServicio}" modificado con éxito.`,
      );
      setServicioEnEdicion(null);
    } else {
      const nuevoS: Servicio = {
        id: Date.now().toString(),
        nombre: nombreServicio.trim(),
        duracion: duracionServicio.trim() || "30 min",
        precio: parseFloat(precioServicio) || 0,
      };

      nuevosServicios = [...serviciosEmpresa, nuevoS];
      Alert.alert(
        "¡Servicio Creado!",
        `${nuevoS.nombre} agregado al catálogo.`,
      );
    }

    setServiciosEmpresa(nuevosServicios);

    if (empresaActiva && EMPRESAS_DB[empresaActiva.id]) {
      EMPRESAS_DB[empresaActiva.id].servicios = nuevosServicios;
    }

    setNombreServicio("");
    setPrecioServicio("");
    setDuracionServicio("");
    setMostrarFormServicio(false);
  };

  const iniciarEdicionServicio = (s: Servicio) => {
    setMostrarFormServicio(true);
    setServicioEnEdicion(s);
    setNombreServicio(s.nombre);
    setPrecioServicio(s.precio.toString());
    setDuracionServicio(s.duracion);
  };

  const cancelarEdicionServicio = () => {
    setServicioEnEdicion(null);
    setNombreServicio("");
    setPrecioServicio("");
    setDuracionServicio("");
    setMostrarFormServicio(false);
  };

  const eliminarServicioEmpresa = (id: string, nombreServicio: string) => {
    Alert.alert("Confirmar", `¿Eliminar servicio "${nombreServicio}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          const nuevosServicios = serviciosEmpresa.filter((s) => s.id !== id);
          setServiciosEmpresa(nuevosServicios);

          if (empresaActiva && EMPRESAS_DB[empresaActiva.id]) {
            EMPRESAS_DB[empresaActiva.id].servicios = nuevosServicios;
          }

          if (servicioEnEdicion?.id === id) cancelarEdicionServicio();
        },
      },
    ]);
  };

  const elegirFotoProducto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!r.canceled && r.assets?.length) setFotoProducto(r.assets[0].uri);
  };

  const cancelarEdicionProducto = () => {
    setProductoEnEdicion(null);
    setNombreProducto("");
    setPrecioProducto("");
    setFotoProducto(undefined);
    setMostrarFormProducto(false);
  };

  const guardarProducto = () => {
    const valor = parseInt(precioProducto.replace(/\D/g, ""), 10);
    if (!nombreProducto.trim() || !valor) {
      Alert.alert(
        "Faltan datos",
        "Escribe el nombre y el precio del producto.",
      );
      return;
    }
    if (!empresaActiva) return;

    if (productoEnEdicion) {
      setProductos(
        productos.map((p) =>
          p.id === productoEnEdicion.id
            ? {
                ...p,
                nombre: nombreProducto.trim(),
                precio: valor,
                foto: fotoProducto,
              }
            : p,
        ),
      );
    } else {
      setProductos([
        ...productos,
        {
          id: Date.now().toString(),
          empresaId: empresaActiva.id,
          nombre: nombreProducto.trim(),
          precio: valor,
          foto: fotoProducto,
        },
      ]);
    }
    cancelarEdicionProducto();
  };

  const iniciarEdicionProducto = (p: Producto) => {
    setMostrarFormProducto(true);
    setProductoEnEdicion(p);
    setNombreProducto(p.nombre);
    setPrecioProducto(p.precio.toString());
    setFotoProducto(p.foto);
  };

  const eliminarProducto = (p: Producto) => {
    Alert.alert("Confirmar", `¿Eliminar producto "${p.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          setProductos(productos.filter((x) => x.id !== p.id));
          if (productoEnEdicion?.id === p.id) cancelarEdicionProducto();
        },
      },
    ]);
  };

  const agregarAListaNegra = () => {
    const tel = inputTelListaNegra.trim();

    if (!tel) {
      Alert.alert("Falta el teléfono", "Escribe el teléfono del cliente.");
      return;
    }

    const cliente = clientesRegistrados.find((c) => c.telefono.trim() === tel);
    if (!cliente) {
      Alert.alert(
        "No es cliente registrado",
        "Este número no pertenece a ningún cliente que haya reservado.",
      );
      return;
    }

    if (listaNegra.some((i) => i.telefono.trim() === tel)) {
      Alert.alert(
        "Ya está bloqueado",
        `${cliente.nombre} ya está en la lista negra.`,
      );
      return;
    }

    setListaNegra([
      ...listaNegra,
      { id: Date.now().toString(), nombre: cliente.nombre, telefono: tel },
    ]);
    Alert.alert("Agregado", `"${cliente.nombre}" añadido a la lista negra.`);
    setInputTelListaNegra("");
  };

  // TOGLE BLOQUEO Y DESBLOQUEO DIRECTO DESDE CLIENTES
  const alternarBloqueoClienteDirecto = (
    nombreCliente: string,
    telefonoCliente: string,
  ) => {
    const estaEnLista = listaNegra.some(
      (item) =>
        item.telefono.trim().toLowerCase() ===
          telefonoCliente.trim().toLowerCase() ||
        item.nombre.trim().toLowerCase() === nombreCliente.trim().toLowerCase(),
    );

    if (estaEnLista) {
      // DESBLOQUEAR
      Alert.alert(
        "Desbloquear Cliente",
        `¿Deseas quitar a "${nombreCliente}" de la lista negra y permitirle agendar nuevamente?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sí, Desbloquear",
            onPress: () => {
              setListaNegra(
                listaNegra.filter(
                  (item) =>
                    item.telefono.trim().toLowerCase() !==
                      telefonoCliente.trim().toLowerCase() &&
                    item.nombre.trim().toLowerCase() !==
                      nombreCliente.trim().toLowerCase(),
                ),
              );
              Alert.alert(
                "Desbloqueado",
                `${nombreCliente} ya puede agendar citas.`,
              );
            },
          },
        ],
      );
    } else {
      // BLOQUEAR
      Alert.alert(
        "Bloquear Cliente",
        `¿Deseas enviar a "${nombreCliente}" a la Lista Negra? No podrá volver a agendar.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Bloquear Cliente",
            style: "destructive",
            onPress: () => {
              setListaNegra([
                ...listaNegra,
                {
                  id: Date.now().toString(),
                  nombre: nombreCliente,
                  telefono: telefonoCliente,
                },
              ]);
              Alert.alert(
                "Cliente Bloqueado",
                `${nombreCliente} ha sido agregado a la lista negra.`,
              );
            },
          },
        ],
      );
    }
  };

  const eliminarDeListaNegra = (id: string) => {
    setListaNegra(listaNegra.filter((item) => item.id !== id));
  };

  const iniciarSesionBarbero = async () => {
    if (!userInput.trim() || !passInput.trim()) {
      Alert.alert(
        "Campos requeridos",
        "Por favor ingresa usuario y contraseña.",
      );
      return;
    }

    try {
      // 1. Le preguntamos al servidor si el usuario y la clave son correctos
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: userInput,
          clave: passInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Error de acceso",
          data.error || "Credenciales incorrectas.",
        );
        return;
      }

      // 2. Con el código del negocio, traemos sus colores, equipo y servicios
      const resNegocio = await fetch(
        `${API_BASE_URL}/api/v1/empresas/validar/${data.barbero.empresaCodigo}`,
      );
      const negocio = await resNegocio.json();

      if (!resNegocio.ok) {
        Alert.alert(
          "Error",
          negocio.error || "No se pudieron cargar los datos del negocio.",
        );
        return;
      }

      // Traemos las citas reales. El servidor solo las entrega
      // si mostramos el token que recibimos al iniciar sesión
      const resAgenda = await fetch(`${API_BASE_URL}/api/v1/citas/agenda`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      setCitas(resAgenda.ok ? await resAgenda.json() : []);
      setToken(data.token);

      // 3. Guardamos todo y abrimos el panel
      setEmpresaActiva(negocio.empresa);
      setBarberos(negocio.barberos);
      setServiciosEmpresa(negocio.servicios);
      setBarberoLogueado(data.barbero);
      setEmpleadoSupervisado(null);
      setMenuBarbero("AGENDAMIENTOS");
      setUserInput("");
      setPassInput("");
      setPantallaActual("PANEL_BARBERO");
      Alert.alert("¡Bienvenido!", `Hola, ${data.barbero.nombre}`);
    } catch (error) {
      console.error("Error en login:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
    }
  };

  const profesionalActivoEnPanel =
    barberoLogueado?.esAdmin && empleadoSupervisado
      ? empleadoSupervisado
      : barberoLogueado;

  const citasDelPanelPorDia =
    profesionalActivoEnPanel && empresaActiva
      ? citas
          .filter(
            (c) =>
              c.barberoId === profesionalActivoEnPanel.id &&
              c.empresaId === empresaActiva.id &&
              c.fecha === diaFiltroCitas.fechaFull,
          )
          .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora))
      : [];

  // WhatsApp: arma el número internacional (solo dígitos) con el indicativo
  // guardado en la cita. Las citas antiguas sin indicativo se tratan así:
  // 10 dígitos -> Colombia (57); 11 a 15 dígitos -> ya traen indicativo.
  const numeroParaWhatsApp = (
    telefono?: string,
    indicativoCita?: string,
  ): string | null => {
    const digitos = (telefono ?? "").replace(/\D/g, "");
    if (!digitos) return null;
    const ind = (indicativoCita ?? "").replace(/\D/g, "");
    let numero: string;
    if (ind) numero = `${ind}${digitos}`;
    else if (digitos.length === 10) numero = `57${digitos}`;
    else numero = digitos;
    return numero.length >= 8 && numero.length <= 15 ? numero : null;
  };

  const abrirWhatsApp = async (telefono?: string, indicativoCita?: string) => {
    const numero = numeroParaWhatsApp(telefono, indicativoCita);
    if (!numero) {
      Alert.alert(
        "Sin número disponible",
        "Este cliente no tiene un número de teléfono válido registrado.",
      );
      return;
    }
    try {
      await Linking.openURL(`https://wa.me/${numero}`);
    } catch (error) {
      console.error("Error al abrir WhatsApp:", error);
      Alert.alert("No se pudo abrir WhatsApp", "Verifica que esté instalado.");
    }
  };

  const calcularDiasTranscurridos = (fechaStr?: string) => {
    if (!fechaStr) return 999;
    const fechaActual = new Date(2026, 9, 8); // 8 de Octubre 2026
    const partes = fechaStr.split("-");
    const fechaCita = new Date(
      parseInt(partes[0]),
      parseInt(partes[1]) - 1,
      parseInt(partes[2]),
    );

    const diferenciaMS = fechaActual.getTime() - fechaCita.getTime();
    const dias = Math.floor(diferenciaMS / (1000 * 60 * 60 * 24));
    return dias < 0 ? 0 : dias;
  };

  const obtenerClientesProcesados = () => {
    const listaBase = clientesRegistrados.map((client) => {
      const citasDelCliente = citas.filter(
        (c) =>
          c.telefono.trim() === client.telefono.trim() &&
          (barberoLogueado?.esAdmin
            ? empleadoSupervisado
              ? c.barberoId === empleadoSupervisado.id
              : true
            : c.barberoId === barberoLogueado?.id),
      );

      const totalCitasContadas =
        citasDelCliente.length || client.totalCitas || 0;
      const esActivo = totalCitasContadas > 1 || citasDelCliente.length > 0;
      const diasPasados = calcularDiasTranscurridos(client.fechaUltimaCita);

      return {
        ...client,
        totalCitasCalculado: totalCitasContadas,
        diasTranscurridos: diasPasados,
        estadoCliente: esActivo ? "ACTIVO" : "INACTIVO",
      };
    });

    const filtrados = listaBase.filter((c) => {
      if (filtroEstadoCliente === "ACTIVOS")
        return c.estadoCliente === "ACTIVO";
      if (filtroEstadoCliente === "INACTIVOS")
        return c.estadoCliente === "INACTIVO";
      return true;
    });

    return filtrados.sort((a, b) => {
      if (criterioOrdenCliente === "DIAS_DESC") {
        return b.diasTranscurridos - a.diasTranscurridos;
      }
      if (criterioOrdenCliente === "DIAS_ASC") {
        return a.diasTranscurridos - b.diasTranscurridos;
      }
      if (criterioOrdenCliente === "CITAS_DESC") {
        return b.totalCitasCalculado - a.totalCitasCalculado;
      }
      if (criterioOrdenCliente === "CITAS_ASC") {
        return a.totalCitasCalculado - b.totalCitasCalculado;
      }
      return 0;
    });
  };

  const listaClientesFiltrados = obtenerClientesProcesados();

  const clienteEncontradoLN = clientesRegistrados.find(
    (c) => c.telefono.trim() === inputTelListaNegra.trim(),
  );

  // LISTA NEGRA FILTRADA CON BÚSQUEDA EN TIEMPO REAL
  const listaNegraFiltrada = listaNegra.filter((item) => {
    const q = busquedaBloqueados.toLowerCase().trim();
    if (!q) return true;
    return item.nombre.toLowerCase().includes(q) || item.telefono.includes(q);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={esOscuro ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />

      {/* CABECERA */}
      <View
        style={[
          styles.headerTitleBar,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.cardBorder,
          },
        ]}
      >
        {/* BOTÓN VOLVER CON FLECHA A LA IZQUIERDA EN PANTALLAS DE ACCESO */}
        {pantallaActual === "LOGIN_BARBERO" ? (
          <TouchableOpacity
            style={styles.btnSoloFlechaBack}
            onPress={() => {
              setPantallaActual("SELECCION_ROL");
              setEmpresaActiva(null);
              setUserInput("");
              setPassInput("");
            }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : (
          !modoEnlace &&
          pantallaActual !== "SELECCION_ROL" &&
          pantallaActual !== "PANEL_BARBERO" && (
            <TouchableOpacity
              style={styles.btnSoloFlechaBack}
              onPress={() => {
                setPantallaActual("SELECCION_ROL");
                setEmpresaActiva(null);
              }}
            >
              <Ionicons
                name="arrow-back-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          )
        )}

        <Text style={[styles.headerAppTitle, { color: colors.primary }]}>
          {empresaActiva ? `✨ ${empresaActiva.nombre}` : "✂️ AGENDAMIENTOS"}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {pantallaActual === "CLIENTE" && empresaActiva && (
            <TouchableOpacity
              style={[
                styles.btnTema,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={abrirModalNotificaciones}
            >
              <Ionicons
                name="notifications-outline"
                size={16}
                color={colors.primary}
              />
              {hayNotificacionesSinLeer && (
                <View style={styles.badgeNotifDot} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.btnTema,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={() => setTema(esOscuro ? "CLARO" : "OSCURO")}
          >
            <Ionicons
              name={esOscuro ? "sunny-outline" : "moon-outline"}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>

          {pantallaActual === "PANEL_BARBERO" && (
            <TouchableOpacity
              style={[styles.btnVolverAcceso, { backgroundColor: "#7F1D1D" }]}
              onPress={manejarCerrarSesion}
            >
              <Ionicons name="log-out-outline" size={14} color="#FECACA" />
              <Text style={[styles.btnVolverAccesoText, { color: "#FECACA" }]}>
                Salir
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          style={{ paddingHorizontal: 16 }}
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          {/* ==================== PANTALLA 1: SELECCIÓN DE ROL ==================== */}
          {pantallaActual === "SELECCION_ROL" && (
            <View style={styles.boxBienvenida}>
              <Text
                style={[styles.bienvenidaTitulo, { color: colors.primary }]}
              >
                ¿CÓMO DESEAS INGRESAR?
              </Text>
              <Text
                style={[styles.bienvenidaSub, { color: colors.textSecondary }]}
              >
                Selecciona tu perfil para continuar
              </Text>

              <TouchableOpacity
                style={[
                  styles.cardRolOpcion,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => setPantallaActual("CLIENTE")}
              >
                <Ionicons
                  name="person-outline"
                  size={32}
                  color={colors.primary}
                />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text
                    style={[styles.titleCard, { color: colors.textPrimary }]}
                  >
                    Soy Cliente
                  </Text>
                  <Text
                    style={[styles.subCard, { color: colors.textSecondary }]}
                  >
                    Agendar citas con el código del establecimiento
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cardRolOpcion,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={() => setPantallaActual("LOGIN_BARBERO")}
              >
                <Ionicons name="key-outline" size={32} color={colors.primary} />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text
                    style={[styles.titleCard, { color: colors.textPrimary }]}
                  >
                    Acceso Equipo / Administrador
                  </Text>
                  <Text
                    style={[styles.subCard, { color: colors.textSecondary }]}
                  >
                    Ingreso directo con credenciales
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* ==================== PANTALLA 2: VISTA CLIENTE ==================== */}
          {pantallaActual === "CLIENTE" && (
            <View>
              {!empresaActiva ? (
                <View style={{ marginTop: 30 }}>
                  <Text style={[styles.pasoTag, { color: colors.primary }]}>
                    INGRESA EL CÓDIGO DEL ESTABLECIMIENTO
                  </Text>
                  <Text
                    style={[
                      styles.subCard,
                      { color: colors.textSecondary, marginBottom: 15 },
                    ]}
                  >
                    Ingresa el código facilitado (Prueba: `INFINITY` o `BUNKER`)
                  </Text>

                  <TextInput
                    style={[
                      styles.inputDark,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.cardBorder,
                        color: colors.textPrimary,
                        textAlign: "center",
                        fontSize: 18,
                        fontWeight: "bold",
                        letterSpacing: 2,
                      },
                    ]}
                    placeholder="Escribir Código (ej: INFINITY)"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                    value={codigoIngresado}
                    onChangeText={setCodigoIngresado}
                  />

                  <TouchableOpacity
                    style={[
                      styles.btnGoldAction,
                      { backgroundColor: colors.primary, marginTop: 10 },
                    ]}
                    onPress={validarCodigoBarberia}
                  >
                    <Text style={styles.btnGoldText}>ENTRAR AL NEGOCIO</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 10,
                      marginBottom: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      overflow: "hidden",
                    }}
                  >
                    {(["RESERVAR", "PRODUCTOS"] as const).map((v) => (
                      <TouchableOpacity
                        key={v}
                        onPress={() => setVistaCliente(v)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          alignItems: "center",
                          backgroundColor:
                            vistaCliente === v ? colors.primary : colors.cardBg,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "bold",
                            color:
                              vistaCliente === v
                                ? "#000"
                                : colors.textSecondary,
                          }}
                        >
                          {v === "RESERVAR" ? "Reservar" : "Productos"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {vistaCliente === "PRODUCTOS" && (
                    <View style={{ marginTop: 10 }}>
                      <CatalogoProductos
                        colors={colors}
                        modo="cliente"
                        empresaId={empresaActiva.id}
                        productos={productos}
                      />
                    </View>
                  )}

                  {vistaCliente === "RESERVAR" && (
                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 10,
                        }}
                      >
                        <Text
                          style={[
                            styles.pasoTag,
                            { color: colors.primary, marginTop: 0 },
                          ]}
                        >
                          PASO 1 · SELECCIONA PROFESIONAL
                        </Text>
                        {!modoEnlace && (
                          <TouchableOpacity
                            onPress={() => setEmpresaActiva(null)}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                color: colors.textSecondary,
                                textDecorationLine: "underline",
                              }}
                            >
                              Cambiar Código
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* ✅ CÓDIGO CORREGIDO: */}
                      <View style={styles.grid2}>
                        {barberos.map((b) => {
                          const esSel = barberoSel?.id === b.id;
                          return (
                            <TouchableOpacity
                              key={b.id}
                              style={[
                                styles.cardDark,
                                {
                                  backgroundColor: colors.cardBg,
                                  borderColor: colors.cardBorder,
                                },
                                esSel && {
                                  borderColor: colors.primary,
                                  backgroundColor: colors.cardSelectedBg,
                                },
                              ]}
                              onPress={() => {
                                setBarberoSel(b);
                                setHoraSel("");
                              }}
                            >
                              <FotoBarbero
                                nombre={b.nombre}
                                foto={b.foto}
                                color={colors.primary}
                                forma="rectangulo"
                              />
                              <Text
                                style={[
                                  styles.titleCard,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {b.nombre}
                              </Text>
                              <Text
                                style={[
                                  styles.subCard,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {b.especialidad}
                              </Text>
                              <Text style={styles.teamTag}>{b.equipo}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={[styles.pasoTag, { color: colors.primary }]}>
                        SERVICIO
                      </Text>
                      <View style={styles.grid2}>
                        {serviciosEmpresa.map((s) => {
                          const esSel = servicioSel?.id === s.id;
                          return (
                            <TouchableOpacity
                              key={s.id}
                              style={[
                                styles.cardDark,
                                {
                                  backgroundColor: colors.cardBg,
                                  borderColor: colors.cardBorder,
                                },
                                esSel && {
                                  borderColor: colors.primary,
                                  backgroundColor: colors.cardSelectedBg,
                                },
                              ]}
                              onPress={() => {
                                setServicioSel(s);
                                setHoraSel("");
                              }}
                            >
                              <Text
                                style={[
                                  styles.titleCard,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {s.nombre}
                              </Text>
                              <Text
                                style={[
                                  styles.precioCard,
                                  { color: colors.primary },
                                ]}
                              >
                                {s.duracion} · $
                                {s.precio.toLocaleString("es-CO")}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text style={[styles.pasoTag, { color: colors.primary }]}>
                        PASO 2 · DÍA
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 15 }}
                      >
                        {DIAS.filter((d) => d.fechaFull >= HOY_STR).map((d) => {
                          const esSel = diaSel.id === d.id;
                          return (
                            <TouchableOpacity
                              key={d.id}
                              style={[
                                styles.dayCard,
                                {
                                  backgroundColor: colors.cardBg,
                                  borderColor: colors.cardBorder,
                                },
                                esSel && {
                                  borderColor: colors.primary,
                                  backgroundColor: colors.cardSelectedBg,
                                },
                              ]}
                              onPress={() => {
                                setDiaSel(d);
                                setHoraSel("");
                              }}
                            >
                              <Text
                                style={[
                                  styles.dayName,
                                  esSel && { color: colors.primary },
                                ]}
                              >
                                {d.diaNom}
                              </Text>
                              <Text
                                style={[
                                  styles.dayNum,
                                  { color: colors.textPrimary },
                                  esSel && { color: colors.primary },
                                ]}
                              >
                                {d.num}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 9,
                                  color: colors.textSecondary,
                                }}
                              >
                                OCT
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      <Text style={[styles.pasoTag, { color: colors.primary }]}>
                        HORA DISPONIBLE ({horariosDisponibles.length}{" "}
                        DISPONIBLES)
                      </Text>
                      {!barberoSel || !servicioSel ? (
                        <Text style={styles.infoText}>
                          ⚠️ Selecciona primero un profesional y un servicio.
                        </Text>
                      ) : (
                        <SelectorHoras
                          horarios={horariosDisponibles}
                          horaSel={horaSel}
                          onSeleccionar={setHoraSel}
                          colors={colors}
                        />
                      )}
                      <Text style={[styles.pasoTag, { color: colors.primary }]}>
                        PASO 3 · TUS DATOS
                      </Text>

                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.inputDark,
                            {
                              backgroundColor: colors.inputBg,
                              borderColor: colors.cardBorder,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            },
                          ]}
                          onPress={() => setMostrarPaises(true)}
                          accessibilityLabel="Elegir indicativo del país"
                        >
                          <Text
                            style={{
                              color: colors.textPrimary,
                              fontWeight: "bold",
                            }}
                          >
                            +{indicativo}
                          </Text>
                          <Ionicons
                            name="chevron-down"
                            size={14}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                        <TextInput
                          style={[
                            styles.inputDark,
                            {
                              flex: 1,
                              backgroundColor: colors.inputBg,
                              borderColor: colors.cardBorder,
                              color: colors.textPrimary,
                            },
                          ]}
                          placeholder="Teléfono / Celular"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="phone-pad"
                          value={celular}
                          onChangeText={manejarCambioTelefono}
                        />
                      </View>
                      {celular.trim() !== "" && (
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: 11,
                            marginTop: -4,
                            marginBottom: 10,
                          }}
                        >
                          País:{" "}
                          {PAISES.find((p) => p.indicativo === indicativo)
                            ?.nombre ?? `+${indicativo}`}{" "}
                          · si no es, toca el +{indicativo} para cambiarlo
                        </Text>
                      )}

                      <Modal
                        visible={mostrarPaises}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setMostrarPaises(false)}
                      >
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            justifyContent: "center",
                            padding: 24,
                          }}
                          activeOpacity={1}
                          onPress={() => setMostrarPaises(false)}
                        >
                          <View
                            style={{
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                              borderWidth: 1,
                              borderRadius: 10,
                              padding: 8,
                            }}
                          >
                            <ScrollView style={{ maxHeight: 380 }}>
                              {PAISES.map((p) => (
                                <TouchableOpacity
                                  key={p.indicativo}
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    padding: 12,
                                  }}
                                  onPress={() => {
                                    setIndicativo(p.indicativo);
                                    setIndicativoManual(true);
                                    setMostrarPaises(false);
                                  }}
                                >
                                  <Text
                                    style={{
                                      color:
                                        p.indicativo === indicativo
                                          ? colors.primary
                                          : colors.textPrimary,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {p.nombre}
                                  </Text>
                                  <Text style={{ color: colors.textSecondary }}>
                                    +{p.indicativo}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </TouchableOpacity>
                      </Modal>

                      <TextInput
                        style={[
                          styles.inputDark,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.cardBorder,
                            color: colors.textPrimary,
                          },
                        ]}
                        placeholder="Nombre Completo"
                        placeholderTextColor={colors.textSecondary}
                        value={nombre}
                        onChangeText={setNombre}
                      />

                      <TouchableOpacity
                        style={styles.boxHabeasData}
                        onPress={() => setAceptaHabeasData(!aceptaHabeasData)}
                      >
                        <Ionicons
                          name={
                            aceptaHabeasData ? "checkbox" : "square-outline"
                          }
                          size={22}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.textHabeasData,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Autorizo el tratamiento de mis datos personales
                          exclusivamente para la gestión de mi cita (Ley 1581 de
                          2012).
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.btnGoldAction,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={agendarCita}
                      >
                        <Text style={styles.btnGoldText}>
                          CONFIRMAR RESERVA
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ==================== PANTALLA 3: LOGIN ==================== */}
          {pantallaActual === "LOGIN_BARBERO" && (
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.pasoTag, { color: colors.primary }]}>
                ACCESO INTEGRANTES Y ADMINISTRADORES
              </Text>
              <Text style={[styles.subCard, { color: colors.textSecondary }]}>
                Infinity Barbería: `jhon` / `1234` | Salón Glamour: `carlos` /
                `5678`
              </Text>

              <View style={{ marginTop: 20 }}>
                <TextInput
                  style={[
                    styles.inputDark,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Usuario"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  value={userInput}
                  onChangeText={setUserInput}
                />
                <TextInput
                  style={[
                    styles.inputDark,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  value={passInput}
                  onChangeText={setPassInput}
                />

                <TouchableOpacity
                  style={[
                    styles.btnGoldAction,
                    { backgroundColor: colors.primary, marginTop: 10 },
                  ]}
                  onPress={iniciarSesionBarbero}
                >
                  <Text style={styles.btnGoldText}>INGRESAR AL SISTEMA</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ==================== PANTALLA 4: PANEL BARBERO / JEFE ==================== */}
          {pantallaActual === "PANEL_BARBERO" &&
            barberoLogueado &&
            empresaActiva && (
              <View>
                <View
                  style={[
                    styles.profileBadge,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[styles.profileName, { color: colors.textPrimary }]}
                  >
                    👤 {barberoLogueado.nombre}
                  </Text>
                  <Text style={[styles.profileRole, { color: colors.primary }]}>
                    {barberoLogueado.esAdmin
                      ? `👑 Administrador Principal (${empresaActiva.nombre})`
                      : `💈 Integrante del Equipo (${empresaActiva.nombre}) · ${barberoLogueado.porcentajeGanancia}% Comisión`}
                  </Text>
                </View>

                {/* SELECTOR DE EMPLEADO (ADMINISTRADOR) */}
                {barberoLogueado.esAdmin && (
                  <View style={{ marginTop: 15 }}>
                    <Text
                      style={[
                        styles.pasoTag,
                        { color: colors.primary, marginTop: 0 },
                      ]}
                    >
                      👁️ SUPERVISAR AGENDA Y BALANCES DE:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {barberos.map((emp) => {
                        const esSel = profesionalActivoEnPanel?.id === emp.id;
                        return (
                          <TouchableOpacity
                            key={emp.id}
                            style={[
                              {
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 6,
                                borderWidth: 1,
                                marginRight: 8,
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                              esSel && {
                                borderColor: colors.primary,
                                backgroundColor: colors.cardSelectedBg,
                              },
                            ]}
                            onPress={() => setEmpleadoSupervisado(emp)}
                          >
                            <Text
                              style={[
                                {
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  color: colors.textPrimary,
                                },
                                esSel && { color: colors.primary },
                              ]}
                            >
                              {emp.nombre} {emp.esAdmin && "👑"}
                            </Text>
                            <Text
                              style={{
                                fontSize: 10,
                                color: colors.textSecondary,
                              }}
                            >
                              {emp.porcentajeGanancia}% Comisión
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* TAB 1: CITAS ORGANIZADAS POR DÍA */}
                {menuBarbero === "AGENDAMIENTOS" && (
                  <View>
                    <Text style={[styles.pasoTag, { color: colors.primary }]}>
                      SELECCIONA EL DÍA A CONSULTAR
                    </Text>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 15 }}
                    >
                      {DIAS.map((d) => {
                        const esSel = diaFiltroCitas.id === d.id;
                        return (
                          <TouchableOpacity
                            key={d.id}
                            style={[
                              styles.dayCard,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                              esSel && {
                                borderColor: colors.primary,
                                backgroundColor: colors.cardSelectedBg,
                              },
                            ]}
                            onPress={() => setDiaFiltroCitas(d)}
                          >
                            <Text
                              style={[
                                styles.dayName,
                                esSel && { color: colors.primary },
                              ]}
                            >
                              {d.diaNom}
                            </Text>
                            <Text
                              style={[
                                styles.dayNum,
                                { color: colors.textPrimary },
                                esSel && { color: colors.primary },
                              ]}
                            >
                              {d.num}
                            </Text>
                            <Text
                              style={{
                                fontSize: 9,
                                color: colors.textSecondary,
                              }}
                            >
                              OCT
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <Text style={[styles.pasoTag, { color: colors.primary }]}>
                      CITAS DE {profesionalActivoEnPanel?.nombre.toUpperCase()}{" "}
                      PARA EL {diaFiltroCitas.diaNom} {diaFiltroCitas.num} OCT (
                      {citasDelPanelPorDia.length})
                    </Text>

                    {citasDelPanelPorDia.length === 0 ? (
                      <Text style={styles.infoText}>
                        No hay citas agendadas para esta fecha.
                      </Text>
                    ) : (
                      citasDelPanelPorDia.map((c) => (
                        <View
                          key={c.id}
                          style={[
                            styles.cardCita,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                            },
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={[
                                styles.horaBadge,
                                { color: colors.primary },
                              ]}
                            >
                              ⏰ {c.hora}
                            </Text>
                            <Text
                              style={[
                                styles.badgeState,
                                c.estado === "CONFIRMADA" && {
                                  backgroundColor: "#166534",
                                  color: "#FFF",
                                },
                                c.estado === "COMPLETADA" && {
                                  backgroundColor: "#1E3A8A",
                                  color: "#FFF",
                                },
                                c.estado === "CANCELADA" && {
                                  backgroundColor: "#991B1B",
                                  color: "#FFF",
                                },
                              ]}
                            >
                              {c.estado}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.titleCard,
                              { color: colors.textPrimary, marginTop: 6 },
                            ]}
                          >
                            {c.cliente}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={[
                                styles.subCard,
                                { color: colors.textSecondary },
                              ]}
                            >
                              📞 {c.indicativo ? `+${c.indicativo} ` : ""}
                              {c.telefono}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                abrirWhatsApp(c.telefono, c.indicativo)
                              }
                              accessibilityLabel={`Escribir por WhatsApp a ${c.cliente}`}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={{
                                opacity: numeroParaWhatsApp(
                                  c.telefono,
                                  c.indicativo,
                                )
                                  ? 1
                                  : 0.35,
                              }}
                            >
                              <Ionicons
                                name="logo-whatsapp"
                                size={26}
                                color={
                                  numeroParaWhatsApp(c.telefono, c.indicativo)
                                    ? "#25D366"
                                    : colors.textSecondary
                                }
                              />
                            </TouchableOpacity>
                          </View>
                          <Text
                            style={[
                              styles.subCard,
                              { color: colors.textSecondary },
                            ]}
                          >
                            ✂️ {c.servicio} (${c.precio.toLocaleString("es-CO")}
                            )
                          </Text>

                          {c.estado === "CONFIRMADA" && (
                            <View style={styles.rowBox}>
                              {c.barberoId === barberoLogueado.id && (
                                <TouchableOpacity
                                  style={[
                                    styles.btnState,
                                    { backgroundColor: "#166534" },
                                  ]}
                                  onPress={() => completarCita(c)}
                                >
                                  <Text style={styles.btnStateText}>
                                    Marcar completada
                                  </Text>
                                </TouchableOpacity>
                              )}
                              {barberoLogueado.esAdmin && (
                                <TouchableOpacity
                                  style={[
                                    styles.btnState,
                                    { backgroundColor: "#991B1B" },
                                  ]}
                                  onPress={() =>
                                    Alert.alert(
                                      "Cancelar cita",
                                      `¿Cancelar la cita de ${c.cliente}?`,
                                      [
                                        { text: "No", style: "cancel" },
                                        {
                                          text: "Sí, cancelar",
                                          style: "destructive",
                                          onPress: () =>
                                            cambiarEstadoCita(
                                              c.id,
                                              "CANCELADA",
                                            ),
                                        },
                                      ],
                                    )
                                  }
                                >
                                  <Text style={styles.btnStateText}>
                                    Cancelar cita
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}

                          {c.estado === "COMPLETADA" && c.completadaEn && (
                            <View style={{ marginTop: 8 }}>
                              <Text
                                style={[
                                  styles.subCard,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                ✅ Completada por {c.completadaPor} a las{" "}
                                {formatearHora(c.completadaEn)}
                              </Text>
                              {barberoLogueado.esAdmin &&
                                minutosDespuesDeLaCita(c) > 120 && (
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      color: "#F59E0B",
                                      fontWeight: "bold",
                                      marginTop: 4,
                                    }}
                                  >
                                    ⚠️ Registrada{" "}
                                    {Math.round(minutosDespuesDeLaCita(c) / 60)}{" "}
                                    h después de la cita
                                  </Text>
                                )}
                            </View>
                          )}

                          {c.estado === "CANCELADA" && c.canceladaEn && (
                            <Text
                              style={[
                                styles.subCard,
                                { color: colors.textSecondary, marginTop: 8 },
                              ]}
                            >
                              ❌ Cancelada por {c.canceladaPor} a las{" "}
                              {formatearHora(c.canceladaEn)}
                            </Text>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* TAB 2: INHABILITAR CON CALENDARIO RESTAURADO Y BLOQUEOS POR REPETICIÓN O PUNTUAL */}
                {menuBarbero === "BLOQUEOS" &&
                  barberoLogueado.esAdmin &&
                  profesionalActivoEnPanel && (
                    <BloqueoSemanal
                      colors={colors}
                      barberoId={profesionalActivoEnPanel.id}
                      barberoNombre={profesionalActivoEnPanel.nombre}
                      bloqueos={bloqueos}
                      setBloqueos={setBloqueos}
                      citas={citas}
                      apertura={empresaActiva.horarioApertura}
                      cierre={empresaActiva.horarioCierre}
                    />
                  )}

                {/* TAB 3: CLIENTES (HISTORIAL + LISTA NEGRA) */}
                {menuBarbero === "CLIENTES" &&
                  barberoLogueado.esAdmin &&
                  dibujarSelector(
                    [
                      { id: "HISTORIAL", label: "Historial" },
                      { id: "LISTA_NEGRA", label: "Lista negra" },
                    ],
                    subClientes,
                    setSubClientes,
                  )}

                {menuBarbero === "CLIENTES" &&
                  (subClientes === "HISTORIAL" || !barberoLogueado.esAdmin) && (
                    <View>
                      <Text style={[styles.pasoTag, { color: colors.primary }]}>
                        📋 HISTORIAL DE CLIENTES Y FRECUENCIA
                      </Text>

                      {/* SELECTOR DE ESTADO CLIENTE */}
                      <View
                        style={{
                          flexDirection: "row",
                          backgroundColor: colors.cardBg,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                          padding: 4,
                          marginBottom: 10,
                        }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.btnSegment,
                            filtroEstadoCliente === "TODOS" && {
                              backgroundColor: colors.primary,
                            },
                          ]}
                          onPress={() => setFiltroEstadoCliente("TODOS")}
                        >
                          <Text
                            style={[
                              styles.btnSegmentText,
                              filtroEstadoCliente === "TODOS"
                                ? { color: "#000" }
                                : { color: colors.textSecondary },
                            ]}
                          >
                            Todos ({listaClientesFiltrados.length})
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnSegment,
                            filtroEstadoCliente === "ACTIVOS" && {
                              backgroundColor: colors.primary,
                            },
                          ]}
                          onPress={() => setFiltroEstadoCliente("ACTIVOS")}
                        >
                          <Text
                            style={[
                              styles.btnSegmentText,
                              filtroEstadoCliente === "ACTIVOS"
                                ? { color: "#000" }
                                : { color: colors.textSecondary },
                            ]}
                          >
                            Activos / Frecuentes
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnSegment,
                            filtroEstadoCliente === "INACTIVOS" && {
                              backgroundColor: colors.primary,
                            },
                          ]}
                          onPress={() => setFiltroEstadoCliente("INACTIVOS")}
                        >
                          <Text
                            style={[
                              styles.btnSegmentText,
                              filtroEstadoCliente === "INACTIVOS"
                                ? { color: "#000" }
                                : { color: colors.textSecondary },
                            ]}
                          >
                            Inactivos
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* FILTRO DE ORDENAMIENTO ASCENDENTE / DESCENDENTE */}
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.textSecondary,
                          fontWeight: "bold",
                          marginBottom: 6,
                        }}
                      >
                        ORDENAR POR:
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 15 }}
                      >
                        <TouchableOpacity
                          style={[
                            styles.btnOrdenPill,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                            },
                            criterioOrdenCliente === "DIAS_DESC" && {
                              borderColor: colors.primary,
                              backgroundColor: colors.cardSelectedBg,
                            },
                          ]}
                          onPress={() => setCriterioOrdenCliente("DIAS_DESC")}
                        >
                          <Ionicons
                            name="arrow-down-outline"
                            size={12}
                            color={
                              criterioOrdenCliente === "DIAS_DESC"
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.textOrdenPill,
                              { color: colors.textSecondary },
                              criterioOrdenCliente === "DIAS_DESC" && {
                                color: colors.primary,
                              },
                            ]}
                          >
                            Más tiempo sin venir
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnOrdenPill,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                            },
                            criterioOrdenCliente === "DIAS_ASC" && {
                              borderColor: colors.primary,
                              backgroundColor: colors.cardSelectedBg,
                            },
                          ]}
                          onPress={() => setCriterioOrdenCliente("DIAS_ASC")}
                        >
                          <Ionicons
                            name="arrow-up-outline"
                            size={12}
                            color={
                              criterioOrdenCliente === "DIAS_ASC"
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.textOrdenPill,
                              { color: colors.textSecondary },
                              criterioOrdenCliente === "DIAS_ASC" && {
                                color: colors.primary,
                              },
                            ]}
                          >
                            Más recientes
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnOrdenPill,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                            },
                            criterioOrdenCliente === "CITAS_DESC" && {
                              borderColor: colors.primary,
                              backgroundColor: colors.cardSelectedBg,
                            },
                          ]}
                          onPress={() => setCriterioOrdenCliente("CITAS_DESC")}
                        >
                          <Ionicons
                            name="arrow-down-outline"
                            size={12}
                            color={
                              criterioOrdenCliente === "CITAS_DESC"
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.textOrdenPill,
                              { color: colors.textSecondary },
                              criterioOrdenCliente === "CITAS_DESC" && {
                                color: colors.primary,
                              },
                            ]}
                          >
                            Mayor nº de citas
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnOrdenPill,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                            },
                            criterioOrdenCliente === "CITAS_ASC" && {
                              borderColor: colors.primary,
                              backgroundColor: colors.cardSelectedBg,
                            },
                          ]}
                          onPress={() => setCriterioOrdenCliente("CITAS_ASC")}
                        >
                          <Ionicons
                            name="arrow-up-outline"
                            size={12}
                            color={
                              criterioOrdenCliente === "CITAS_ASC"
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.textOrdenPill,
                              { color: colors.textSecondary },
                              criterioOrdenCliente === "CITAS_ASC" && {
                                color: colors.primary,
                              },
                            ]}
                          >
                            Menor nº de citas
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>

                      {listaClientesFiltrados.length === 0 ? (
                        <Text style={styles.infoText}>
                          No hay clientes registrados en este grupo.
                        </Text>
                      ) : (
                        listaClientesFiltrados.map((cli, idx) => {
                          const estaBloqueado = listaNegra.some(
                            (b) =>
                              b.telefono.trim().toLowerCase() ===
                                cli.telefono.trim().toLowerCase() ||
                              b.nombre.trim().toLowerCase() ===
                                cli.nombre.trim().toLowerCase(),
                          );

                          return (
                            <View
                              key={idx}
                              style={[
                                styles.cardServicioRealizado,
                                {
                                  backgroundColor: colors.cardBg,
                                  borderColor: colors.cardBorder,
                                },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.titleCard,
                                    { color: colors.textPrimary },
                                  ]}
                                >
                                  👤 {cli.nombre}
                                </Text>
                                <Text
                                  style={[
                                    styles.subCard,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  📞 Teléfono: {cli.telefono}
                                </Text>
                                <Text
                                  style={[
                                    styles.subCard,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  📅 Última visita:{" "}
                                  {cli.fechaUltimaCita
                                    ? `${cli.fechaUltimaCita} (${
                                        cli.diasTranscurridos === 0
                                          ? "Hoy"
                                          : `hace ${cli.diasTranscurridos} días`
                                      })`
                                    : "Sin registro"}
                                </Text>
                              </View>

                              <View style={{ alignItems: "flex-end", gap: 6 }}>
                                <Text
                                  style={[
                                    styles.badgeState,
                                    cli.estadoCliente === "ACTIVO"
                                      ? {
                                          backgroundColor: "#166534",
                                          color: "#FFF",
                                        }
                                      : {
                                          backgroundColor: "#854D0E",
                                          color: "#FFF",
                                        },
                                  ]}
                                >
                                  {cli.estadoCliente === "ACTIVO"
                                    ? "FRECUENTE / ACTIVO"
                                    : "INACTIVO"}
                                </Text>

                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      color: colors.primary,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {cli.totalCitasCalculado} Citas
                                  </Text>

                                  {/* BOTÓN TOGGLE DE BLOQUEO / DESBLOQUEO EN TIEMPO REAL */}
                                  {barberoLogueado?.esAdmin && (
                                    <TouchableOpacity
                                      style={{
                                        backgroundColor: estaBloqueado
                                          ? "#166534"
                                          : "#7F1D1D",
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 4,
                                      }}
                                      onPress={() =>
                                        alternarBloqueoClienteDirecto(
                                          cli.nombre,
                                          cli.telefono,
                                        )
                                      }
                                    >
                                      <Text
                                        style={{
                                          color: "#FFF",
                                          fontSize: 9,
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {estaBloqueado
                                          ? "✅ Desbloquear"
                                          : "🚫 Bloquear"}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}

                {/* TAB 4: NEGOCIO (EQUIPO, SERVICIOS Y PRODUCTOS) */}
                {menuBarbero === "NEGOCIO" &&
                  barberoLogueado.esAdmin &&
                  dibujarSelector(
                    [
                      { id: "EQUIPO", label: "Equipo" },
                      { id: "SERVICIOS", label: "Servicios" },
                      { id: "PRODUCTOS", label: "Productos" },
                    ],
                    subNegocio,
                    setSubNegocio,
                  )}

                {menuBarbero === "NEGOCIO" && barberoLogueado.esAdmin && (
                  <View>
                    {subNegocio === "EQUIPO" && (
                      <>
                        {/* ACORDEÓN FORMULARIO INTEGRANTE */}
                        <TouchableOpacity
                          style={[
                            styles.headerAcordeonForm,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                              marginTop: 15,
                            },
                          ]}
                          onPress={() =>
                            setMostrarFormIntegrante(!mostrarFormIntegrante)
                          }
                        >
                          <Text
                            style={[
                              styles.titleAcordeon,
                              { color: colors.primary },
                            ]}
                          >
                            {integranteEnEdicion
                              ? "✏️ EDITANDO INTEGRANTE"
                              : "➕ REGISTRAR NUEVO INTEGRANTE"}
                          </Text>
                          <Ionicons
                            name={
                              mostrarFormIntegrante
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={20}
                            color={colors.primary}
                          />
                        </TouchableOpacity>

                        {mostrarFormIntegrante && (
                          <View
                            style={[
                              styles.bodyAcordeonForm,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Nombre Completo"
                              placeholderTextColor={colors.textSecondary}
                              value={nuevoNombreBarbero}
                              onChangeText={setNuevoNombreBarbero}
                            />
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Usuario para ingresar"
                              placeholderTextColor={colors.textSecondary}
                              autoCapitalize="none"
                              value={nuevoUsuarioBarbero}
                              onChangeText={setNuevoUsuarioBarbero}
                            />
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Contraseña"
                              placeholderTextColor={colors.textSecondary}
                              secureTextEntry
                              value={nuevaClaveBarbero}
                              onChangeText={setNuevaClaveBarbero}
                            />
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Especialidad (ej: Colorimetría · Manicure)"
                              placeholderTextColor={colors.textSecondary}
                              value={nuevaEspecialidadBarbero}
                              onChangeText={setNuevaEspecialidadBarbero}
                            />
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Porcentaje de Comisión % (Ej: 50)"
                              placeholderTextColor={colors.textSecondary}
                              keyboardType="numeric"
                              value={nuevoPorcentajeBarbero}
                              onChangeText={setNuevoPorcentajeBarbero}
                            />

                            <View style={{ flexDirection: "row", gap: 10 }}>
                              <TouchableOpacity
                                style={[
                                  styles.btnGoldAction,
                                  { backgroundColor: colors.primary, flex: 1 },
                                ]}
                                onPress={guardarIntegrante}
                              >
                                <Text style={styles.btnGoldText}>
                                  {integranteEnEdicion
                                    ? "GUARDAR CAMBIOS"
                                    : "REGISTRAR INTEGRANTE"}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.btnGoldAction,
                                  { backgroundColor: "#333", flex: 1 },
                                ]}
                                onPress={cancelarEdicionIntegrante}
                              >
                                <Text
                                  style={[
                                    styles.btnGoldText,
                                    { color: "#FFF" },
                                  ]}
                                >
                                  CANCELAR
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        <Text
                          style={[
                            styles.pasoTag,
                            { color: colors.primary, marginTop: 20 },
                          ]}
                        >
                          INTEGRANTES REGISTRADOS ({barberos.length})
                        </Text>
                        {barberos.map((b) => (
                          <View
                            key={b.id}
                            style={[
                              styles.cardServicioRealizado,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <FotoBarbero
                                nombre={b.nombre}
                                foto={b.foto}
                                color={colors.primary}
                                editable
                                onCambiar={(uri) =>
                                  guardarFotoBarbero(b.id, uri)
                                }
                              />
                              <Text
                                style={[
                                  styles.titleCard,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {b.nombre} {b.esAdmin && "👑 (Admin)"}
                              </Text>
                              <Text
                                style={[
                                  styles.subCard,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {b.especialidad} · Comisión:{" "}
                                {b.porcentajeGanancia}%
                              </Text>
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: colors.textSecondary,
                                  marginTop: 2,
                                }}
                              >
                                Usuario: {b.usuario}
                              </Text>
                            </View>

                            <View style={{ flexDirection: "row", gap: 12 }}>
                              <TouchableOpacity
                                onPress={() => iniciarEdicionIntegrante(b)}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={20}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                              {!b.esAdmin && (
                                <TouchableOpacity
                                  onPress={() =>
                                    eliminarBarberoDelEquipo(
                                      b.id,
                                      b.nombre,
                                      b.esAdmin,
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color="#EF4444"
                                  />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ))}
                      </>
                    )}

                    {subNegocio === "SERVICIOS" && (
                      <>
                        {/* ACORDEÓN FORMULARIO SERVICIO */}
                        <TouchableOpacity
                          style={[
                            styles.headerAcordeonForm,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                              marginTop: 20,
                            },
                          ]}
                          onPress={() =>
                            setMostrarFormServicio(!mostrarFormServicio)
                          }
                        >
                          <Text
                            style={[
                              styles.titleAcordeon,
                              { color: colors.primary },
                            ]}
                          >
                            {servicioEnEdicion
                              ? "✏️ EDITANDO SERVICIO"
                              : "➕ AGREGAR NUEVO SERVICIO"}
                          </Text>
                          <Ionicons
                            name={
                              mostrarFormServicio
                                ? "chevron-up"
                                : "chevron-down"
                            }
                            size={20}
                            color={colors.primary}
                          />
                        </TouchableOpacity>

                        {mostrarFormServicio && (
                          <View
                            style={[
                              styles.bodyAcordeonForm,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                            ]}
                          >
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Nombre del Servicio"
                              placeholderTextColor={colors.textSecondary}
                              value={nombreServicio}
                              onChangeText={setNombreServicio}
                            />
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Precio en $ (Ej: 35000)"
                              placeholderTextColor={colors.textSecondary}
                              keyboardType="numeric"
                              value={precioServicio}
                              onChangeText={setPrecioServicio}
                            />
                            <TextInput
                              style={[
                                styles.inputDark,
                                {
                                  backgroundColor: colors.inputBg,
                                  borderColor: colors.cardBorder,
                                  color: colors.textPrimary,
                                },
                              ]}
                              placeholder="Duración estimada (Ej: 45 min)"
                              placeholderTextColor={colors.textSecondary}
                              value={duracionServicio}
                              onChangeText={setDuracionServicio}
                            />

                            <View style={{ flexDirection: "row", gap: 10 }}>
                              <TouchableOpacity
                                style={[
                                  styles.btnGoldAction,
                                  { backgroundColor: colors.primary, flex: 1 },
                                ]}
                                onPress={guardarServicioEmpresa}
                              >
                                <Text style={styles.btnGoldText}>
                                  {servicioEnEdicion
                                    ? "GUARDAR CAMBIOS"
                                    : "AGREGAR SERVICIO"}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.btnGoldAction,
                                  { backgroundColor: "#333", flex: 1 },
                                ]}
                                onPress={cancelarEdicionServicio}
                              >
                                <Text
                                  style={[
                                    styles.btnGoldText,
                                    { color: "#FFF" },
                                  ]}
                                >
                                  CANCELAR
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        <Text
                          style={[
                            styles.pasoTag,
                            { color: colors.primary, marginTop: 20 },
                          ]}
                        >
                          SERVICIOS ACTIVOS ({serviciosEmpresa.length})
                        </Text>
                        {serviciosEmpresa.map((s) => (
                          <View
                            key={s.id}
                            style={[
                              styles.cardServicioRealizado,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.titleCard,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {s.nombre}
                              </Text>
                              <Text
                                style={[
                                  styles.subCard,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {s.duracion} · $
                                {s.precio.toLocaleString("es-CO")}
                              </Text>
                            </View>

                            <View style={{ flexDirection: "row", gap: 12 }}>
                              <TouchableOpacity
                                onPress={() => iniciarEdicionServicio(s)}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={20}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() =>
                                  eliminarServicioEmpresa(s.id, s.nombre)
                                }
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={20}
                                  color="#EF4444"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}

                {/* TAB 5: MÓDULO DE GANANCIAS */}
                {menuBarbero === "CARTERA" && profesionalActivoEnPanel && (
                  <CarteraPanel
                    colors={colors}
                    nombre={profesionalActivoEnPanel.nombre}
                    porcentaje={profesionalActivoEnPanel.porcentajeGanancia}
                    citas={citas.filter(
                      (c) =>
                        c.barberoId === profesionalActivoEnPanel.id &&
                        c.empresaId === empresaActiva.id,
                    )}
                  />
                )}

                {/* TAB 7: PRODUCTOS (SOLO ADMINISTRADOR), MISMA ESTRUCTURA QUE EQUIPO Y SERVICIOS */}
                {menuBarbero === "NEGOCIO" &&
                  subNegocio === "PRODUCTOS" &&
                  barberoLogueado.esAdmin &&
                  empresaActiva && (
                    <View>
                      {/* ACORDEÓN FORMULARIO PRODUCTO */}
                      <TouchableOpacity
                        style={[
                          styles.headerAcordeonForm,
                          {
                            backgroundColor: colors.cardBg,
                            borderColor: colors.cardBorder,
                            marginTop: 15,
                          },
                        ]}
                        onPress={() =>
                          setMostrarFormProducto(!mostrarFormProducto)
                        }
                      >
                        <Text
                          style={[
                            styles.titleAcordeon,
                            { color: colors.primary },
                          ]}
                        >
                          {productoEnEdicion
                            ? "✏️ EDITANDO PRODUCTO"
                            : "➕ AGREGAR NUEVO PRODUCTO"}
                        </Text>
                        <Ionicons
                          name={
                            mostrarFormProducto ? "chevron-up" : "chevron-down"
                          }
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>

                      {mostrarFormProducto && (
                        <View
                          style={[
                            styles.bodyAcordeonForm,
                            {
                              backgroundColor: colors.cardBg,
                              borderColor: colors.cardBorder,
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={elegirFotoProducto}
                            style={{
                              height: 120,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderStyle: "dashed",
                              borderColor: colors.cardBorder,
                              alignItems: "center",
                              justifyContent: "center",
                              marginBottom: 10,
                              overflow: "hidden",
                            }}
                          >
                            {fotoProducto ? (
                              <Image
                                source={{ uri: fotoProducto }}
                                style={{ width: "100%", height: "100%" }}
                              />
                            ) : (
                              <>
                                <Ionicons
                                  name="camera"
                                  size={28}
                                  color={colors.textSecondary}
                                />
                                <Text
                                  style={{
                                    color: colors.textSecondary,
                                    marginTop: 4,
                                  }}
                                >
                                  Agregar foto
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>

                          <TextInput
                            style={[
                              styles.inputDark,
                              {
                                backgroundColor: colors.inputBg,
                                borderColor: colors.cardBorder,
                                color: colors.textPrimary,
                              },
                            ]}
                            placeholder="Nombre del Producto"
                            placeholderTextColor={colors.textSecondary}
                            value={nombreProducto}
                            onChangeText={setNombreProducto}
                          />
                          <TextInput
                            style={[
                              styles.inputDark,
                              {
                                backgroundColor: colors.inputBg,
                                borderColor: colors.cardBorder,
                                color: colors.textPrimary,
                              },
                            ]}
                            placeholder="Precio en $ (Ej: 25000)"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={precioProducto}
                            onChangeText={setPrecioProducto}
                          />

                          <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                              style={[
                                styles.btnGoldAction,
                                { backgroundColor: colors.primary, flex: 1 },
                              ]}
                              onPress={guardarProducto}
                            >
                              <Text style={styles.btnGoldText}>
                                {productoEnEdicion
                                  ? "GUARDAR CAMBIOS"
                                  : "AGREGAR PRODUCTO"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.btnGoldAction,
                                { backgroundColor: "#333", flex: 1 },
                              ]}
                              onPress={cancelarEdicionProducto}
                            >
                              <Text
                                style={[styles.btnGoldText, { color: "#FFF" }]}
                              >
                                CANCELAR
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      <Text
                        style={[
                          styles.pasoTag,
                          { color: colors.primary, marginTop: 20 },
                        ]}
                      >
                        PRODUCTOS ACTIVOS (
                        {
                          productos.filter(
                            (p) => p.empresaId === empresaActiva.id,
                          ).length
                        }
                        )
                      </Text>

                      {productos
                        .filter((p) => p.empresaId === empresaActiva.id)
                        .map((p) => (
                          <View
                            key={p.id}
                            style={[
                              styles.cardServicioRealizado,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                            ]}
                          >
                            {p.foto ? (
                              <Image
                                source={{ uri: p.foto }}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 6,
                                  marginRight: 12,
                                }}
                              />
                            ) : (
                              <View
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 6,
                                  marginRight: 12,
                                  backgroundColor: colors.inputBg,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons
                                  name="cube-outline"
                                  size={22}
                                  color={colors.textSecondary}
                                />
                              </View>
                            )}

                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.titleCard,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                {p.nombre}
                              </Text>
                              <Text
                                style={[
                                  styles.subCard,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                ${p.precio.toLocaleString("es-CO")}
                              </Text>
                            </View>

                            <View style={{ flexDirection: "row", gap: 12 }}>
                              <TouchableOpacity
                                onPress={() => iniciarEdicionProducto(p)}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={20}
                                  color={colors.primary}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => eliminarProducto(p)}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={20}
                                  color="#EF4444"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                    </View>
                  )}

                {/* TAB 6: LISTA NEGRA CON BÚSQUEDA INTERACTIVA Y CAMPOS DE UNIFICADOS */}
                {menuBarbero === "CLIENTES" &&
                  subClientes === "LISTA_NEGRA" &&
                  barberoLogueado.esAdmin && (
                    <View>
                      <Text style={[styles.pasoTag, { color: colors.primary }]}>
                        LISTA NEGRA (BLOQUEAR CLIENTES)
                      </Text>

                      <TextInput
                        style={[
                          styles.inputDark,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.cardBorder,
                            color: colors.textPrimary,
                          },
                        ]}
                        placeholder={
                          inputTelListaNegra.trim()
                            ? "⚠️ Número no registrado como cliente"
                            : "El nombre aparece al escribir el teléfono"
                        }
                        placeholderTextColor={colors.textSecondary}
                        value={
                          clienteEncontradoLN ? clienteEncontradoLN.nombre : ""
                        }
                        editable={false}
                      />

                      <TextInput
                        style={[
                          styles.inputDark,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.cardBorder,
                            color: colors.textPrimary,
                          },
                        ]}
                        placeholder="Teléfono del Cliente"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="phone-pad"
                        value={inputTelListaNegra}
                        onChangeText={setInputTelListaNegra}
                      />

                      <TouchableOpacity
                        style={[
                          styles.btnGoldAction,
                          { backgroundColor: "#7F1D1D" },
                        ]}
                        onPress={agregarAListaNegra}
                      >
                        <Text style={[styles.btnGoldText, { color: "#FFF" }]}>
                          AGREGAR A LISTA NEGRA
                        </Text>
                      </TouchableOpacity>

                      {/* BUSCADOR INTERACTIVO LETRA POR LETRA */}
                      <Text
                        style={[
                          styles.pasoTag,
                          { color: colors.primary, marginTop: 25 },
                        ]}
                      >
                        CLIENTES RESTRINGIDOS ({listaNegraFiltrada.length})
                      </Text>

                      <TextInput
                        style={[
                          styles.inputDark,
                          {
                            backgroundColor: colors.inputBg,
                            borderColor: colors.primary,
                            color: colors.textPrimary,
                            marginBottom: 15,
                          },
                        ]}
                        placeholder="🔍 Buscar bloqueado por nombre o teléfono..."
                        placeholderTextColor={colors.textSecondary}
                        value={busquedaBloqueados}
                        onChangeText={setBusquedaBloqueados}
                      />

                      {listaNegraFiltrada.length === 0 ? (
                        <Text style={styles.infoText}>
                          No hay coincidencias en la lista negra.
                        </Text>
                      ) : (
                        listaNegraFiltrada.map((item) => (
                          <View
                            key={item.id}
                            style={[
                              styles.cardServicioRealizado,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.titleCard,
                                  { color: colors.textPrimary },
                                ]}
                              >
                                🚫 {item.nombre}
                              </Text>
                              <Text
                                style={[
                                  styles.subCard,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                📞 Teléfono: {item.telefono}
                              </Text>
                            </View>

                            <TouchableOpacity
                              onPress={() => eliminarDeListaNegra(item.id)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color="#EF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  )}
              </View>
            )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmacionCita
        visible={citaConfirmada !== null}
        datos={citaConfirmada}
        colors={colors}
        onCerrar={() => setCitaConfirmada(null)}
      />

      {/* MODAL DE NOTIFICACIONES */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalNotifVisible}
        onRequestClose={() => setModalNotifVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCardContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons
                  name="notifications"
                  size={18}
                  color={colors.primary}
                />
                <Text
                  style={[styles.modalTitleText, { color: colors.textPrimary }]}
                >
                  Notificaciones
                </Text>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                {notificacionesCliente.length > 0 && (
                  <TouchableOpacity onPress={borrarTodasNotificaciones}>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#EF4444",
                        fontWeight: "bold",
                      }}
                    >
                      Limpiar todas
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setModalNotifVisible(false)}>
                  <Ionicons
                    name="close"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
              {notificacionesCliente.length === 0 ? (
                <Text
                  style={[
                    styles.subCard,
                    {
                      color: colors.textSecondary,
                      textAlign: "center",
                      paddingVertical: 20,
                    },
                  ]}
                >
                  No tienes notificaciones por revisar.
                </Text>
              ) : (
                notificacionesCliente.map((n) => (
                  <View
                    key={n.id}
                    style={[
                      styles.cardNotifItem,
                      { backgroundColor: colors.headerBg },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Text
                        style={[
                          styles.titleCard,
                          { color: colors.primary, fontSize: 13, flex: 1 },
                        ]}
                      >
                        {n.titulo}
                      </Text>
                      <TouchableOpacity
                        onPress={() => eliminarUnaNotificacion(n.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text
                      style={[
                        styles.subCard,
                        { color: colors.textPrimary, marginTop: 4 },
                      ]}
                    >
                      {n.mensaje}
                    </Text>
                    <Text
                      style={[
                        styles.subCard,
                        {
                          color: colors.textSecondary,
                          fontSize: 10,
                          textAlign: "right",
                          marginTop: 4,
                        },
                      ]}
                    >
                      {n.fecha}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BARRA INFERIOR DE NAVEGACIÓN */}
      {pantallaActual === "PANEL_BARBERO" && (
        <View
          style={[
            styles.bottomTabBar,
            {
              backgroundColor: colors.bottomBarBg,
              borderTopColor: colors.cardBorder,
            },
          ]}
        >
          {(
            [
              {
                id: "AGENDAMIENTOS",
                icono: "list",
                label: "Agenda",
                admin: false,
              },
              {
                id: "BLOQUEOS",
                icono: "calendar-outline",
                label: "Bloqueos",
                admin: true,
              },
              {
                id: "CLIENTES",
                icono: "person-add-outline",
                label: "Clientes",
                admin: false,
              },
              {
                id: "CARTERA",
                icono: "wallet-outline",
                label: "Cartera",
                admin: false,
              },
              {
                id: "NEGOCIO",
                icono: "storefront-outline",
                label: "Negocio",
                admin: true,
              },
            ] as const
          )
            .filter((t) => !t.admin || barberoLogueado?.esAdmin)
            .map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.tabItem}
                onPress={() => setMenuBarbero(t.id)}
              >
                <Ionicons
                  name={t.icono}
                  size={18}
                  color={
                    menuBarbero === t.id ? colors.primary : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: colors.textSecondary },
                    menuBarbero === t.id && { color: colors.primary },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerAppTitle: { fontSize: 16, fontWeight: "bold", letterSpacing: 1 },
  btnTema: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    position: "relative",
  },
  badgeNotifDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  cardNotifItem: { padding: 10, borderRadius: 6, marginBottom: 8 },
  btnSoloFlechaBack: { paddingRight: 10, paddingVertical: 4 },
  btnVolverAcceso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  btnVolverAccesoText: { fontSize: 12, fontWeight: "bold" },
  boxBienvenida: { marginTop: 40 },
  bienvenidaTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  bienvenidaSub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 30,
  },
  cardRolOpcion: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
  },
  pasoTag: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 1,
  },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardDark: { width: "48%", padding: 12, borderRadius: 8, borderWidth: 1 },
  titleCard: { fontSize: 14, fontWeight: "bold" },
  subCard: { fontSize: 12, marginTop: 4 },
  teamTag: { color: "#737373", fontSize: 10, fontWeight: "bold", marginTop: 8 },
  precioCard: { fontSize: 12, fontWeight: "bold", marginTop: 6 },
  dayCard: {
    width: 60,
    height: 75,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  dayName: { color: "#737373", fontSize: 10, fontWeight: "bold" },
  dayNum: { fontSize: 20, fontWeight: "bold", marginVertical: 2 },
  infoText: { color: "#EF4444", fontSize: 13, marginVertical: 10 },
  inputDark: { padding: 14, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  boxHabeasData: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  textHabeasData: { flex: 1, fontSize: 11, lineHeight: 14 },
  btnGoldAction: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  btnGoldText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  rowBox: { flexDirection: "row", gap: 10, marginTop: 10 },
  cardCita: { padding: 14, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  cardServicioRealizado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeState: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  horaBadge: { fontSize: 13, fontWeight: "bold" },
  btnState: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnStateText: { color: "#FFF", fontWeight: "bold", fontSize: 12 },
  profileBadge: { padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 10 },
  profileName: { fontSize: 16, fontWeight: "bold" },
  profileRole: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
  bottomTabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: 10,
    justifyContent: "space-around",
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 10, marginTop: 3, fontWeight: "600" },
  btnSegment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnSegmentText: { fontSize: 10, fontWeight: "bold" },
  btnOrdenPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  textOrdenPill: { fontSize: 11, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCardContainer: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    elevation: 10,
    boxShadow: "0px 4px 5px rgba(0, 0, 0, 0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
    paddingBottom: 10,
  },
  modalTitleText: { fontSize: 15, fontWeight: "bold" },
  headerAcordeonForm: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  titleAcordeon: { fontSize: 12, fontWeight: "bold", letterSpacing: 0.5 },
  bodyAcordeonForm: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderTopWidth: 0,
    marginTop: -2,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});
