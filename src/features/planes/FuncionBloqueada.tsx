import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { useAppTheme } from "@/theme/ThemeProvider";
import { useFunciones } from "./funcionesContexto";

type Props = {
  // Id de la función en GET /api/v1/funciones (ej. "demanda")
  funcion: string;
  // Nombre a mostrar si el servidor no lo trajo
  nombre?: string;
  // Título fijo que reemplaza al del servidor (ej. varias tarjetas de una misma función)
  titulo?: string;
  // Qué se pierde sin ella, en una frase
  detalle?: string;
};

// Una función que el plan no incluye: no se oculta, se muestra con candado y
// "Disponible en plan X", con un botón a los planes.
export default function FuncionBloqueada({ funcion, nombre, titulo: tituloFijo, detalle }: Props) {
  const { colors } = useAppTheme();
  const { funcion: buscar, abrirPlanes } = useFunciones();
  const info = buscar(funcion);
  const titulo = tituloFijo ?? info?.nombre ?? nombre ?? "Esta función";
  const plan = info?.planRequerido?.nombre;
  const disponible = plan ? `Disponible en plan ${plan}` : "No está incluida en tu plan";

  return (
    <View
      accessible
      accessibilityLabel={`${titulo}. ${disponible}`}
      style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
    >
      <View style={styles.fila}>
        <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
        <View style={styles.texto}>
          <Text style={[styles.titulo, { color: colors.textPrimary }]}>{titulo}</Text>
          <Text style={[styles.disponible, { color: colors.primaryText }]}>{disponible}</Text>
        </View>
      </View>
      {detalle ? <Text style={[styles.detalle, { color: colors.textSecondary }]}>{detalle}</Text> : null}
      <Boton
        titulo="VER PLANES"
        ayuda={`Muestra los planes para usar ${titulo.toLowerCase()}`}
        variante="secundario"
        onPress={abrirPlanes}
        style={styles.boton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 10 },
  fila: { flexDirection: "row", alignItems: "center", gap: 10 },
  texto: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: "bold" },
  disponible: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  detalle: { fontSize: 12, marginTop: 8 },
  boton: { marginTop: 10 },
});
