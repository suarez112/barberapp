import { StyleSheet, View } from "react-native";
import Boton from "./Boton";

type Props = { tituloGuardar: string; onGuardar: () => void; onCancelar: () => void };

// Fila "Guardar / Cancelar" al pie de los formularios en acordeón
export default function BotonesFormulario({
  tituloGuardar,
  onGuardar,
  onCancelar,
}: Props) {
  return (
    <View style={styles.fila}>
      <Boton titulo={tituloGuardar} onPress={onGuardar} style={styles.flex} />
      <Boton
        titulo="CANCELAR"
        variante="neutro"
        onPress={onCancelar}
        style={styles.flex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
});
