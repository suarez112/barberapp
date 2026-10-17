import { StyleSheet, Text } from "react-native";
import { COLORES } from "../../theme/paleta";

type Props = { texto: string; color: string };

export default function Insignia({ texto, color }: Props) {
  return <Text style={[styles.insignia, { backgroundColor: color }]}>{texto}</Text>;
}

const styles = StyleSheet.create({
  insignia: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    color: COLORES.blanco,
  },
});
