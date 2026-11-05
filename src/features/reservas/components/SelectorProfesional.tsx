import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import FotoBarbero from "@/components/FotoBarbero";
import CampoTexto from "@/components/ui/CampoTexto";
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

// "José Peña" y "jose pena" coinciden
const simplificar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

// Lista compacta para elegir profesional: una fila por persona (foto, nombre y especialidad).
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

      {lista.length === 0 ? (
        <TextoInfo>Ningún profesional coincide con &quot;{busqueda.trim()}&quot;.</TextoInfo>
      ) : null}

      <View style={styles.lista}>
        {lista.map((b) => {
          const elegido = seleccionado?.id === b.id;
          const detalle = [b.especialidad, b.equipo].filter(Boolean).join(" · ");
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
              <FotoBarbero nombre={b.nombre} foto={b.foto} color={colors.primaryText} size={44} />
              <View style={styles.textos}>
                <Text numberOfLines={1} style={[styles.nombre, { color: colors.textPrimary }]}>
                  {b.nombre}
                </Text>
                {detalle ? (
                  <Text numberOfLines={1} style={[styles.especialidad, { color: colors.textSecondary }]}>
                    {detalle}
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
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  textos: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "bold" },
  especialidad: { fontSize: 12, marginTop: 2 },
});
