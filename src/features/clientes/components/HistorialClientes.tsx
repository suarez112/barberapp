import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { estilosTexto } from "@/components/ui/estilosTexto";
import Insignia from "@/components/ui/Insignia";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAgenda } from "@/features/agenda/AgendaProvider";
import { useSesion } from "@/features/sesion/SesionProvider";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { confirmar, avisar } from "@/utils/dialogos";
import { useClientes } from "../ClientesProvider";
import {
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

export default function HistorialClientes() {
  const { colors } = useAppTheme();
  const { citas } = useAgenda();
  const { barbero, empleadoSupervisado } = useSesion();
  const { clientes, estaBloqueado, bloquear, desbloquear } = useClientes();
  const [filtro, setFiltro] = useState<FiltroEstadoCliente>("TODOS");
  const [orden, setOrden] = useState<OrdenCliente>("DIAS_DESC");

  // El admin ve todo (o al supervisado); un integrante solo sus citas
  const citasVisibles = citas.filter((c) =>
    barbero?.esAdmin
      ? empleadoSupervisado
        ? c.barberoId === empleadoSupervisado.id
        : true
      : c.barberoId === barbero?.id,
  );
  const lista = procesarClientes({ clientes, citasVisibles, filtro, orden });

  const filtros: { id: FiltroEstadoCliente; label: string }[] = [
    { id: "TODOS", label: `Todos (${lista.length})` },
    { id: "ACTIVOS", label: "Activos / Frecuentes" },
    { id: "INACTIVOS", label: "Inactivos" },
  ];

  const alternarBloqueo = async (nombre: string, telefono: string) => {
    if (estaBloqueado(nombre, telefono)) {
      const ok = await confirmar({
        titulo: "Desbloquear Cliente",
        mensaje: `¿Deseas quitar a "${nombre}" de la lista negra y permitirle agendar nuevamente?`,
        textoConfirmar: "Sí, Desbloquear",
      });
      if (!ok) return;
      desbloquear(nombre, telefono);
      avisar("Desbloqueado", `${nombre} ya puede agendar citas.`);
    } else {
      const ok = await confirmar({
        titulo: "Bloquear Cliente",
        mensaje: `¿Deseas enviar a "${nombre}" a la Lista Negra? No podrá volver a agendar.`,
        textoConfirmar: "Bloquear Cliente",
        destructivo: true,
      });
      if (!ok) return;
      bloquear(nombre, telefono);
      avisar("Cliente Bloqueado", `${nombre} ha sido agregado a la lista negra.`);
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
            <Pressable
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
            </Pressable>
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
            <Pressable
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
            </Pressable>
          );
        })}
      </ScrollView>

      {lista.length === 0 ? (
        <TextoInfo>No hay clientes registrados en este grupo.</TextoInfo>
      ) : (
        lista.map((cli) => {
          const bloqueado = estaBloqueado(cli.nombre, cli.telefono);
          const subtitulo = [
            estilosTexto.subtitulo,
            { color: colors.textSecondary },
          ];
          return (
            <TarjetaFila key={cli.telefono}>
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
                    {cli.totalCitasCalculado} Citas
                  </Text>
                  {barbero?.esAdmin ? (
                    <Pressable
                      accessibilityRole="button"
                      style={[
                        styles.botonBloqueo,
                        {
                          backgroundColor: bloqueado
                            ? COLORES.exito
                            : COLORES.peligroOscuro,
                        },
                      ]}
                      onPress={() => alternarBloqueo(cli.nombre, cli.telefono)}
                    >
                      <Text style={styles.botonBloqueoTexto}>
                        {bloqueado ? "✅ Desbloquear" : "🚫 Bloquear"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </TarjetaFila>
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
  botonBloqueo: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  botonBloqueoTexto: { color: COLORES.blanco, fontSize: 9, fontWeight: "bold" },
});
