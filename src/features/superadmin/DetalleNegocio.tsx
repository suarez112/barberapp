import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Insignia from "@/components/ui/Insignia";
import Tocable from "@/components/ui/Tocable";
import { useAppTheme } from "@/theme/ThemeProvider";
import { obtenerNegocio } from "./api";
import AccionNegocioModal, { TipoAccion } from "./components/AccionNegocioModal";
import EstadoCarga from "./components/EstadoCarga";
import Ficha from "./components/Ficha";
import {
  ACCIONES,
  ESTADOS_NEGOCIO,
  formatearFecha,
  formatearNumero,
  formatearPesos,
  resumirDetalle,
} from "./formato";
import { useCargar } from "./useCargar";

const SUSCRIPCION: Record<string, string> = {
  trial: "Prueba gratuita",
  activa: "Activa",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

type Props = { id: string; onVolver: () => void };

// Detalle de un negocio (solo cifras: nunca datos de sus clientes) y sus acciones
export default function DetalleNegocio({ id, onVolver }: Props) {
  const { colors } = useAppTheme();
  const { datos: n, cargando, error, recargar } = useCargar((token, signal) => obtenerNegocio(token, id, signal), id);
  const [accion, setAccion] = useState<TipoAccion | null>(null);

  const volver = (
    <Tocable
      accessibilityRole="button"
      accessibilityLabel="Volver a negocios"
      accessibilityHint="Regresa a la lista de negocios"
      onPress={onVolver}
      style={styles.volver}
    >
      <Ionicons name="arrow-back" size={20} color={colors.primaryText} />
      <Text style={[styles.textoVolver, { color: colors.primaryText }]}>Volver a negocios</Text>
    </Tocable>
  );

  return (
    <View>
      {volver}
      <EstadoCarga cargando={cargando} error={error} hayDatos={n !== null} onReintentar={recargar}>
        {n ? (
          <View>
            <View style={styles.titulo}>
              <View style={styles.nombre}>
                <Text accessibilityRole="header" style={[styles.h1, { color: colors.textPrimary }]}>
                  {n.nombre}
                </Text>
                <Text style={[styles.codigo, { color: colors.textSecondary }]}>Código: {n.codigoAcceso}</Text>
              </View>
              <Insignia texto={ESTADOS_NEGOCIO[n.estado].texto} color={ESTADOS_NEGOCIO[n.estado].color} />
            </View>

            <View style={styles.acciones}>
              {n.suscripcion.estadoGuardado !== "cancelada" ? (
                <Boton
                  titulo="ACTIVAR PLAN"
                  ayuda="Abre una ventana para activar o cambiar el plan"
                  onPress={() => setAccion("plan")}
                  style={styles.accion}
                />
              ) : null}
              {n.suscripcion.estadoGuardado === "trial" ? (
                <Boton
                  titulo="EXTENDER PRUEBA"
                  ayuda="Abre una ventana para sumar días a la prueba gratuita"
                  variante="secundario"
                  onPress={() => setAccion("prueba")}
                  style={styles.accion}
                />
              ) : null}
              {n.suspension ? (
                <Boton
                  titulo="REACTIVAR"
                  ayuda="Abre una ventana para quitar la suspensión"
                  variante="secundario"
                  onPress={() => setAccion("reactivar")}
                  style={styles.accion}
                />
              ) : (
                <Boton
                  titulo="SUSPENDER"
                  ayuda="Abre una ventana para suspender el negocio"
                  variante="peligro"
                  onPress={() => setAccion("suspender")}
                  style={styles.accion}
                />
              )}
            </View>

            <View style={styles.rejilla}>
              <Ficha
                titulo="Negocio"
                filas={[
                  ["Categoría", n.categoria ?? "—"],
                  ["Dirección", n.direccion ?? "—"],
                  ["Ubicación", [n.municipio, n.departamento].filter(Boolean).join(", ") || "—"],
                  ["Registro", formatearFecha(n.fechaRegistro)],
                  ["Administrador(a)", n.administradora.nombre],
                  ["Correo", n.administradora.correo ?? "—"],
                ]}
              />
              <Ficha
                titulo="Suscripción"
                filas={[
                  ["Estado guardado", SUSCRIPCION[n.suscripcion.estadoGuardado] ?? n.suscripcion.estadoGuardado],
                  ["Plan de equipo", `${n.planEquipo.nombre} (hasta ${n.planEquipo.cupo})`],
                  ["Periodo", n.plan ?? "—"],
                  ["Último pago", formatearFecha(n.suscripcion.fechaPago)],
                  ["Vence", formatearFecha(n.suscripcion.fechaFin)],
                  ["Fin de la prueba", formatearFecha(n.suscripcion.finDePrueba)],
                  ["Días de prueba sumados", String(n.suscripcion.diasPruebaSumados)],
                  ["Días restantes", n.diasRestantes === null ? "—" : String(n.diasRestantes)],
                ]}
              />
              {n.suspension ? (
                <Ficha
                  titulo="Suspensión"
                  filas={[
                    ["Desde", formatearFecha(n.suspension.desde, true)],
                    ["Motivo", n.suspension.motivo ?? "—"],
                  ]}
                />
              ) : null}
              <Ficha
                titulo="Equipo"
                filas={[
                  ["Personas activas", `${n.equipo.activos} de ${n.equipo.cupo}`],
                  ["Administradores", String(n.equipo.administradores)],
                  ["Empleados", String(n.equipo.empleados)],
                ]}
              />
              <Ficha
                titulo="Cifras"
                filas={[
                  ["Clientes", formatearNumero(n.cifras.clientes)],
                  ["Servicios", formatearNumero(n.cifras.servicios)],
                  ["Productos", formatearNumero(n.cifras.productos)],
                  ["Citas (total)", formatearNumero(n.cifras.citas.total)],
                  ["Confirmadas", formatearNumero(n.cifras.citas.confirmadas)],
                  ["Completadas", formatearNumero(n.cifras.citas.completadas)],
                  ["Canceladas", formatearNumero(n.cifras.citas.canceladas)],
                  ["Citas este mes", formatearNumero(n.cifras.citas.esteMes)],
                  ["Última cita", formatearFecha(n.cifras.citas.ultima)],
                  ["Ventas (total)", formatearPesos(n.cifras.ventas.total)],
                  ["Ventas este mes", formatearPesos(n.cifras.ventas.esteMes)],
                ]}
              />
              <Ficha
                titulo="Actividad reciente"
                filas={
                  n.actividadReciente.length === 0
                    ? [["Sin acciones", "—"]]
                    : n.actividadReciente.map((a) => [
                        `${formatearFecha(a.fecha, true)} · ${ACCIONES[a.accion]}`,
                        [resumirDetalle(a.accion, a.detalle), a.motivo].filter(Boolean).join(" · ") || "—",
                      ])
                }
              />
            </View>

            {accion ? (
              <AccionNegocioModal
                tipo={accion}
                negocio={n}
                onCerrar={() => setAccion(null)}
                onHecho={() => {
                  setAccion(null);
                  recargar();
                }}
              />
            ) : null}
          </View>
        ) : null}
      </EstadoCarga>
    </View>
  );
}

const styles = StyleSheet.create({
  volver: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, marginBottom: 8, alignSelf: "flex-start" },
  textoVolver: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
  titulo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 },
  nombre: { flex: 1 },
  h1: { fontSize: 26, fontWeight: "bold" },
  codigo: { fontSize: 14, marginTop: 4 },
  acciones: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  accion: { minWidth: 180, marginTop: 0 },
  rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
});
