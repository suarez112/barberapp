import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import CampoTexto from "@/components/ui/CampoTexto";
import FotoImagen from "@/components/ui/FotoImagen";
import TextoInfo from "@/components/ui/TextoInfo";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { Barbero } from "@/types";

type Props = {
  barberos: Barbero[];
  seleccionado: Barbero | null;
  onSeleccionar: (b: Barbero) => void;
};

// Desde cuántos profesionales aparece el buscador
const CON_BUSCADOR = 7;
// Foto cuadrada: grande para reconocer al profesional sin abrirla (la foto guardada mide 720 x 900)
const FOTO = 92;

// "José Peña" y "jose pena" coinciden
const simplificar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

// Lista para elegir profesional: una fila por persona con su foto grande, nombre y especialidad.
// Con muchos profesionales se puede buscar por nombre o especialidad.
export default function SelectorProfesional({ barberos, seleccionado, onSeleccionar }: Props) {
  const { colors } = useAppTheme();
  const [busqueda, setBusqueda] = useState("");
  const conBuscador = barberos.length >= CON_BUSCADOR;
  const texto = conBuscador ? simplificar(busqueda) : "";
  const lista = texto
    ? barberos.filter((b) => simplificar(`${b.nombre} ${b.especialidad ?? ""}`).includes(texto))
    : barberos;

  return (
    <View>
      {conBuscador ? (
        <CampoTexto
          etiqueta="Buscar profesional"
          placeholder="ej: Carlos o Colorimetría"
          ayuda="Filtra la lista por nombre o especialidad"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="search"
          izquierda={<Ionicons name="search" size={18} color={colors.textSecondary} />}
        />
      ) : null}

      {texto && lista.length === 0 ? (
        <TextoInfo>Ningún profesional coincide con &quot;{busqueda.trim()}&quot;.</TextoInfo>
      ) : null}

      <View style={styles.lista}>
        {lista.map((b) => {
          const elegido = seleccionado?.id === b.id;
          return (
            <Tocable
              key={b.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegido, checked: elegido }}
              accessibilityLabel={[b.nombre, b.especialidad].filter(Boolean).join(", ")}
              accessibilityHint="Elige este profesional para tu cita"
              onPress={() => onSeleccionar(b)}
              style={[
                styles.fila,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                elegido && { borderColor: colors.primary, backgroundColor: colors.cardSelectedBg },
              ]}
            >
              {b.foto ? (
                <FotoImagen uri={b.foto} enLista accessibilityIgnoresInvertColors style={styles.foto} />
              ) : (
                <View style={[styles.foto, styles.sinFoto, { backgroundColor: colors.inicialesBg }]}>
                  <Text style={[styles.inicial, { color: colors.inicialesTexto }]}>
                    {b.nombre.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.textos}>
                <Text numberOfLines={2} style={[styles.nombre, { color: colors.textPrimary }]}>
                  {b.nombre}
                </Text>
                {b.especialidad ? (
                  <Text numberOfLines={2} style={[styles.especialidad, { color: colors.textSecondary }]}>
                    {b.especialidad}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                name={elegido ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={elegido ? colors.primaryText : colors.textSecondary}
              />
            </Tocable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 8 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    paddingRight: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  foto: { width: FOTO, height: FOTO, borderRadius: 16 },
  sinFoto: { alignItems: "center", justifyContent: "center" },
  inicial: { fontSize: 36, fontWeight: "bold" },
  textos: { flex: 1 },
  nombre: { fontSize: 17, fontWeight: "bold" },
  especialidad: { fontSize: 14, marginTop: 4 },
});
