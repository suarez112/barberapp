import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useAppTheme } from "@/theme/ThemeProvider";
import { PropsMapa, Punto } from "./mapaTipos";

// Centro de Colombia, muy alejado, cuando aún no hay ubicación
const COLOMBIA = { latitude: 4.6, longitude: -74.1, zoom: 5 };
// Cerca, como para ver la cuadra del negocio
const ZOOM_CERCA = 18;

// Leaflet 1.9.4 (con su huella SRI) y mapas de OpenStreetMap: no necesitan clave
const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist";

// Página del mapa. Avisa a la app con postMessage:
// { tipo: "listo" }, { tipo: "error" } o { tipo: "mover", lat, lng }
const paginaMapa = (punto: Punto | null, color: string) => `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="${LEAFLET}/leaflet.css" integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="">
<style>
  html, body, #mapa { margin: 0; height: 100%; background: #ddd; }
  .pin { width: 26px; height: 26px; border-radius: 50% 50% 50% 0; background: ${color};
    border: 3px solid #fff; transform: rotate(-45deg); box-shadow: 0 1px 4px rgba(0,0,0,.5); }
</style>
</head><body><div id="mapa"></div>
<script src="${LEAFLET}/leaflet.js" integrity="sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH" crossorigin=""></script>
<script>
  var avisar = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  if (typeof L === "undefined") { avisar({ tipo: "error" }); } else {
    var inicio = ${JSON.stringify(punto)};
    var mapa = L.map("mapa", { zoomControl: true }).setView(
      inicio ? [inicio.latitude, inicio.longitude] : [${COLOMBIA.latitude}, ${COLOMBIA.longitude}],
      inicio ? ${ZOOM_CERCA} : ${COLOMBIA.zoom});
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(mapa);
    var icono = L.divIcon({ className: "", html: '<div class="pin"></div>', iconSize: [26, 26], iconAnchor: [13, 30] });
    var pin = null;
    var enviar = function (ll) { avisar({ tipo: "mover", lat: ll.lat, lng: ll.lng }); };
    // Pone el pin (o lo mueve) sin avisar a la app; centrar acerca el mapa
    window.ponerPin = function (lat, lng, centrar) {
      if (!pin) {
        pin = L.marker([lat, lng], { draggable: true, icon: icono }).addTo(mapa);
        pin.on("dragend", function () { enviar(pin.getLatLng()); });
      } else {
        pin.setLatLng([lat, lng]);
      }
      if (centrar) mapa.setView([lat, lng], ${ZOOM_CERCA});
    };
    if (inicio) window.ponerPin(inicio.latitude, inicio.longitude, false);
    mapa.on("click", function (e) {
      window.ponerPin(e.latlng.lat, e.latlng.lng, false);
      enviar(e.latlng);
    });
    avisar({ tipo: "listo" });
  }
</script></body></html>`;

// Mapa de OpenStreetMap (Leaflet en un WebView) con un pin arrastrable.
// Tocar el mapa también mueve el pin. Funciona en Expo Go y sin clave de Google.
export default function MapaUbicacion({ punto, centrar, onMover }: PropsMapa) {
  const { colors } = useAppTheme();
  const web = useRef<WebView<object>>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  // La página se arma una sola vez: después el pin se mueve con ponerPin
  const [html] = useState(() => paginaMapa(punto, colors.primary));

  // El pin vino del GPS: el mapa se acerca a él
  useEffect(() => {
    if (!punto || centrar === 0 || estado !== "listo") return;
    web.current?.injectJavaScript(
      `window.ponerPin(${punto.latitude}, ${punto.longitude}, true); true;`,
    );
    // Solo cuando cambia "centrar", no cada vez que se arrastra el pin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centrar, estado]);

  const recibir = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.tipo === "listo") setEstado("listo");
      else if (m.tipo === "error") setEstado("error");
      else if (m.tipo === "mover") onMover({ latitude: m.lat, longitude: m.lng });
    } catch {
      // Mensaje que no es del mapa: se ignora
    }
  };

  return (
    <View style={[styles.caja, { borderColor: colors.cardBorder }]}>
      <WebView<object>
        ref={web}
        accessibilityLabel="Mapa con la ubicación del negocio. Arrastra el pin o toca el mapa para moverlo"
        source={{ html }}
        originWhitelist={["*"]}
        onMessage={recibir}
        onError={() => setEstado("error")}
        // Android: el mapa recibe los arrastres en vez de la pantalla que lo contiene
        nestedScrollEnabled
        scrollEnabled={false}
        setBuiltInZoomControls={false}
        style={styles.mapa}
      />
      {estado !== "listo" ? (
        <View style={[styles.aviso, { backgroundColor: colors.cardBg }]} pointerEvents="none">
          <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
            {estado === "cargando"
              ? "Cargando mapa…"
              : "No se pudo cargar el mapa. Revisa tu conexión a internet y vuelve a abrir esta pantalla."}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { height: 280, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  mapa: { flex: 1 },
  aviso: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
});
