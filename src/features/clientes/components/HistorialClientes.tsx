import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Tocable from "@/components/ui/Tocable";
import { estilosTexto } from "@/components/ui/estilosTexto";
import Insignia from "@/components/ui/Insignia";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { confirmar } from "@/utils/dialogos";
import { EstadoClientes } from "../useClientes";
import HistorialCitas from "./HistorialCitas";
import {
  ClienteProcesado,
  FiltroEstadoCliente,
  OrdenCliente,
  procesarClientes,
} from "../procesarClientes";

const ORDENES: { id: OrdenCliente; label: string; icono: "arrow-down-outline" | "arrow-up-outline" }[] = [
  { id: "DIAS_DESC", label: "Más tiempo sin venir", icono: "arrow-down-outline" },
  { id: "DIAS_ASC", label: "Más recientes", icono: "arrow-up-outline" },
  { id: "CITAS_DESC", label: "Mayor nº de citas", icono: "arrow-down-outline" },
  { id: "CITAS_ASC", label: "Menor nº de citas", icono: "arrow-up-outline" },
];

type Props = { token: string; estado: EstadoClientes };

export default function HistorialClientes({ token, estado }: Props) {
  const { colors } = useAppTheme();
  const { clientes, bloquear, desbloquear } = estado;
  const [filtro, setFiltro] = useState<FiltroEstadoCliente>("TODOS");
  const [orden, setOrden] = useState<OrdenCliente>("DIAS_DESC");
  // Cliente del que se están viendo las citas
  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  const lista = procesarClientes({ clientes, filtro, orden });

  const filtros: { id: FiltroEstadoCliente; label: string }[] = [
    { id: "TODOS", label: `Todos (${lista.length})` },
    { id: "ACTIVOS", label: "Activos / Frecuentes" },
    { id: "INACTIVOS", label: "Inactivos" },
  ];

  const alternarBloqueo = async (cli: ClienteProcesado) => {
    if (cli.enListaNegra && cli.listaNegraId) {
      const ok = await confirmar({
        titulo: "Desbloquear Cliente",
        mensaje: `¿Deseas quitar a "${cli.nombre}" de la lista negra y permitirle agendar nuevamente?`,
      });
      if (ok) await desbloquear(cli.listaNegraId, cli.nombre);
    } else {
      const ok = await confirmar({
        titulo: "Bloquear Cliente",
        mensaje: `¿Deseas enviar a "${cli.nombre}" a la Lista Negra? No podrá volver a agendar.`,
        destructivo: true,
      });
      if (ok) await bloquear(cli);
    }
  };

  return (
    <View>
      <TituloSeccion>📋 HISTORIAL DE CLIENTES Y FRECUENCIA</TituloSeccion>

      <View
        style={[
          styles.segmentos,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        {filtros.map((f) => {
          const activo = filtro === f.id;
          return (
            <Tocable
              key={f.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: activo }}
              style={[styles.segmento, activo && { backgroundColor: colors.primary }]}
              onPress={() => setFiltro(f.id)}
            >
              <Text
                style={[
                  styles.segmentoTexto,
                  {
                    color: activo
                      ? COLORES.textoSobrePrimario
                      : colors.textSecondary,
                  },
                ]}
              >
                {f.label}
              </Text>
            </Tocable>
          );
        })}
      </View>

      <Text style={[styles.ordenarPor, { color: colors.textSecondary }]}>
        ORDENAR POR:
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.ordenes}
      >
        {ORDENES.map((o) => {
          const activo = orden === o.id;
          const color = activo ? colors.primary : colors.textSecondary;
          return (
            <Tocable
              key={o.id}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              style={[
                styles.pildora,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                activo && {
                  borderColor: colors.primary,
                  backgroundColor: colors.cardSelectedBg,
                },
              ]}
              onPress={() => setOrden(o.id)}
            >
              <Ionicons name={o.icono} size={12} color={color} />
              <Text style={[styles.pildoraTexto, { color }]}>{o.label}</Text>
            </Tocable>
          );
        })}
      </ScrollView>

      {lista.length === 0 ? (
        <TextoInfo>No hay clientes registrados en este grupo.</TextoInfo>
      ) : (
        lista.map((cli) => {
          const bloqueado = cli.enListaNegra;
          const subtitulo = [
            estilosTexto.subtitulo,
            { color: colors.textSecondary },
          ];
          return (
            <View key={cli.id}>
            <TarjetaFila>
              <View style={styles.flex}>
                <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
                  👤 {cli.nombre}
                </Text>
                <Text style={subtitulo}>📞 Teléfono: {cli.telefono}</Text>
                <Text style={subtitulo}>
                  📅 Última visita:{" "}
                  {cli.fechaUltimaCita
                    ? `${cli.fechaUltimaCita} (${
                        cli.diasTranscurridos === 0
                          ? "Hoy"
                          : `hace ${cli.diasTranscurridos} días`
                      })`
                    : "Sin registro"}
                </Text>
              </View>

              <View style={styles.columnaDerecha}>
                <Insignia
                  texto={
                    cli.estadoCliente === "ACTIVO"
                      ? "FRECUENTE / ACTIVO"
                      : "INACTIVO"
                  }
                  color={
                    cli.estadoCliente === "ACTIVO" ? COLORES.exito : COLORES.inactivo
                  }
                />
                <View style={styles.filaAcciones}>
                  <Text style={[styles.totalCitas, { color: colors.primary }]}>
                    {cli.totalCitas} Citas
                  </Text>
                  <Tocable
                      accessibilityRole="button"
                      style={[
                        styles.botonBloqueo,
                        {
                          backgroundColor: bloqueado
                            ? COLORES.exito
                            : COLORES.peligroOscuro,
                        },
                      ]}
                      onPress={() => alternarBloqueo(cli)}
                    >
                      <Text style={styles.botonBloqueoTexto}>
                        {bloqueado ? "✅ Desbloquear" : "🚫 Bloquear"}
                      </Text>
                    </Tocable>
                </View>
                <Tocable
                  accessibilityRole="button"
                  onPress={() => setAbiertoId(abiertoId === cli.id ? null : cli.id)}
                >
                  <Text style={[styles.verCitas, { color: colors.primary }]}>
                    {abiertoId === cli.id ? "Ocultar citas ▲" : "Ver citas ▼"}
                  </Text>
                </Tocable>
              </View>
            </TarjetaFila>
            {abiertoId === cli.id ? (
              <HistorialCitas token={token} clienteId={cli.id} />
            ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentos: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 10,
  },
  segmento: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  segmentoTexto: { fontSize: 10, fontWeight: "bold" },
  ordenarPor: { fontSize: 10, fontWeight: "bold", marginBottom: 6 },
  ordenes: { marginBottom: 15 },
  pildora: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pildoraTexto: { fontSize: 11, fontWeight: "bold" },
  flex: { flex: 1 },
  columnaDerecha: { alignItems: "flex-end", gap: 6 },
  filaAcciones: { flexDirection: "row", alignItems: "center", gap: 8 },
  totalCitas: { fontSize: 10, fontWeight: "bold" },
  verCitas: { fontSize: 11, fontWeight: "bold" },
  botonBloqueo: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  botonBloqueoTexto: { color: COLORES.blanco, fontSize: 9, fontWeight: "bold" },
});
