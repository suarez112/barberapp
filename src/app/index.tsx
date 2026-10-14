import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import FotoBarbero from "../components/FotoBarbero";
import { DIAS, EMPRESAS_DB, HORARIOS_BASE } from "../data/datos";
import {
  Barbero,
  BloqueoHorario,
  ClienteRegistrado,
  ElementoListaNegra,
  EmpresaConfig,
  NotificacionCliente,
  Servicio,
} from "../types";

// Fecha de hoy según el celular, en formato 2026-10-11
const AHORA = new Date();
const HOY_STR = `${AHORA.getFullYear()}-${String(AHORA.getMonth() + 1).padStart(2, "0")}-${String(AHORA.getDate()).padStart(2, "0")}`;

// Dice si una hora de HOY ya pasó (para no ofrecerla al cliente)
const horaYaPaso = (fecha: string, hora: string) => {
  if (fecha !== HOY_STR) return false;
  const [h12, resto] = hora.split(":");
  const [min, ampm] = resto.split(" ");
  let h = parseInt(h12) % 12;
  if (ampm === "PM") h += 12;
  const ahora = new Date();
  return h * 60 + parseInt(min) <= ahora.getHours() * 60 + ahora.getMinutes();
};

export default function HomeScreen() {
  const [tema, setTema] = useState<"OSCURO" | "CLARO">("OSCURO");
  const [pantallaActual, setPantallaActual] = useState<
    "SELECCION_ROL" | "CLIENTE" | "LOGIN_BARBERO" | "PANEL_BARBERO"
  >("SELECCION_ROL");

  const [empresaActiva, setEmpresaActiva] = useState<EmpresaConfig | null>(
    null,
  );
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [serviciosEmpresa, setServiciosEmpresa] = useState<Servicio[]>([]);

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
  const [inputNombreListaNegra, setInputNombreListaNegra] = useState("");
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
  const [empleadoSupervisado, setEmpleadoSupervisado] =
    useState<Barbero | null>(null);

  const [menuBarbero, setMenuBarbero] = useState<
    | "AGENDAMIENTOS"
    | "BLOQUEOS"
    | "CLIENTES"
    | "EQUIPO"
    | "CARTERA"
    | "LISTA_NEGRA"
  >("AGENDAMIENTOS");

  // Filtros de Clientes
  const [filtroEstadoCliente, setFiltroEstadoCliente] = useState<
    "TODOS" | "ACTIVOS" | "INACTIVOS"
  >("TODOS");

  const [criterioOrdenCliente, setCriterioOrdenCliente] = useState<
    "DIAS_DESC" | "DIAS_ASC" | "CITAS_DESC" | "CITAS_ASC"
  >("DIAS_DESC");

  // Filtro de periodo de Cartera: DIARIO, SEMANAL, MENSUAL
  const [filtroPeriodoCartera, setFiltroPeriodoCartera] = useState<
    "DIARIO" | "SEMANAL" | "MENSUAL"
  >("DIARIO");

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

  // Estado para el Bloqueador Interactivo Estilo Alarma
  const [diasBloqueoSeleccionados, setDiasBloqueoSeleccionados] = useState<
    string[]
  >([]);
  const [horasBloqueoSeleccionadas, setHorasBloqueoSeleccionadas] = useState<
    string[]
  >([]);
  const [tipoBloqueoRecurrente, setTipoBloqueoRecurrente] =
    useState<boolean>(true);

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
  const [esClienteReconocido, setEsClienteReconocido] = useState(false);
  const [aceptaHabeasData, setAceptaHabeasData] = useState(false);

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
    setCelular(val);
  };

  const validarCodigoBarberia = () => {
    const cod = codigoIngresado.trim().toUpperCase();
    const encontrada = Object.values(EMPRESAS_DB).find(
      (e) => e.codigoAcceso === cod,
    );

    if (encontrada) {
      setEmpresaActiva(encontrada);
      setBarberos(encontrada.barberos);
      setServiciosEmpresa(encontrada.servicios);
      setCodigoIngresado("");
    } else {
      Alert.alert(
        "Código Inválido",
        "El código ingresado no corresponde a ningún establecimiento registrado.",
      );
    }
  };

  const evaluarSiEstaBloqueado = (
    barberoIdTarget: string,
    fechaTarget: string,
    diaSemanaTarget: string,
    horaTarget: string,
  ) => {
    return bloqueos.some((b) => {
      const coincideEmpleado =
        b.barberoId === barberoIdTarget || b.barberoId === "TODOS";
      if (!coincideEmpleado) return false;

      const coincideHora = b.hora === horaTarget || b.hora === "TODO_EL_DIA";
      if (!coincideHora) return false;

      if (b.frecuencia === "PUNTUAL" && b.fechaBase === fechaTarget)
        return true;
      if (
        b.frecuencia === "SEMANAL_RECURRENTE" &&
        b.diasSemana.includes(diaSemanaTarget)
      )
        return true;

      return false;
    });
  };

  const horariosDisponibles = HORARIOS_BASE.filter((h) => {
    if (!barberoSel || !diaSel || !empresaActiva) return true;

    const reservada = citas.some(
      (c) =>
        c.barberoId === barberoSel.id &&
        c.fecha === diaSel.fechaFull &&
        c.hora === h &&
        c.estado !== "CANCELADA",
    );

    const bloqueada = evaluarSiEstaBloqueado(
      barberoSel.id,
      diaSel.fechaFull,
      diaSel.diaNom,
      h,
    );

    return !reservada && !bloqueada && !horaYaPaso(diaSel.fechaFull, h);
  });

  const agendarCita = () => {
    const telLimpio = celular.trim().toLowerCase();
    const nomLimpio = nombre.trim().toLowerCase();

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

    const yaEsCliente = clientesRegistrados.some(
      (c) => c.telefono.trim() === celular.trim(),
    );

    if (!yaEsCliente) {
      setClientesRegistrados([
        ...clientesRegistrados,
        {
          telefono: celular.trim(),
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

    const nuevaCita = {
      id: Date.now().toString(),
      cliente: nombre,
      telefono: celular,
      servicio: servicioSel?.nombre,
      barberoId: barberoSel?.id,
      barberoNombre: barberoSel?.nombre,
      empresaId: empresaActiva?.id,
      fecha: diaSel.fechaFull,
      hora: horaSel,
      precio: servicioSel?.precio,
      estado: "CONFIRMADA",
    };

    setCitas([...citas, nuevaCita]);
    Alert.alert(
      "¡Cita confirmada!",
      `Tu cita con ${barberoSel?.nombre} (${empresaActiva?.nombre}) quedó confirmada para el ${diaSel.fechaFull} a las ${horaSel}.`,
    );

    setBarberoSel(null);
    setServicioSel(null);
    setHoraSel("");
    setNombre("");
    setCelular("");
    setEsClienteReconocido(false);
    setAceptaHabeasData(false);
  };

  const cambiarEstadoCita = (id: string, nuevoEstado: string) => {
    const citaActualizada = citas.find((c) => c.id === id);

    setCitas(
      citas.map((c) =>
        c.id === id
          ? {
              ...c,
              estado: nuevoEstado,
              ...(nuevoEstado === "CANCELADA"
                ? {
                    canceladaEn: new Date().toISOString(),
                    canceladaPor: barberoLogueado?.nombre,
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

      setNotificacionesCliente([msjNotif, ...notificacionesCliente]);
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
          onPress: () => {
            const ahora = new Date().toISOString();
            setCitas((prev) =>
              prev.map((x) =>
                x.id === c.id
                  ? {
                      ...x,
                      estado: "COMPLETADA",
                      completadaEn: ahora,
                      completadaPor: barberoLogueado?.nombre,
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

  const iniciarSesionBarbero = () => {
    let barberoEncontrado: any = null;
    let empresaEncontrada: any = null;

    Object.values(EMPRESAS_DB).forEach((emp: any) => {
      const match = emp.barberos.find(
        (b: any) =>
          b.usuario.toLowerCase() === userInput.trim().toLowerCase() &&
          b.clave === passInput.trim(),
      );
      if (match) {
        barberoEncontrado = match;
        empresaEncontrada = emp;
      }
    });

    if (barberoEncontrado && empresaEncontrada) {
      setEmpresaActiva(empresaEncontrada);
      setBarberos(empresaEncontrada.barberos);
      setServiciosEmpresa(empresaEncontrada.servicios);
      setBarberoLogueado(barberoEncontrado);
      setEmpleadoSupervisado(barberoEncontrado);
      setPantallaActual("PANEL_BARBERO");
      setMenuBarbero("AGENDAMIENTOS");
      setUserInput("");
      setPassInput("");
    } else {
      Alert.alert("Acceso Denegado", "Usuario o contraseña incorrectos.");
    }
  };

  const profesionalActivoEnPanel =
    barberoLogueado?.esAdmin && empleadoSupervisado
      ? empleadoSupervisado
      : barberoLogueado;

  // LÓGICA DEL PANEL DE BLOQUEO ESTILO ALARMA / CALENDARIO
  const alternarDiaSeleccionBloqueo = (diaClave: string) => {
    if (diasBloqueoSeleccionados.includes(diaClave)) {
      setDiasBloqueoSeleccionados(
        diasBloqueoSeleccionados.filter((d) => d !== diaClave),
      );
    } else {
      setDiasBloqueoSeleccionados([...diasBloqueoSeleccionados, diaClave]);
    }
  };

  const alternarHoraSeleccionBloqueo = (horaStr: string) => {
    if (horasBloqueoSeleccionadas.includes(horaStr)) {
      setHorasBloqueoSeleccionadas(
        horasBloqueoSeleccionadas.filter((h) => h !== horaStr),
      );
    } else {
      setHorasBloqueoSeleccionadas([...horasBloqueoSeleccionadas, horaStr]);
    }
  };

  const aplicarBloqueosEstiloAlarma = () => {
    if (!profesionalActivoEnPanel) return;

    if (horasBloqueoSeleccionadas.length === 0) {
      Alert.alert(
        "Selecciona Horas",
        "Por favor selecciona al menos una hora a inhabilitar.",
      );
      return;
    }

    const nuevosBloqueos: BloqueoHorario[] = [];

    // SI HAY DÍAS RECURRENTES SELECCIONADOS
    if (diasBloqueoSeleccionados.length > 0) {
      horasBloqueoSeleccionadas.forEach((horaItem) => {
        nuevosBloqueos.push({
          id: `${Date.now()}_${Math.random()}`,
          barberoId: profesionalActivoEnPanel.id,
          fechaBase: diaSel.fechaFull,
          diasSemana: diasBloqueoSeleccionados,
          hora: horaItem,
          frecuencia: tipoBloqueoRecurrente ? "SEMANAL_RECURRENTE" : "PUNTUAL",
        });
      });
    } else {
      // BLOQUEO PUNTUAL ÚNICAMENTE PARA LA FECHA SELECCIONADA
      horasBloqueoSeleccionadas.forEach((horaItem) => {
        nuevosBloqueos.push({
          id: `${Date.now()}_${Math.random()}`,
          barberoId: profesionalActivoEnPanel.id,
          fechaBase: diaSel.fechaFull,
          diasSemana: [diaSel.diaNom],
          hora: horaItem,
          frecuencia: "PUNTUAL",
        });
      });
    }

    setBloqueos([...bloqueos, ...nuevosBloqueos]);

    Alert.alert(
      "¡Bloqueo Aplicado!",
      `Se han bloqueado las horas seleccionadas para el profesional.`,
    );

    setDiasBloqueoSeleccionados([]);
    setHorasBloqueoSeleccionadas([]);
  };

  const citasDelPanelPorDia =
    profesionalActivoEnPanel && empresaActiva
      ? citas
          .filter(
            (c) =>
              c.barberoId === profesionalActivoEnPanel.id &&
              c.empresaId === empresaActiva.id &&
              c.fecha === diaFiltroCitas.fechaFull,
          )
          .sort(
            (a, b) =>
              HORARIOS_BASE.indexOf(a.hora) - HORARIOS_BASE.indexOf(b.hora),
          )
      : [];

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

  const obtenerCitasFiltradasPorPeriodo = (estadoBuscado: string) => {
    if (!profesionalActivoEnPanel || !empresaActiva) return [];

    return citas.filter((c) => {
      const esDelEmpleado = c.barberoId === profesionalActivoEnPanel.id;
      const esDeEmpresa = c.empresaId === empresaActiva.id;
      const esAceptada = c.estado === estadoBuscado;

      if (!esDelEmpleado || !esDeEmpresa || !esAceptada) return false;

      if (filtroPeriodoCartera === "DIARIO") {
        return c.fecha === diaFiltroCitas.fechaFull;
      }

      if (filtroPeriodoCartera === "SEMANAL") {
        const sel = new Date(2026, 9, diaFiltroCitas.diaNumero);
        const desdeLunes = (sel.getDay() + 6) % 7;
        const inicioSemana = new Date(
          2026,
          9,
          diaFiltroCitas.diaNumero - desdeLunes,
        );
        const finSemana = new Date(
          2026,
          9,
          diaFiltroCitas.diaNumero - desdeLunes + 6,
          23,
          59,
          59,
        );
        const [y, m, d] = c.fecha.split("-").map(Number);
        const fechaCita = new Date(y, m - 1, d);
        return fechaCita >= inicioSemana && fechaCita <= finSemana;
      }

      if (filtroPeriodoCartera === "MENSUAL") {
        return c.fecha.startsWith("2026-10");
      }

      return false;
    });
  };

  const citasFiltradasCartera = obtenerCitasFiltradasPorPeriodo("COMPLETADA");
  const citasProyectadas = obtenerCitasFiltradasPorPeriodo("CONFIRMADA");

  const recaudadoBruto = citasFiltradasCartera.reduce(
    (sum, c) => sum + c.precio,
    0,
  );
  const miPorcentaje = profesionalActivoEnPanel?.porcentajeGanancia ?? 50;
  const miGananciaNeta = (recaudadoBruto * miPorcentaje) / 100;

  const proyeccionBruta = citasProyectadas.reduce(
    (sum, c) => sum + c.precio,
    0,
  );
  const proyeccionGanancia = (proyeccionBruta * miPorcentaje) / 100;

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
            }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : (
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
                    <TouchableOpacity onPress={() => setEmpresaActiva(null)}>
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
                  </View>

                  <View style={styles.grid2}>
                    {(empresaActiva
                      ? EMPRESAS_DB[empresaActiva.id].barberos
                      : barberos
                    ).map((b) => {
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
                          onPress={() => setBarberoSel(b)}
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
                    {(empresaActiva
                      ? EMPRESAS_DB[empresaActiva.id].servicios
                      : serviciosEmpresa
                    ).map((s) => {
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
                          onPress={() => setServicioSel(s)}
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
                            {s.duracion} · ${s.precio.toLocaleString("es-CO")}
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
                    HORA DISPONIBLE ({horariosDisponibles.length} DISPONIBLES)
                  </Text>
                  {!barberoSel ? (
                    <Text style={styles.infoText}>
                      ⚠️ Selecciona primero un Profesional en el Paso 1.
                    </Text>
                  ) : (
                    <View style={styles.grid4}>
                      {horariosDisponibles.map((h) => {
                        const esSel = horaSel === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            style={[
                              styles.timeCard,
                              {
                                backgroundColor: colors.cardBg,
                                borderColor: colors.cardBorder,
                              },
                              esSel && {
                                borderColor: colors.primary,
                                backgroundColor: colors.cardSelectedBg,
                              },
                            ]}
                            onPress={() => setHoraSel(h)}
                          >
                            <Text
                              style={[
                                styles.timeText,
                                { color: colors.textPrimary },
                                esSel && { color: colors.primary },
                              ]}
                            >
                              {h}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <Text style={[styles.pasoTag, { color: colors.primary }]}>
                    PASO 3 · TUS DATOS
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
                    placeholder="Teléfono / Celular"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    value={celular}
                    onChangeText={manejarCambioTelefono}
                  />

                  {esClienteReconocido ? (
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: "#166534",
                        borderRadius: 6,
                        marginBottom: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFF",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      ></Text>
                    </View>
                  ) : (
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
                  )}

                  <TouchableOpacity
                    style={styles.boxHabeasData}
                    onPress={() => setAceptaHabeasData(!aceptaHabeasData)}
                  >
                    <Ionicons
                      name={aceptaHabeasData ? "checkbox" : "square-outline"}
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
                    <Text style={styles.btnGoldText}>CONFIRMAR RESERVA</Text>
                  </TouchableOpacity>
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
                          <Text
                            style={[
                              styles.subCard,
                              { color: colors.textSecondary },
                            ]}
                          >
                            📞 {c.telefono}
                          </Text>
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
                      horarios={HORARIOS_BASE}
                    />
                  )}

                {/* TAB 3: HISTORIAL DE CLIENTES CON OPCIÓN DE BLOQUEO Y DESBLOQUEO DIRECTO */}
                {menuBarbero === "CLIENTES" && (
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

                {/* TAB 4: EQUIPO Y SERVICIOS CON ESPACIADO CORREGIDO */}
                {menuBarbero === "EQUIPO" && barberoLogueado.esAdmin && (
                  <View>
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
                          mostrarFormIntegrante ? "chevron-up" : "chevron-down"
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
                            onCambiar={(uri) => guardarFotoBarbero(b.id, uri)}
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
                            {b.especialidad} · Comisión: {b.porcentajeGanancia}%
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
                          mostrarFormServicio ? "chevron-up" : "chevron-down"
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
                            {s.duracion} · ${s.precio.toLocaleString("es-CO")}
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

                {/* TAB 6: LISTA NEGRA CON BÚSQUEDA INTERACTIVA Y CAMPOS DE UNIFICADOS */}
                {menuBarbero === "LISTA_NEGRA" && barberoLogueado.esAdmin && (
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
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setMenuBarbero("AGENDAMIENTOS")}
          >
            <Ionicons
              name="list"
              size={18}
              color={
                menuBarbero === "AGENDAMIENTOS"
                  ? colors.primary
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabLabel,
                { color: colors.textSecondary },
                menuBarbero === "AGENDAMIENTOS" && { color: colors.primary },
              ]}
            >
              Citas
            </Text>
          </TouchableOpacity>

          {barberoLogueado?.esAdmin && (
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setMenuBarbero("BLOQUEOS")}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={
                  menuBarbero === "BLOQUEOS"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors.textSecondary },
                  menuBarbero === "BLOQUEOS" && { color: colors.primary },
                ]}
              >
                Bloqueos
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setMenuBarbero("CLIENTES")}
          >
            <Ionicons
              name="person-add-outline"
              size={18}
              color={
                menuBarbero === "CLIENTES"
                  ? colors.primary
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabLabel,
                { color: colors.textSecondary },
                menuBarbero === "CLIENTES" && { color: colors.primary },
              ]}
            >
              Clientes
            </Text>
          </TouchableOpacity>

          {barberoLogueado?.esAdmin && (
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setMenuBarbero("EQUIPO")}
            >
              <Ionicons
                name="people-outline"
                size={18}
                color={
                  menuBarbero === "EQUIPO"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors.textSecondary },
                  menuBarbero === "EQUIPO" && { color: colors.primary },
                ]}
              >
                Equipo
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setMenuBarbero("CARTERA")}
          >
            <Ionicons
              name="wallet-outline"
              size={18}
              color={
                menuBarbero === "CARTERA"
                  ? colors.primary
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.tabLabel,
                { color: colors.textSecondary },
                menuBarbero === "CARTERA" && { color: colors.primary },
              ]}
            >
              Cartera
            </Text>
          </TouchableOpacity>

          {barberoLogueado?.esAdmin && (
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setMenuBarbero("LISTA_NEGRA")}
            >
              <Ionicons
                name="ban-outline"
                size={18}
                color={
                  menuBarbero === "LISTA_NEGRA"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors.textSecondary },
                  menuBarbero === "LISTA_NEGRA" && { color: colors.primary },
                ]}
              >
                Bloqueados
              </Text>
            </TouchableOpacity>
          )}
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
  grid4: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeCard: {
    width: "31%",
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  timeText: { fontSize: 12, fontWeight: "bold" },
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
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  metricNum: { fontSize: 20, fontWeight: "bold" },
  metricText: { fontSize: 11, marginTop: 4, textAlign: "center" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
  cardConfigAlarma: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowDiasAlarma: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  circleDiaAlarma: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textDiaAlarma: { fontSize: 11 },
  rowOpcionRepetir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 15,
  },
});
