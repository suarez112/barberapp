import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Pantalla from "@/components/layout/Pantalla";
import Boton from "@/components/ui/Boton";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTexto from "@/components/ui/CampoTexto";
import Insignia from "@/components/ui/Insignia";
import TextoInfo from "@/components/ui/TextoInfo";
import Tocable from "@/components/ui/Tocable";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useSenalDeSalida } from "@/hooks/useSenalDeSalida";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar, confirmar } from "@/utils/dialogos";
import { useNegocio } from "../negocio/NegocioProvider";
import { useSalirDelPanel } from "../panel/useSalirDelPanel";
import { useAvisarError } from "../sesion/useAvisarError";
import {
  NegocioGuardado,
  guardarNegocio,
  listarNegociosGuardados,
  quitarNegocio,
} from "./api";
import { useClienteConSesion } from "./useClienteConSesion";

// Inicio del cliente con cuenta: sus negocios guardados para entrar directo a reservar
export default function MisNegociosScreen() {
  const { colors } = useAppTheme();
  const sesion = useClienteConSesion();

  if (sesion.estado === "cargando") {
    return (
      <Pantalla>
        <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
      </Pantalla>
    );
  }
  // Al cerrar sesión vuelve a las opciones de "Soy cliente"
  if (sesion.estado === "sin-sesion") return <Redirect href="/cliente" />;
  if (sesion.estado === "otra-cuenta") return <Redirect href="/admin" />;
  return (
    <MisNegocios
      key={sesion.token}
      token={sesion.token}
      nombre={sesion.usuario.nombre ?? sesion.usuario.usuario ?? ""}
    />
  );
}

