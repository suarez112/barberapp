import { useState } from "react";
import { StyleSheet, View } from "react-native";
import BotonCabecera from "@/components/layout/BotonCabecera";
import { COLORES } from "@/theme/paleta";
import ModalNotificaciones from "./ModalNotificaciones";
import { useNotificaciones } from "./NotificacionesProvider";

export default function BotonNotificaciones() {
  const { hayNoLeidas, marcarComoLeidas } = useNotificaciones();
  const [visible, setVisible] = useState(false);

  const abrir = () => {
    setVisible(true);
    marcarComoLeidas();
  };

  return (
    <>
      <BotonCabecera
        icono="notifications-outline"
        etiqueta="Notificaciones"
        onPress={abrir}
      >
        {hayNoLeidas ? <View style={styles.punto} /> : null}
      </BotonCabecera>
      <ModalNotificaciones visible={visible} onCerrar={() => setVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  punto: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORES.peligro,
  },
});
