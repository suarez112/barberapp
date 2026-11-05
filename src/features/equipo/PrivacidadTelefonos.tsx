import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import { describirError, registrarCausa } from "@/services/api/errores";
import { esCancelada } from "@/services/api/http";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar } from "@/utils/dialogos";
import { useAvisarError } from "../sesion/useAvisarError";
import { cambiarPrivacidadClientes, obtenerPrivacidadClientes } from "./api";

const ETIQUETA = "Los empleados pueden ver el teléfono de los clientes";

// Interruptor del negocio: si los empleados ven el teléfono (y el WhatsApp) de los clientes de sus citas
export default function PrivacidadTelefonos({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const avisarError = useAvisarError();
  // null = aún no se sabe (cargando o con error)
  const [valor, setValor] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    obtenerPrivacidadClientes(token, control.signal)
      .then((r) => {
        setValor(r.empleadosVenTelefono);
        setError(null);
      })
      .catch((e) => {
        if (esCancelada(e)) return;
        registrarCausa("Privacidad de clientes", e);
        setError(describirError(e, { titulo: "", porDefecto: "No se pudo cargar esta opción." }).mensaje);
      });
    return () => control.abort();
  }, [token, intento]);

  const cambiar = async (nuevo: boolean) => {
    if (guardando || valor === null) return;
    const anterior = valor;
    // Se ve el cambio de inmediato; si el servidor falla, vuelve como estaba
    setValor(nuevo);
    setGuardando(true);
    try {
      const r = await cambiarPrivacidadClientes(token, nuevo);
      setValor(r.empleadosVenTelefono);
      if (r.mensaje) avisar("Listo", r.mensaje, "exito");
    } catch (e) {
      setValor(anterior);
      avisarError(e, { titulo: "No se pudo cambiar la opción" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={[styles.caja, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.fila}>
        <View style={styles.textos}>
          <Text style={[styles.titulo, { color: colors.textPrimary }]}>{ETIQUETA}</Text>
          <Text style={[styles.ayuda, { color: colors.textSecondary }]}>
            {valor
              ? "Cada empleado ve el número y el botón de WhatsApp de los clientes de sus citas."
              : "Apagado: los empleados no ven el número de los clientes. Los administradores siempre lo ven."}
          </Text>
        </View>
        {valor === null && !error ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Switch
            accessibilityLabel={ETIQUETA}
            accessibilityHint="Si está activo, los empleados ven el teléfono de los clientes de sus citas"
            value={valor ?? false}
            disabled={valor === null || guardando}
            onValueChange={cambiar}
            trackColor={{ true: colors.primary, false: colors.cardBorder }}
            thumbColor={COLORES.blanco}
          />
        )}
      </View>
      {error ? (
        <>
          <Text style={[styles.ayuda, { color: colors.peligroTexto }]}>{error}</Text>
          <Boton
            titulo="REINTENTAR"
            ayuda="Vuelve a cargar esta opción"
            variante="secundario"
            onPress={() => {
              setError(null);
              setIntento((n) => n + 1);
            }}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 15 },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 },
  textos: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: "600" },
  ayuda: { fontSize: 12, marginTop: 4 },
});
