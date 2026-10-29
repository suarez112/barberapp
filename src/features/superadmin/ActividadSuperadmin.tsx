import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Chips from "@/components/ui/Chips";
import { useAppTheme } from "@/theme/ThemeProvider";
import { AccionActividad, ActividadItem, listarActividad } from "./api";
import Encabezado from "./components/Encabezado";
import EstadoCarga from "./components/EstadoCarga";
import Paginacion from "./components/Paginacion";
import Tabla, { Columna } from "./components/Tabla";
import { ACCIONES, FILTROS_ACCION, formatearFecha, resumirDetalle } from "./formato";
import { useCargar } from "./useCargar";

const POR_PAGINA = 25;

type Filtro = AccionActividad | "todas";

// Actividad: registro de lo que ha hecho el superadministrador (solo se agregan filas)
export default function ActividadSuperadmin() {
  const { colors } = useAppTheme();
  const [accion, setAccion] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);

  const { datos, cargando, error, recargar } = useCargar(
    (token, signal) =>
      listarActividad(token, { accion: accion === "todas" ? "" : accion, pagina, limite: POR_PAGINA }, signal),
    `${accion}|${pagina}`,
  );

  const columnas: Columna<ActividadItem>[] = [
    {
      clave: "fecha",
      titulo: "Fecha",
      ancho: 2,
      render: (a) => <Text style={[styles.texto, { color: colors.textPrimary }]}>{formatearFecha(a.fecha, true)}</Text>,
    },
    {
      clave: "accion",
      titulo: "Acción",
      ancho: 2,
      render: (a) => (
        <Text style={[styles.principal, { color: colors.textPrimary }]}>{ACCIONES[a.accion] ?? a.accion}</Text>
      ),
    },
    {
      clave: "negocio",
      titulo: "Negocio o referencia",
      ancho: 3,
      render: (a) => (
        <View>
          <Text numberOfLines={1} style={[styles.texto, { color: colors.textPrimary }]}>
            {a.negocio ? a.negocio.nombre : (a.referencia ?? "—")}
          </Text>
          {a.negocio ? (
            <Text numberOfLines={1} style={[styles.secundario, { color: colors.textSecondary }]}>
              {a.negocio.codigoAcceso}
            </Text>
          ) : null}
        </View>
      ),
    },
    {
      clave: "detalle",
      titulo: "Detalle y motivo",
      ancho: 3,
      render: (a) => (
        <Text style={[styles.texto, { color: colors.textSecondary }]}>
          {[resumirDetalle(a.accion, a.detalle), a.motivo].filter(Boolean).join(" · ") || "—"}
        </Text>
      ),
    },
    {
      clave: "quien",
      titulo: "Quién",
      ancho: 2.4,
      render: (a) => (
        <Text numberOfLines={1} style={[styles.texto, { color: colors.textSecondary }]}>
          {a.superadmin}
        </Text>
      ),
    },
  ];

  return (
    <View>
      <Encabezado
        titulo="Actividad"
        subtitulo="Registro de acciones del superadministrador. No se puede editar ni borrar."
      />
      <Chips
        opciones={FILTROS_ACCION}
        valor={accion}
        onCambiar={(id) => {
          setAccion(id);
          setPagina(1);
        }}
      />
      <View style={styles.tabla}>
        <EstadoCarga cargando={cargando} error={error} hayDatos={datos !== null} onReintentar={recargar}>
          {datos ? (
            <>
              <Tabla
                columnas={columnas}
                filas={datos.datos}
                clave={(a) => a.id}
                vacio="Todavía no hay acciones registradas."
              />
              <Paginacion total={datos.total} pagina={datos.pagina} limite={datos.limite} onCambiar={setPagina} />
            </>
          ) : null}
        </EstadoCarga>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabla: { marginTop: 16 },
  principal: { fontSize: 14, fontWeight: "bold" },
  secundario: { fontSize: 12, marginTop: 2 },
  texto: { fontSize: 14 },
});
