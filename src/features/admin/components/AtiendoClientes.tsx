import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import FotoBarbero from "@/components/FotoBarbero";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { describirError, registrarCausa } from "@/services/api/errores";
import { ApiError, esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { Barbero } from "@/types";
import { avisar, confirmar } from "@/utils/dialogos";
import { FotoElegida } from "@/utils/imagenes";
import { actualizarProfesional, cambiarYoAtiendo, obtenerYoAtiendo, subirFotoProfesional } from "../../equipo/api";
import { useNegocio } from "../../negocio/NegocioProvider";
import FuncionBloqueada from "../../planes/FuncionBloqueada";
import { useFunciones } from "../../planes/funcionesContexto";
import { useAvisarError } from "../../sesion/useAvisarError";

type Props = {
  token: string;
  // Se activó o desactivó: cambia el cupo del plan, hay que volver a consultarlo
  onEquipoCambiado?: () => void;
};

// 409 del backend cuando el plan no tiene cupo para que la administradora también atienda
const esSinCupo = (e: unknown) => e instanceof ApiError && e.status === 409 && /cupo/i.test(e.message);

// Interruptor "Yo también atiendo clientes" de Mi negocio (solo la cuenta de administración).
// Al activarlo crea su perfil de profesional: aparece al reservar y en el selector de la agenda.
export default function AtiendoClientes({ token, onEquipoCambiado }: Props) {
  const { colors } = useAppTheme();
  const { setBarberos } = useNegocio();
  const { incluida, abrirPlanes } = useFunciones();
  const avisarError = useAvisarError();
  const [atiende, setAtiende] = useState<boolean | null>(null);
  const [perfil, setPerfil] = useState<Barbero | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [comision, setComision] = useState("");
  const [errorComision, setErrorComision] = useState<string | undefined>();
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    obtenerYoAtiendo(token, controlador.signal)
      .then((estado) => {
        setAtiende(estado.atiendeClientes);
        setPerfil(estado.perfil);
        setComision(estado.perfil ? String(estado.perfil.porcentajeGanancia) : "");
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Yo también atiendo", e);
        setErrorCarga(describirError(e, { titulo: "", porDefecto: "No se pudo cargar esta opción." }).mensaje);
      });
    return () => controlador.abort();
  }, [token, intento]);

  // Deja la lista de profesionales (agenda y reservas) con el perfil al día
  const reflejarPerfil = (nuevo: Barbero) =>
    setBarberos((prev) =>
      prev.some((b) => b.id === nuevo.id) ? prev.map((b) => (b.id === nuevo.id ? nuevo : b)) : [...prev, nuevo],
    );

  const cambiar = async (valor: boolean) => {
    if (guardando) return;
    if (!valor) {
      const ok = await confirmar({
        titulo: "Dejar de atender clientes",
        mensaje:
          "Dejarás de aparecer al reservar y de recibir citas nuevas. Tus citas actuales se conservan.",
        destructivo: true,
      });
      if (!ok) return;
    }
    setGuardando(true);
    try {
      const estado = await cambiarYoAtiendo(token, valor);
      setAtiende(estado.atiendeClientes);
      if (estado.perfil) {
        setPerfil(estado.perfil);
        setComision(String(estado.perfil.porcentajeGanancia));
        reflejarPerfil(estado.perfil);
      }
      onEquipoCambiado?.();
      avisar(
        valor ? "¡Listo!" : "Cambio guardado",
        valor ? "Ahora también atiendes clientes." : "Dejaste de recibir reservas nuevas. Tus citas se conservan.",
        "exito",
      );
    } catch (e) {
      if (esSinCupo(e)) {
        onEquipoCambiado?.();
        const ver = await confirmar({
          titulo: "Sin cupo en tu plan",
          mensaje: (e as ApiError).message,
          textoAceptar: "VER PLANES",
          textoCancelar: "CERRAR",
        });
        if (ver) abrirPlanes();
      } else {
        avisarError(e, { titulo: "No se pudo guardar", tituloConflicto: "Sin cupo" });
      }
    } finally {
      setGuardando(false);
    }
  };

  const guardarComision = async () => {
    if (!perfil) return;
    const valor = Number(comision.trim());
    if (!comision.trim() || isNaN(valor) || valor < 0 || valor > 100) {
      setErrorComision("Escribe un número de 0 a 100, por ejemplo 50.");
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await actualizarProfesional(token, perfil.id, { porcentajeGanancia: valor });
      setPerfil(actualizado);
      reflejarPerfil(actualizado);
      avisar("¡Actualizado!", `Tu comisión quedó en ${actualizado.porcentajeGanancia}%.`, "exito");
    } catch (e) {
      avisarError(e, { titulo: "No se pudo guardar la comisión" });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarFoto = async (foto: FotoElegida) => {
    if (!perfil) return;
    try {
      const { foto: url } = await subirFotoProfesional(token, perfil.id, foto);
      const actualizado = { ...perfil, foto: url };
      setPerfil(actualizado);
      reflejarPerfil(actualizado);
    } catch (e) {
      avisarError(e, { titulo: "No se pudo subir la foto" });
    }
  };

  return (
    <View>
      <TituloSeccion>YO TAMBIÉN ATIENDO</TituloSeccion>
      <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        {errorCarga ? (
          <View>
            <Text style={[styles.ayuda, { color: colors.peligroTexto }]}>{errorCarga}</Text>
            <Boton
              titulo="REINTENTAR"
              ayuda="Vuelve a cargar esta opción"
              variante="secundario"
              onPress={() => {
                setErrorCarga(null);
                setIntento((n) => n + 1);
              }}
            />
          </View>
        ) : atiende === null ? (
          <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
        ) : (
          <>
            <View style={styles.fila}>
              <View style={styles.flex}>
                <Text style={[styles.titulo, { color: colors.textPrimary }]}>Yo también atiendo clientes</Text>
                <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
                  {atiende
                    ? "Apareces como profesional al reservar y en la agenda. Ocupas un cupo de tu plan."
                    : "Actívalo para recibir citas tú también. Ocupará un cupo de tu plan."}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Yo también atiendo clientes"
                accessibilityHint="Si está activo, apareces como profesional al reservar y recibes citas"
                value={atiende}
                disabled={guardando}
                onValueChange={cambiar}
                trackColor={{ true: colors.primary, false: colors.cardBorder }}
                thumbColor={COLORES.blanco}
              />
            </View>

            {atiende && perfil ? (
              <View style={[styles.perfil, { borderTopColor: colors.cardBorder }]}>
                <FotoBarbero nombre={perfil.nombre} foto={perfil.foto} color={colors.primaryText} editable onCambiar={cambiarFoto} />
                <Text style={[styles.nombre, { color: colors.textPrimary }]}>{perfil.nombre}</Text>
                <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
                  Toca la foto para cambiarla: es la que ven tus clientes al reservar.
                </Text>
                {incluida("comisiones") ? (
                  <>
                    <CampoTexto
                      etiqueta="Tu comisión (%)"
                      ayuda="Porcentaje de cada servicio que ganas tú, de 0 a 100"
                      placeholder="ej: 50"
                      keyboardType="numeric"
                      maxLength={3}
                      value={comision}
                      error={errorComision}
                      onChangeText={(v) => {
                        setComision(v);
                        setErrorComision(undefined);
                      }}
                    />
                    <Boton
                      titulo="GUARDAR COMISIÓN"
                      ayuda="Guarda el porcentaje que ganas por cada servicio"
                      variante="secundario"
                      deshabilitado={guardando}
                      onPress={guardarComision}
                    />
                  </>
                ) : (
                  <FuncionBloqueada
                    funcion="comisiones"
                    nombre="Comisiones y pago a profesionales"
                    detalle="Mientras tanto tu comisión se queda en el valor inicial (50 %)."
                  />
                )}
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14 },
  cargando: { marginVertical: 10 },
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  flex: { flex: 1 },
  titulo: { fontSize: 15, fontWeight: "bold" },
  ayuda: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  perfil: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, alignItems: "stretch" },
  nombre: { fontSize: 15, fontWeight: "bold", marginTop: 8 },
});
