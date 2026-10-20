import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import Insignia from "@/components/ui/Insignia";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { EstadoCita } from "@/types";
import { fechaLarga, hoyColombiaISO } from "@/utils/fechas";
import { formatearPesos } from "@/utils/formato";
import { useAvisarError } from "../sesion/useAvisarError";
import { CitaCliente, listarMisCitas } from "./api";
import { useClienteConSesion } from "./useClienteConSesion";

const ESTADOS: Record<EstadoCita, { texto: string; color: string }> = {
  CONFIRMADA: { texto: "CONFIRMADA", color: COLORES.azul },
  COMPLETADA: { texto: "COMPLETADA", color: COLORES.verde },
  CANCELADA: { texto: "CANCELADA", color: COLORES.rojo },
};

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
    </View>
  );

  return (
    <Pantalla cabecera={{ onVolver: volver }}>
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
});
