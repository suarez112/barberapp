import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Boton from "@/components/ui/Boton";
import BotonIcono from "@/components/ui/BotonIcono";
import SelectorDias from "@/components/ui/SelectorDias";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { consultarDisponibilidad, HoraDisponible } from "@/features/agenda/api";
import { validarCodigoEmpresa } from "@/features/negocio/api";
import { useAvisarError } from "@/features/sesion/useAvisarError";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Dia } from "@/types";
import { avisar } from "@/utils/dialogos";
import { crearDia, DIAS_MAXIMOS_RESERVA, fechaLarga, hoyColombiaISO, sumarDias } from "@/utils/fechas";
import SelectorHoras from "../../reservas/components/SelectorHoras";
import { CitaCliente, reprogramarMiCita } from "../api";

type Props = {
  cita: CitaCliente;
  token: string;
  onCerrar: () => void;
  // La cita ya cambió en el backend
  onReprogramada: () => void;
};

type Horas = { clave: string; horas: HoraDisponible[]; error: string | null };

// El cliente elige otro día y hora para su cita. El servicio y el profesional no cambian.
// La cita no trae el id del servicio: se busca por nombre en el negocio.
export default function ReprogramarCitaModal({ cita, token, onCerrar, onReprogramada }: Props) {
  const { colors } = useAppTheme();
  const avisarError = useAvisarError();
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [errorServicio, setErrorServicio] = useState<string | null>(null);
  const [dia, setDia] = useState<Dia>(() => crearDia(hoyColombiaISO()));
  const [hora, setHora] = useState("");
  const [resultado, setResultado] = useState<Horas | null>(null);
  const [intento, setIntento] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const primerDia = hoyColombiaISO();
  const ultimoDia = sumarDias(primerDia, DIAS_MAXIMOS_RESERVA);

  useEffect(() => {
    const control = { vigente: true };
    validarCodigoEmpresa(cita.codigoAcceso)
      .then(({ servicios }) => {
        if (!control.vigente) return;
        const parecidos = servicios.filter((s) => s.nombre === cita.servicio);
        const servicio = parecidos.find((s) => s.duracionMin === cita.duracionMin) ?? parecidos[0];
        if (servicio) setServicioId(servicio.id);
        else
          setErrorServicio(
            "El servicio de esta cita ya no está disponible. Comunícate con el negocio.",
          );
      })
      .catch((error) => {
        if (!control.vigente) return;
        registrarCausa("Servicio de la cita", error);
        setErrorServicio(
          describirError(error, { titulo: "", porDefecto: "No se pudo cargar el negocio." }).mensaje,
        );
      });
    return () => {
      control.vigente = false;
    };
  }, [cita.codigoAcceso, cita.servicio, cita.duracionMin]);

  const fecha = dia.fechaFull;
  const clave = `${servicioId}|${fecha}|${intento}`;
  useEffect(() => {
    if (!servicioId) return;
    const control = new AbortController();
    consultarDisponibilidad(
      { empresaId: cita.empresaId, barberoId: cita.barberoId, servicioId, fecha },
      control.signal,
    )
      .then((r) => setResultado({ clave, horas: r.horas, error: null }))
      .catch((error) => {
        if (esCancelada(error)) return;
        registrarCausa("Horas disponibles", error);
        setResultado({
          clave,
          horas: [],
          error: describirError(error, {
            titulo: "",
            porDefecto: "No se pudieron cargar las horas.",
          }).mensaje,
        });
      });
    return () => control.abort();
  }, [cita.empresaId, cita.barberoId, servicioId, fecha, clave]);

  const cargandoHoras = !!servicioId && resultado?.clave !== clave;
  const horas = servicioId && !cargandoHoras ? (resultado?.horas ?? []) : [];
  const errorHoras = servicioId && !cargandoHoras ? (resultado?.error ?? null) : null;

  const elegirDia = (d: Dia) => {
    setDia(d);
    setHora("");
  };

  const confirmar = async () => {
    if (enviando || !hora) return;
    setEnviando(true);
    try {
      await reprogramarMiCita(token, cita.id, { fecha, hora });
      avisar(
        "Cita reprogramada",
        `Tu cita quedó para el ${fechaLarga(fecha)} a las ${hora}. Avisamos al negocio.`,
        "exito",
      );
      onReprogramada();
    } catch (error) {
      avisarError(error, {
        titulo: "No se pudo reprogramar la cita",
        tituloConflicto: "No se pudo reprogramar",
      });
      // La hora pudo ocuparse o vencerse el plazo: se vuelven a pedir las horas
      setHora("");
      setIntento((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={[styles.pantalla, { backgroundColor: colors.bg }]}>
        <View style={styles.cabecera}>
          <Text style={[styles.titulo, { color: colors.primaryText }]}>REPROGRAMAR CITA</Text>
          <BotonIcono
            icono="close"
            tamano={26}
            color={colors.textPrimary}
            etiqueta="Cerrar"
            ayuda="Cierra sin cambiar la cita"
            onPress={onCerrar}
          />
        </View>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={[styles.actual, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.negocio, { color: colors.textPrimary }]}>{cita.negocio}</Text>
            <Text style={[styles.detalle, { color: colors.textSecondary }]}>
              {cita.servicio} con {cita.barberoNombre} · {cita.duracionMin} min
            </Text>
            <Text style={[styles.detalle, { color: colors.primaryText }]}>
              Ahora: {fechaLarga(cita.fecha)} · {cita.hora}
            </Text>
          </View>

          {errorServicio ? (
            <TextoInfo>{errorServicio}</TextoInfo>
          ) : !servicioId ? (
            <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
          ) : (
            <>
              <TituloSeccion>NUEVO DÍA</TituloSeccion>
              <SelectorDias
                desde={primerDia}
                hasta={ultimoDia}
                seleccionado={dia}
                onSeleccionar={elegirDia}
              />
              <TituloSeccion>NUEVA HORA ({horas.length} DISPONIBLES)</TituloSeccion>
              {errorHoras ? (
                <View>
                  <TextoInfo>{errorHoras}</TextoInfo>
                  <Boton
                    titulo="REINTENTAR"
                    ayuda="Vuelve a cargar las horas disponibles"
                    variante="secundario"
                    onPress={() => setIntento((n) => n + 1)}
                  />
                </View>
              ) : cargandoHoras ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <SelectorHoras horarios={horas} horaSel={hora} onSeleccionar={setHora} colors={colors} />
              )}
              <Boton
                titulo={enviando ? "REPROGRAMANDO…" : "CONFIRMAR NUEVA HORA"}
                ayuda="Cambia tu cita al día y la hora elegidos"
                deshabilitado={enviando || !hora}
                onPress={confirmar}
                style={styles.confirmar}
              />
            </>
          )}
          <Boton
            titulo="CERRAR"
            ayuda="Cierra sin cambiar la cita"
            variante="secundario"
            onPress={onCerrar}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  titulo: { fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  contenido: { paddingHorizontal: 16, paddingBottom: 30 },
  actual: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 4, marginTop: 6 },
  negocio: { fontSize: 15, fontWeight: "bold" },
  detalle: { fontSize: 12 },
  cargando: { marginTop: 30 },
  confirmar: { marginTop: 14 },
});
