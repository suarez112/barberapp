import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar } from "@/utils/dialogos";
import { Coordenadas, PerfilEmpresa } from "../../cuenta/api";
import MapaUbicacion from "./MapaUbicacion";
import { Punto } from "./mapaTipos";

// El GPS sigue leyendo hasta lograr esta precisión o hasta que pase el tiempo máximo
const PRECISION_BUSCADA_M = 25;
const ESPERA_MAXIMA_MS = 20000;
// Por encima de esto la lectura se considera mala
const PRECISION_MALA_M = 50;

// El backend guarda 6 decimales (≈ 11 cm)
const redondear6 = (n: number) => Math.round(n * 1e6) / 1e6;

type Props = {
  perfil: PerfilEmpresa;
  onGuardar: (coordenadas: Coordenadas) => Promise<boolean>;
};

// Ubicación del negocio en el mapa: pin arrastrable o GPS del celular. "Cómo llegar" del cliente usa este punto.
export default function UbicacionNegocio({ perfil, onGuardar }: Props) {
  const { colors } = useAppTheme();
  const guardado: Punto | null =
    perfil.latitud !== null && perfil.longitud !== null
      ? { latitude: perfil.latitud, longitude: perfil.longitud }
      : null;
  const [punto, setPunto] = useState<Punto | null>(guardado);
  // Precisión del GPS del punto actual; null si se ubicó a mano
  const [precision, setPrecision] = useState<number | null>(perfil.precisionUbicacion);
  const [centrar, setCentrar] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const detenerGps = useRef<(() => void) | null>(null);

  // Al salir de la pantalla se deja de leer el GPS
  useEffect(() => () => detenerGps.current?.(), []);

  const cambiado =
    !!punto &&
    (!guardado ||
      redondear6(punto.latitude) !== redondear6(guardado.latitude) ||
      redondear6(punto.longitude) !== redondear6(guardado.longitude));

  const colocar = (p: Punto, precisionGps: number | null) => {
    setPunto(p);
    setPrecision(precisionGps);
    setCentrar((n) => n + 1);
  };

  // Arrastrar el pin o tocar el mapa: ya no es la lectura del GPS
  const moverAMano = (p: Punto) => {
    setPunto(p);
    setPrecision(null);
  };

  // Lee el GPS varias veces y se queda con la lectura más precisa
  const leerGps = () =>
    new Promise<Location.LocationObject | null>((resolve, reject) => {
      let mejor: Location.LocationObject | null = null;
      let suscripcion: Location.LocationSubscription | null = null;
      let terminado = false;
      const terminar = () => {
        if (terminado) return;
        terminado = true;
        clearTimeout(limite);
        suscripcion?.remove();
        detenerGps.current = null;
        resolve(mejor);
      };
      const limite = setTimeout(terminar, ESPERA_MAXIMA_MS);
      detenerGps.current = terminar;
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        (lectura) => {
          const metros = lectura.coords.accuracy ?? Infinity;
          if (!mejor || metros < (mejor.coords.accuracy ?? Infinity)) {
            mejor = lectura;
            setPrecision(lectura.coords.accuracy ?? null);
          }
          if (metros <= PRECISION_BUSCADA_M) terminar();
        },
      )
        .then((s) => {
          suscripcion = s;
          if (terminado) s.remove();
        })
        .catch((e) => {
          terminado = true;
          clearTimeout(limite);
          detenerGps.current = null;
          reject(e);
        });
    });

  const usarUbicacionActual = async () => {
    if (buscando) return;
    setBuscando(true);
    setPrecision(null);
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== "granted") {
        avisar(
          "Permiso de ubicación",
          "Para usar tu ubicación, permite que la app la lea. Puedes activarlo en los ajustes del celular.",
        );
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        avisar("Ubicación apagada", "Activa la ubicación (GPS) del celular e intenta de nuevo.");
        return;
      }
      const lectura = await leerGps();
      if (!lectura) {
        avisar(
          "Sin señal de GPS",
          "El celular no logró ubicarse en 20 segundos. Acércate a una ventana o a la puerta e intenta de nuevo, o mueve el pin a mano.",
          "error",
        );
        return;
      }
      const metros = lectura.coords.accuracy;
      colocar(
        { latitude: lectura.coords.latitude, longitude: lectura.coords.longitude },
        metros ?? null,
      );
      if (metros !== null && metros > PRECISION_MALA_M) {
        avisar(
          "Precisión baja",
          `El GPS solo logró ±${Math.round(metros)} m. Revisa el pin en el mapa y arrástralo al punto exacto, o intenta de nuevo cerca de la puerta.`,
        );
      }
    } catch (error) {
      registrarCausa("Ubicación del negocio", error);
      avisar(
        "No se pudo leer la ubicación",
        "El celular no pudo obtener tu ubicación. Revisa que el GPS esté activo e intenta de nuevo.",
        "error",
      );
    } finally {
      setBuscando(false);
    }
  };

  const guardar = async () => {
    if (!punto || guardando) return;
    setGuardando(true);
    await onGuardar({
      latitud: redondear6(punto.latitude),
      longitud: redondear6(punto.longitude),
      // El backend acepta de 0 a 100000 m, con un decimal
      precisionUbicacion:
        precision !== null && precision > 0 ? Math.min(Math.round(precision * 10) / 10, 100000) : null,
    });
    setGuardando(false);
  };

  const verEnMapa = () => {
    if (perfil.googleMapsUrl) Linking.openURL(perfil.googleMapsUrl).catch(() => {});
  };

  const colorPrecision =
    precision === null
      ? colors.textSecondary
      : precision <= PRECISION_BUSCADA_M
        ? COLORES.exitoClaro
        : precision <= PRECISION_MALA_M
          ? COLORES.advertencia
          : COLORES.peligro;

  return (
    <View>
      <TituloSeccion>UBICACIÓN EN EL MAPA</TituloSeccion>
      <Text style={[styles.nota, { color: colors.textSecondary }]}>
        {punto
          ? "Mantén presionado el pin y arrástralo hasta la puerta de tu negocio, o toca el mapa para moverlo."
          : "Aún no hay ubicación. Usa tu ubicación actual o toca el mapa para poner el pin."}{" "}
        Tus clientes la usarán en &quot;Cómo llegar&quot;.
      </Text>

      <MapaUbicacion punto={punto} centrar={centrar} onMover={moverAMano} />

      <View style={styles.estado}>
        <Text style={[styles.textoEstado, { color: colors.textPrimary }]}>
          {!punto
            ? "Sin ubicación guardada"
            : cambiado
              ? "Ubicación sin guardar"
              : "✓ Ubicación guardada"}
        </Text>
        {buscando || precision !== null ? (
          <Text style={[styles.precision, { color: colorPrecision }]}>
            {precision !== null ? `Precisión: ±${Math.round(precision)} m` : "Buscando señal…"}
          </Text>
        ) : null}
      </View>

      <Boton
        titulo={buscando ? "BUSCANDO UBICACIÓN…" : "USAR MI UBICACIÓN ACTUAL"}
        ayuda="Lee el GPS del celular hasta 20 segundos y pone el pin ahí. Úsalo dentro del local"
        variante="neutro"
        onPress={usarUbicacionActual}
      />

      <Boton
        titulo={guardando ? "GUARDANDO…" : "GUARDAR UBICACIÓN"}
        ayuda="Guarda el punto del pin como ubicación del negocio"
        onPress={guardar}
        deshabilitado={!cambiado || guardando}
      />

      {!cambiado && guardado && perfil.googleMapsUrl ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Ver en Google Maps"
          accessibilityHint="Abre Google Maps con la ubicación guardada, como la verán tus clientes"
          onPress={verEnMapa}
          style={styles.botonEnlace}
        >
          <Ionicons name="map-outline" size={14} color={colors.primaryText} />
          <Text style={[styles.textoEnlace, { color: colors.primaryText }]}>Ver en Google Maps</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  nota: { fontSize: 12, marginBottom: 8 },
  estado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  textoEstado: { fontSize: 13, fontWeight: "bold" },
  precision: { fontSize: 13, fontWeight: "bold" },
  botonEnlace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
  },
  textoEnlace: { fontSize: 13, fontWeight: "bold" },
});
