import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BotonCabecera from "@/components/layout/BotonCabecera";
import Boton from "@/components/ui/Boton";
import Tocable from "@/components/ui/Tocable";
import { registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { useCuenta } from "../../cuenta/CuentaProvider";
import { useSesion } from "../../sesion/SesionProvider";
import { useNotificaciones } from "../NotificacionesProvider";
import { useAbrirCita, useAbrirPlanes } from "../useAbrirCita";
import { AvisoGuardado, contarNoLeidas, listarAvisos, marcarAvisoLeido, marcarTodasLeidas } from "./api";

const CADA_SEGUNDOS = 30;

// Icono de cada tipo de aviso (los desconocidos usan la campana)
const ICONO_AVISO: Record<string, keyof typeof Ionicons.glyphMap> = {
  cita_nueva: "calendar-outline",
  cita_cancelada: "close-circle-outline",
  cita_cancelada_por_cliente: "close-circle-outline",
  cita_reprogramada: "swap-horizontal-outline",
  recordatorio: "alarm-outline",
  recordatorio_2h: "alarm-outline",
  prueba_resumen: "sparkles-outline",
};

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// Campana de la cabecera: número de avisos sin leer y el panel con la lista.
// Solo aparece con una sesión abierta.
export default function CampanaNotificaciones() {
  const { token: tokenPersonal } = useSesion();
  const { token: tokenCuenta } = useCuenta();
  const token = tokenPersonal || tokenCuenta;
  if (!token) return null;
  return <Campana key={token} token={token} />;
}

function Campana({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const { top } = useSafeAreaInsets();
  const { avisosRecibidos } = useNotificaciones();
  const abrirCita = useAbrirCita();
  const abrirPlanes = useAbrirPlanes();
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos] = useState<AvisoGuardado[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vigente = useRef(true);

  useEffect(() => {
    vigente.current = true;
    return () => {
      vigente.current = false;
    };
  }, []);

  // El número se actualiza en silencio: un fallo aquí no molesta a nadie
  const actualizarNumero = useCallback(() => {
    contarNoLeidas(token)
      .then((r) => vigente.current && setNoLeidas(r.noLeidas))
      .catch((e) => {
        if (!esCancelada(e)) registrarCausa("Número de notificaciones", e);
      });
  }, [token]);

  const cargarLista = useCallback(() => {
    setCargando(true);
    setError(null);
    listarAvisos(token)
      .then((r) => {
        if (!vigente.current) return;
        // La lista conserva los puntos de "sin leer" mientras está abierta; el número se quita
        // y el backend las marca todas como leídas
        setAvisos(r.datos);
        if (r.noLeidas > 0) {
          setNoLeidas(0);
          marcarTodasLeidas(token).catch((e) => {
            if (!esCancelada(e)) registrarCausa("Marcar todas las notificaciones", e);
            actualizarNumero();
          });
        }
      })
      .catch((e) => {
        if (esCancelada(e) || !vigente.current) return;
        registrarCausa("Lista de notificaciones", e);
        setError("No se pudieron cargar tus notificaciones.");
      })
      .finally(() => vigente.current && setCargando(false));
  }, [token, actualizarNumero]);

  // Al abrir la sesión, cada 30 s, al volver a la app y cuando llega un aviso con la app abierta
  useEffect(() => {
    actualizarNumero();
    const reloj = setInterval(actualizarNumero, CADA_SEGUNDOS * 1000);
    const oyente = AppState.addEventListener("change", (estado) => {
      if (estado === "active") actualizarNumero();
    });
    return () => {
      clearInterval(reloj);
      oyente.remove();
    };
  }, [actualizarNumero, avisosRecibidos]);

  const abrir = () => {
    setAbierto(true);
    cargarLista();
  };

  const tocar = (a: AvisoGuardado) => {
    setAbierto(false);
    if (!a.leida) {
      setAvisos((lista) => lista?.map((x) => (x.id === a.id ? { ...x, leida: true } : x)) ?? lista);
      setNoLeidas((n) => Math.max(0, n - 1));
      marcarAvisoLeido(token, a.id).catch((e) => {
        if (!esCancelada(e)) registrarCausa("Marcar notificación", e);
        actualizarNumero();
      });
    }
    // El resumen de la prueba gratuita no trae cita: lleva a Planes
    if (a.tipo === "prueba_resumen") abrirPlanes();
    else if (a.citaId) abrirCita(a.citaId);
  };

  const todoAlDia = !avisos?.some((a) => !a.leida);

  return (
    <>
      <BotonCabecera
        icono={noLeidas > 0 ? "notifications" : "notifications-outline"}
        etiqueta={
          noLeidas > 0 ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones: todo al día"
        }
        ayuda="Abre la lista de tus notificaciones"
        onPress={abrir}
      >
        {noLeidas > 0 ? (
          <View style={styles.numero}>
            <Text style={styles.textoNumero}>{noLeidas > 99 ? "99+" : noLeidas}</Text>
          </View>
        ) : null}
      </BotonCabecera>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar notificaciones"
          accessibilityHint="Vuelve a la pantalla"
          style={styles.fondo}
          onPress={() => setAbierto(false)}
        />
        <View pointerEvents="box-none" style={[styles.zona, { paddingTop: top + 60 }]}>
          <View
            style={[styles.panel, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          >
            <View style={styles.titulo}>
              <Text
                accessibilityRole="header"
                style={[styles.textoTitulo, { color: colors.textPrimary }]}
              >
                Notificaciones
              </Text>
              <Tocable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                accessibilityHint="Cierra la lista de notificaciones"
                style={styles.cerrar}
                onPress={() => setAbierto(false)}
              >
                <Ionicons name="close" size={24} color={colors.primaryText} />
              </Tocable>
            </View>

            {avisos === null && !error ? (
              <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
            ) : avisos === null ? (
              <View style={styles.vacio}>
                <Text style={[styles.detalle, { color: colors.textSecondary }]}>{error}</Text>
                <Boton
                  titulo="REINTENTAR"
                  ayuda="Vuelve a cargar tus notificaciones"
                  variante="secundario"
                  deshabilitado={cargando}
                  onPress={cargarLista}
                />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {todoAlDia ? (
                  <View style={styles.vacio}>
                    <Ionicons name="checkmark-circle-outline" size={36} color={colors.exitoTexto} />
                    <Text style={[styles.alDia, { color: colors.textPrimary }]}>¡Todo al día!</Text>
                    <Text style={[styles.detalle, { color: colors.textSecondary }]}>
                      No tienes notificaciones pendientes
                    </Text>
                  </View>
                ) : null}
                {avisos.map((a) => (
                  <Tocable
                    key={a.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${a.leida ? "" : "Sin leer. "}${a.titulo}. ${a.texto}`}
                    accessibilityHint={
                      a.tipo === "prueba_resumen"
                        ? "Marca como leída y abre los planes"
                        : a.citaId
                          ? "Marca como leída y abre la cita"
                          : "Marca como leída"
                    }
                    style={[styles.aviso, { borderColor: colors.inputBorder }]}
                    onPress={() => tocar(a)}
                  >
                    <View
                      style={[
                        styles.punto,
                        { backgroundColor: a.leida ? "transparent" : COLORES.azul },
                      ]}
                    />
                    <Ionicons
                      name={ICONO_AVISO[a.tipo] ?? "notifications-outline"}
                      size={20}
                      color={colors.primaryText}
                    />
                    <View style={styles.textos}>
                      <Text
                        style={[
                          styles.avisoTitulo,
                          { color: colors.textPrimary },
                          !a.leida && styles.negrita,
                        ]}
                      >
                        {a.titulo}
                      </Text>
                      <Text style={[styles.detalle, { color: colors.textSecondary }]}>{a.texto}</Text>
                      <Text style={[styles.fecha, { color: colors.textSecondary }]}>
                        {fechaCorta(a.creadaEn)}
                      </Text>
                    </View>
                  </Tocable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  numero: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: COLORES.rojo,
    alignItems: "center",
    justifyContent: "center",
  },
  textoNumero: { color: COLORES.blanco, fontSize: 11, fontWeight: "bold" },
  fondo: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  zona: { flex: 1, alignItems: "flex-end", paddingHorizontal: 8 },
  panel: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  titulo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  textoTitulo: { fontSize: 18, fontWeight: "bold" },
  cerrar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  cargando: { marginVertical: 24 },
  vacio: { alignItems: "center", gap: 6, paddingVertical: 20 },
  alDia: { fontSize: 17, fontWeight: "bold" },
  detalle: { fontSize: 13, lineHeight: 18 },
  aviso: { flexDirection: "row", gap: 10, paddingVertical: 12, borderTopWidth: 1, minHeight: 56 },
  punto: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  textos: { flex: 1, gap: 2 },
  avisoTitulo: { fontSize: 14 },
  negrita: { fontWeight: "bold" },
  fecha: { fontSize: 11, marginTop: 2 },
});
