import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { LatLng, Marker } from "react-native-maps";
import { useAppTheme } from "@/theme/ThemeProvider";
import { PropsMapa } from "./mapaTipos";

// Centro de Colombia, muy alejado, cuando aún no hay ubicación
const COLOMBIA = { latitude: 4.6, longitude: -74.1, latitudeDelta: 12, longitudeDelta: 12 };
// Cerca, como para ver la cuadra del negocio
const DELTA_CERCA = 0.004;

// Mapa con un pin arrastrable. Tocar el mapa también mueve el pin.
export default function MapaUbicacion({ punto, centrar, onMover }: PropsMapa) {
  const { colors } = useAppTheme();
  const mapa = useRef<MapView>(null);

  // El pin vino del GPS o de unas coordenadas pegadas: el mapa se acerca a él
  useEffect(() => {
    if (!punto || centrar === 0) return;
    mapa.current?.animateToRegion(
      { ...punto, latitudeDelta: DELTA_CERCA, longitudeDelta: DELTA_CERCA },
      500,
    );
    // Solo cuando cambia "centrar", no cada vez que se arrastra el pin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centrar]);

  const mover = (c: LatLng) => onMover({ latitude: c.latitude, longitude: c.longitude });

  return (
    <MapView
      ref={mapa}
      style={[styles.mapa, { borderColor: colors.cardBorder }]}
      initialRegion={
        punto ? { ...punto, latitudeDelta: DELTA_CERCA, longitudeDelta: DELTA_CERCA } : COLOMBIA
      }
      onPress={(e) => mover(e.nativeEvent.coordinate)}
      toolbarEnabled={false}
      accessibilityLabel="Mapa con la ubicación del negocio. Arrastra el pin o toca el mapa para moverlo"
    >
      {punto ? (
        <Marker
          coordinate={punto}
          draggable
          onDragEnd={(e) => mover(e.nativeEvent.coordinate)}
          pinColor={colors.primary}
          title="Tu negocio"
          description="Mantén presionado y arrastra para ajustar"
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapa: { height: 280, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
});
