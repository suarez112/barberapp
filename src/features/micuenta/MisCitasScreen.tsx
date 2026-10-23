import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import Insignia from "@/components/ui/Insignia";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { obtenerPerfilPublico } from "@/features/negocio/api";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { EstadoCita } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { fechaHoraCita, fechaLarga, hoyColombiaISO } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import ReprogramarCitaModal from "./components/ReprogramarCitaModal";
import { useAvisarError } from "../sesion/useAvisarError";
import { cancelarMiCita, CitaCliente, listarMisCitas } from "./api";
import { useClienteConSesion } from "./useClienteConSesion";

const ESTADOS: Record<EstadoCita, { texto: string; color: string }> = {
  CONFIRMADA: { texto: "CONFIRMADA", color: COLORES.azul },
  COMPLETADA: { texto: "COMPLETADA", color: COLORES.verde },
  CANCELADA: { texto: "CANCELADA", color: COLORES.rojo },
};

// 3 -> "3 horas", 1 -> "1 hora"
const textoHoras = (h: number) => (h === 1 ? "1 hora" : `${h} horas`);

// Citas que el cliente reservó con su cuenta (las de invitado no aparecen)
export default function MisCitasScreen() {
  const { colors } = useAppTheme();
  const sesion = useClienteConSesion();

  if (sesion.estado === "cargando") {
    return (
      <Pantalla>
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      </Pantalla>
    );
  }
  if (sesion.estado === "sin-sesion") return <Redirect href="/cliente" />;
  if (sesion.estado === "otra-cuenta") return <Redirect href="/admin" />;
  return <MisCitas key={sesion.token} token={sesion.token} />;
}

