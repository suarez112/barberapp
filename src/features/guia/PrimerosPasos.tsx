import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Tocable from "@/components/ui/Tocable";
import { registrarCausa } from "@/services/api/errores";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar } from "@/utils/dialogos";
import { PasoGuia } from "./api";
import { useGuia } from "./guiaContexto";

export type DestinoGuia = "SERVICIOS" | "MI_NEGOCIO";

type Props = {
  // Pestaña abierta: al cambiarla se vuelve a consultar el avance
  pestana: string;
  nombreNegocio: string;
  // Lleva al administrador a la pantalla donde se hace el paso
  onIr: (destino: DestinoGuia) => void;
};

const AYUDA: Record<PasoGuia["id"], string> = {
  servicio: "Abre Servicios para crear el primero",
  horario: "Abre Mi negocio para revisar y guardar tu horario",
  enlace: "Abre las opciones para compartir el enlace de tu negocio",
};

// "Primeros pasos": 3 pasos con check, barra de progreso y mensaje al completarla.
// No sale mientras carga, si falló la consulta o si el administrador la ocultó.
export default function PrimerosPasos({ pestana, nombreNegocio, onIr }: Props) {
  const { colors } = useAppTheme();
  const { guia, refrescar, marcarEnlace, ocultar } = useGuia();

  useEffect(() => {
    refrescar();
  }, [pestana, refrescar]);

  if (!guia || guia.oculta) return null;

  const compartir = async () => {
    // Se marca al abrir Compartir, aunque la persona lo cierre sin enviar
    marcarEnlace();
    try {
      await Share.share({ message: `Reserva tu cita en ${nombreNegocio}: ${guia.enlacePublico}` });
    } catch (error) {
      registrarCausa("Compartir enlace", error);
      avisar("No se pudo compartir", "Intenta de nuevo desde Mi negocio.", "error");
    }
  };

  const tocarPaso = (paso: PasoGuia) => {
    if (paso.id === "servicio") onIr("SERVICIOS");
    else if (paso.id === "horario") onIr("MI_NEGOCIO");
    else compartir();
  };

  const avance = guia.total > 0 ? guia.completados / guia.total : 0;

  if (guia.completa) {
    return (
      <View
        style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: COLORES.verde }]}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.titulo}>
          <Ionicons name="checkmark-circle" size={26} color={colors.exitoTexto} />
          <Text style={[styles.textoTitulo, { color: colors.textPrimary }]}>
            ¡Felicitaciones, tu negocio está listo!
          </Text>
        </View>
        <Text style={[styles.detalle, { color: colors.textSecondary }]}>
          Completaste los 3 primeros pasos. Ya puedes recibir reservas de tus clientes.
        </Text>
        <Boton
          titulo="ENTENDIDO"
          ayuda="Cierra este mensaje y oculta los primeros pasos"
          variante="secundario"
          onPress={ocultar}
          style={styles.boton}
        />
      </View>
    );
  }

  return (
    <View style={[styles.tarjeta, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.titulo}>
        <Text style={[styles.textoTitulo, { color: colors.textPrimary }]}>Primeros pasos</Text>
        <Text style={[styles.contador, { color: colors.textSecondary }]}>
          {guia.completados} de {guia.total}
        </Text>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Progreso: ${guia.completados} de ${guia.total} pasos`}
        style={[styles.pista, { backgroundColor: colors.inputBorder }]}
      >
        <View style={[styles.relleno, { width: `${avance * 100}%`, backgroundColor: COLORES.verde }]} />
      </View>

      {guia.pasos.map((paso) => (
        <Tocable
          key={paso.id}
          accessibilityRole="button"
          accessibilityLabel={`${paso.titulo}${paso.completado ? ", hecho" : ", pendiente"}`}
          accessibilityHint={AYUDA[paso.id]}
          style={styles.paso}
          onPress={() => tocarPaso(paso)}
        >
          <Ionicons
            name={paso.completado ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={paso.completado ? colors.exitoTexto : colors.textSecondary}
          />
          <Text
            style={[
              styles.textoPaso,
              { color: colors.textPrimary },
              paso.completado && styles.hecho,
            ]}
          >
            {paso.titulo}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Tocable>
      ))}

      <Tocable
        accessibilityRole="button"
        accessibilityLabel="Ocultar primeros pasos"
        accessibilityHint="Esconde esta tarjeta; puedes volver a mostrarla en Mi negocio"
        style={styles.ocultar}
        onPress={ocultar}
      >
        <Text style={[styles.textoOcultar, { color: colors.primaryText }]}>Ocultar</Text>
      </Tocable>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 12 },
  titulo: { flexDirection: "row", alignItems: "center", gap: 8 },
  textoTitulo: { flex: 1, fontSize: 15, fontWeight: "bold" },
  contador: { fontSize: 12, fontWeight: "600" },
  detalle: { fontSize: 13, marginTop: 6 },
  pista: { height: 8, borderRadius: 4, overflow: "hidden", marginVertical: 10 },
  relleno: { height: "100%", borderRadius: 4 },
  paso: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48 },
  textoPaso: { flex: 1, fontSize: 14, fontWeight: "600" },
  hecho: { textDecorationLine: "line-through", opacity: 0.7 },
  ocultar: { alignSelf: "flex-end", minHeight: 44, minWidth: 44, justifyContent: "center" },
  textoOcultar: { fontSize: 13, fontWeight: "bold", textDecorationLine: "underline" },
  boton: { marginTop: 10 },
});