function MisNegocios({ token, nombre }: { token: string; nombre: string }) {
  const { colors } = useAppTheme();
  const { push } = useRouter();
  const { salirDelNegocio } = useNegocio();
  const salir = useSalirDelPanel();
  const avisarError = useAvisarError();
  const senal = useSenalDeSalida();
  const [negocios, setNegocios] = useState<NegocioGuardado[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    setErrorCarga(null);
    listarNegociosGuardados(token, senal())
      .then(setNegocios)
      .catch((e) => {
        if (esCancelada(e)) return;
        avisarError(e, { titulo: "No se pudieron cargar tus negocios" });
        setErrorCarga("No se pudieron cargar tus negocios.");
      });
    // avisarError cambia en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, senal]);

  // Al volver aquí no hay negocio abierto (colores y nombre de la cabecera)
  // y la lista se refresca (ej. un negocio que dejó de recibir reservas)
  useFocusEffect(
    useCallback(() => {
      salirDelNegocio();
      cargar();
      // salirDelNegocio cambia en cada render
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar]),
  );

  const agregar = async () => {
    const limpio = codigo.trim().toUpperCase();
    if (!limpio) {
      setErrorCodigo("Escribe el código que te dio el negocio, por ejemplo CENTRAL10.");
      return;
    }
    if (guardando) return;
    setGuardando(true);
    try {
      const { negocio } = await guardarNegocio(token, limpio);
      setNegocios((lista) => [negocio, ...(lista ?? []).filter((n) => n.id !== negocio.id)]);
      setCodigo("");
      avisar("Negocio guardado", `${negocio.nombre} quedó en tu lista.`, "exito");
    } catch (e) {
      avisarError(e, { titulo: "No se pudo guardar", porDefecto: "Establecimiento no encontrado." });
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (negocio: NegocioGuardado) => {
    const ok = await confirmar({
      titulo: "Quitar negocio",
      mensaje: `¿Quitar ${negocio.nombre} de tu lista? Puedes volver a agregarlo con su código.`,
      destructivo: true,
    });
    if (!ok) return;
    try {
      await quitarNegocio(token, negocio.id);
      setNegocios((lista) => (lista ?? []).filter((n) => n.id !== negocio.id));
    } catch (e) {
      avisarError(e, { titulo: "No se pudo quitar" });
    }
  };

  const abrir = (negocio: NegocioGuardado) =>
    push({ pathname: "/cliente", params: { codigo: negocio.codigoAcceso } });

  return (
    <Pantalla cabecera={{ onSalir: salir }}>
      <View style={styles.contenedor}>
        <Text style={[styles.saludo, { color: colors.textPrimary }]}>
          {nombre ? `Hola, ${nombre}` : "Hola"}
        </Text>
        <Boton
          titulo="MIS CITAS"
          ayuda="Muestra las citas que reservaste con tu cuenta"
          variante="secundario"
          onPress={() => push("/mis-citas")}
          style={styles.botonCitas}
        />

        <TituloSeccion>AGREGAR UN NEGOCIO</TituloSeccion>
        <CampoTexto
          etiqueta="Código del negocio"
          error={errorCodigo}
          ayuda="El código que te dio tu barbería o salón"
          placeholder="ej: CENTRAL10"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={10}
          value={codigo}
          onChangeText={(t) => {
            setCodigo(t);
            setErrorCodigo(null);
          }}
          onSubmitEditing={agregar}
          estiloTexto={styles.campoCodigo}
          centrado
        />
        <Boton
          titulo={guardando ? "AGREGANDO…" : "AGREGAR"}
          ayuda="Guarda el negocio en tu lista para reservar desde aquí"
          deshabilitado={guardando}
          onPress={agregar}
        />

        <TituloSeccion>MIS NEGOCIOS</TituloSeccion>
        {negocios === null ? (
          errorCarga ? (
            <View>
              <TextoInfo>{errorCarga}</TextoInfo>
              <Boton
                titulo="REINTENTAR"
                ayuda="Vuelve a cargar tus negocios guardados"
                variante="secundario"
                onPress={cargar}
              />
            </View>
          ) : (
            <ActivityIndicator color={colors.primaryText} style={styles.cargando} />
          )
        ) : negocios.length === 0 ? (
          <Text style={[styles.vacio, { color: colors.textSecondary }]}>
            Aún no tienes negocios guardados. Escribe arriba el código que te dio tu
            barbería para entrar a reservar siempre desde aquí.
          </Text>
        ) : (
          negocios.map((n) => (
            <View
              key={n.id}
              style={[
                styles.tarjeta,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <Tocable
                accessibilityRole="button"
                accessibilityLabel={`Reservar en ${n.nombre}`}
                accessibilityHint="Abre el negocio para elegir profesional, servicio y hora"
                style={styles.zonaAbrir}
                onPress={() => abrir(n)}
              >
                {n.fotoUrl ? (
                  <Image source={{ uri: n.fotoUrl }} style={styles.foto} contentFit="cover" />
                ) : (
                  <View style={[styles.foto, styles.sinFoto, { borderColor: colors.cardBorder }]}>
                    <Ionicons name="storefront-outline" size={24} color={colors.primaryText} />
                  </View>
                )}
                <View style={styles.textos}>
                  <Text style={[styles.nombre, { color: colors.textPrimary }]}>{n.nombre}</Text>
                  <Text style={[styles.detalle, { color: colors.textSecondary }]}>
                    {[n.categoria, n.ciudad].filter(Boolean).join(" · ") || n.codigoAcceso}
                  </Text>
                  {n.recibiendoReservas ? null : (
                    <View style={styles.insignia}>
                      <Insignia texto="NO RECIBE RESERVAS POR AHORA" color={COLORES.rojo} />
                    </View>
                  )}
                </View>
              </Tocable>
              <BotonIcono
                icono="trash-outline"
                color={colors.peligroTexto}
                etiqueta={`Quitar ${n.nombre}`}
                ayuda="Lo quita de tu lista, pide confirmación"
                onPress={() => quitar(n)}
              />
            </View>
          ))
        )}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginTop: 20 },
  cargando: { marginTop: 30 },
  saludo: { fontSize: 20, fontWeight: "bold" },
  botonCitas: { marginTop: 12 },
  campoCodigo: { fontWeight: "bold", letterSpacing: 2 },
  vacio: { fontSize: 13, lineHeight: 19 },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  zonaAbrir: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  foto: { width: 56, height: 56, borderRadius: 8 },
  sinFoto: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
  textos: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "bold" },
  detalle: { fontSize: 12, marginTop: 2 },
  insignia: { flexDirection: "row", marginTop: 6 },
});