function MisCitas({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const { back, canGoBack, replace } = useRouter();
  const avisarError = useAvisarError();
  // Cita abierta desde una notificación: se muestra resaltada
  const { citaId } = useLocalSearchParams<{ citaId?: string }>();
  const senal = useSenalDeSalida();
  const [citas, setCitas] = useState<CitaCliente[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  // Cita que se está reprogramando (abre el modal)
  const [reprogramando, setReprogramando] = useState<CitaCliente | null>(null);
  // WhatsApp de cada negocio por código (null = no lo configuró), solo de citas fuera de plazo
  const [whatsapps, setWhatsapps] = useState<Record<string, string | null>>({});

  const cargar = useCallback(() => {
    setErrorCarga(null);
    listarMisCitas(token, senal())
      .then(setCitas)
      .catch((e) => {
        if (esCancelada(e)) return;
        avisarError(e, { titulo: "No se pudieron cargar tus citas" });
        setErrorCarga("No se pudieron cargar tus citas.");
      });
    // avisarError cambia en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, senal]);

  useFocusEffect(cargar);

  // Citas pendientes que ya no se pueden cambiar desde la app (pasó el límite del negocio)
  const fueraDePlazo = (c: CitaCliente) =>
    c.estado === "CONFIRMADA" && !c.puedeCancelar && fechaHoraCita(c.fecha, c.hora) > new Date();

  useEffect(() => {
    const pendientes = [
      ...new Set((citas ?? []).filter(fueraDePlazo).map((c) => c.codigoAcceso)),
    ].filter((codigo) => !(codigo in whatsapps));
    for (const codigo of pendientes) {
      obtenerPerfilPublico(codigo)
        .then((p) => setWhatsapps((w) => ({ ...w, [codigo]: p.whatsappUrl })))
        // Sin perfil solo falta el botón de WhatsApp: el aviso se muestra igual
        .catch(() => setWhatsapps((w) => ({ ...w, [codigo]: null })));
    }
    // fueraDePlazo solo depende de citas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citas]);

  const abrirWhatsApp = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      avisar("No se pudo abrir WhatsApp", "Verifica que esté instalado.", "error");
    }
  };

  const cancelar = async (c: CitaCliente) => {
    if (cancelando) return;
    const seguir = await confirmar({
      titulo: "¿Cancelar la cita?",
      mensaje: `${c.servicio} en ${c.negocio}
${fechaLarga(c.fecha)} · ${c.hora}`,
      textoAceptar: "Sí, cancelar",
      textoCancelar: "No",
      destructivo: true,
    });
    if (!seguir) return;
    setCancelando(c.id);
    try {
      await cancelarMiCita(token, c.id);
      setCitas((lista) =>
        lista ? lista.map((x) => (x.id === c.id ? { ...x, estado: "CANCELADA" } : x)) : lista,
      );
      avisar("Cita cancelada", "Avisamos al negocio que ya no vas a asistir.", "exito");
    } catch (e) {
      avisarError(e, {
        titulo: "No se pudo cancelar la cita",
        tituloConflicto: "No se pudo cancelar",
      });
      // Puede que la cita ya haya cambiado (la atendieron o ya empezó): se vuelve a cargar
      cargar();
    } finally {
      setCancelando(null);
    }
  };

  const volver = () => {
    if (canGoBack()) back();
    else replace("/mis-negocios");
  };

  // Próximas: confirmadas de hoy en adelante, de la más cercana a la más lejana
  const hoy = hoyColombiaISO();
  const proximas = (citas ?? [])
    .filter((c) => c.estado === "CONFIRMADA" && c.fecha >= hoy)
    .reverse();
  const anteriores = (citas ?? []).filter((c) => !proximas.includes(c));

  const tarjeta = (c: CitaCliente) => (
    <View
      key={c.id}
      style={[
        styles.tarjeta,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        c.id === citaId && { borderColor: colors.primaryText, borderWidth: 2 },
      ]}
    >
      <View style={styles.encabezado}>
        <Text style={[styles.negocio, { color: colors.textPrimary }]}>{c.negocio}</Text>
        <Insignia texto={ESTADOS[c.estado].texto} color={ESTADOS[c.estado].color} />
      </View>
      <Text style={[styles.detalle, { color: colors.primaryText }]}>
        {fechaLarga(c.fecha)} · {c.hora}
      </Text>
      <Text style={[styles.detalle, { color: colors.textSecondary }]}>
        {c.servicio} con {c.barberoNombre} · {c.duracionMin} min · ${formatearPesos(c.precio)}
      </Text>
      {c.estado === "CONFIRMADA" && fechaHoraCita(c.fecha, c.hora) > new Date() ? (
        c.puedeCancelar ? (
          <View style={styles.acciones}>
            <Boton
              titulo="REPROGRAMAR"
              ayuda="Elige otro día y otra hora para esta cita"
              variante="secundario"
              deshabilitado={!c.puedeReprogramar || cancelando !== null}
              onPress={() => setReprogramando(c)}
              style={styles.accion}
            />
            <Boton
              titulo={cancelando === c.id ? "CANCELANDO…" : "CANCELAR"}
              ayuda="Cancela esta cita después de pedirte confirmación"
              variante="peligro"
              deshabilitado={cancelando !== null}
              onPress={() => cancelar(c)}
              style={styles.accion}
            />
          </View>
        ) : (
          <View>
            <View style={styles.acciones}>
              <Boton
                titulo="REPROGRAMAR"
                ayuda="No disponible: la cita empieza muy pronto"
                variante="secundario"
                deshabilitado
                onPress={() => {}}
                style={styles.accion}
              />
              <Boton
                titulo="CANCELAR"
                ayuda="No disponible: la cita empieza muy pronto"
                variante="peligro"
                deshabilitado
                onPress={() => {}}
                style={styles.accion}
              />
            </View>
            <Text style={[styles.aviso, { color: colors.avisoTexto }]}>
              Faltan menos de {textoHoras(c.anticipacionCancelacionHoras)}: contacta directamente al
              negocio
            </Text>
            {whatsapps[c.codigoAcceso] ? (
              <Boton
                titulo="ESCRIBIR POR WHATSAPP"
                ayuda="Abre WhatsApp para hablar con el negocio"
                variante="secundario"
                onPress={() => abrirWhatsApp(whatsapps[c.codigoAcceso] as string)}
                style={styles.cancelar}
              />
            ) : null}
          </View>
        )
      ) : null}
    </View>
  );

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
      {reprogramando ? (
        <ReprogramarCitaModal
          cita={reprogramando}
          token={token}
          onCerrar={() => setReprogramando(null)}
          onReprogramada={() => {
            setReprogramando(null);
            cargar();
          }}
        />
      ) : null}
      <View style={styles.contenedor}>
        <Text style={[styles.titulo, { color: colors.primaryText }]}>MIS CITAS</Text>
        {citas === null ? (
          errorCarga ? (
            <View>
              <TextoInfo>{errorCarga}</TextoInfo>
              <Boton
                titulo="REINTENTAR"
                ayuda="Vuelve a cargar tus citas"
                variante="secundario"
                onPress={cargar}
              />
            </View>
          ) : (
            <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
          )
        ) : citas.length === 0 ? (
          <Text style={[styles.vacio, { color: colors.textSecondary }]}>
            Aún no tienes citas. Las que reserves con tu sesión iniciada aparecerán aquí.
          </Text>
        ) : (
          <>
            <TituloSeccion>PRÓXIMAS</TituloSeccion>
            {proximas.length ? (
              proximas.map(tarjeta)
            ) : (
              <Text style={[styles.vacio, { color: colors.textSecondary }]}>
                No tienes citas próximas.
              </Text>
            )}
            {anteriores.length ? (
              <>
                <TituloSeccion>ANTERIORES</TituloSeccion>
                {anteriores.map(tarjeta)}
              </>
            ) : null}
          </>
        )}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  cargando: { marginTop: 30 },
  titulo: { fontSize: 18, fontWeight: "bold", letterSpacing: 1, marginBottom: 6 },
  vacio: { fontSize: 13, lineHeight: 19 },
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10, gap: 4 },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  negocio: { fontSize: 15, fontWeight: "bold", flex: 1 },
  detalle: { fontSize: 12 },
  cancelar: { marginTop: 8 },
  acciones: { flexDirection: "row", gap: 8, marginTop: 8 },
  accion: { flex: 1 },
  aviso: { fontSize: 12, fontWeight: "600", marginTop: 8 },
});
