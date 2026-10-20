import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Chips from "@/components/ui/Chips";
import Insignia from "@/components/ui/Insignia";
import { useAppTheme } from "@/theme/ThemeProvider";
import { EstadoPqrs, listarPqrs, PqrsAdmin } from "./api";
import Encabezado from "./components/Encabezado";
import EstadoCarga from "./components/EstadoCarga";
import Paginacion from "./components/Paginacion";
import Tabla, { Columna } from "./components/Tabla";
import { ESTADOS_PQRS, FILTROS_PQRS, formatearFecha, TIPOS_PQRS } from "./formato";
import DetallePqrs from "./DetallePqrs";
import { useCargar } from "./useCargar";

const POR_PAGINA = 25;

type Filtro = EstadoPqrs | "todas";

// PQRS: lista de todas las solicitudes (las sin resolver primero) y su detalle
export default function PqrsSuperadmin() {
  const [abierta, setAbierta] = useState<string | null>(null);

  if (abierta) return <DetallePqrs radicado={abierta} onVolver={() => setAbierta(null)} />;
  return <ListaPqrs onAbrir={setAbierta} />;
}

function ListaPqrs({ onAbrir }: { onAbrir: (radicado: string) => void }) {
  const { colors } = useAppTheme();
  const [estado, setEstado] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);

  const { datos, cargando, error, recargar } = useCargar(
    (token, signal) =>
      listarPqrs(token, { estado: estado === "todas" ? "" : estado, pagina, limite: POR_PAGINA }, signal),
    `${estado}|${pagina}`,
  );

  const columnas: Columna<PqrsAdmin>[] = [
    {
      clave: "radicado",
      titulo: "Radicado",
      ancho: 2,
      render: (p) => <Text style={[styles.principal, { color: colors.textPrimary }]}>{p.radicado}</Text>,
    },
    {
      clave: "tipo",
      titulo: "Tipo",
      ancho: 1.4,
      render: (p) => <Text style={[styles.texto, { color: colors.textPrimary }]}>{TIPOS_PQRS[p.tipo] ?? p.tipo}</Text>,
    },
    {
      clave: "estado",
      titulo: "Estado",
      ancho: 1.8,
      render: (p) => (
        <View style={styles.insignia}>
          <Insignia texto={ESTADOS_PQRS[p.estado].texto} color={ESTADOS_PQRS[p.estado].color} />
        </View>
      ),
    },
    {
      clave: "mensaje",
      titulo: "Mensaje",
      ancho: 4,
      render: (p) => (
        <Text numberOfLines={2} style={[styles.texto, { color: colors.textSecondary }]}>
          {p.mensaje}
        </Text>
      ),
    },
    {
      clave: "de",
      titulo: "De",
      ancho: 2,
      render: (p) => (
        <Text numberOfLines={1} style={[styles.texto, { color: colors.textPrimary }]}>
          {p.nombre}
        </Text>
      ),
    },
    {
      clave: "fecha",
      titulo: "Recibida",
      ancho: 1.6,
      render: (p) => <Text style={[styles.texto, { color: colors.textSecondary }]}>{formatearFecha(p.creadaEn)}</Text>,
    },
  ];

  return (
    <View>
      <Encabezado titulo="PQRS" subtitulo="Peticiones, quejas, reclamos y sugerencias. Toca una fila para responder." />
      <Chips
        opciones={FILTROS_PQRS}
        valor={estado}
        onCambiar={(id) => {
          setEstado(id);
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
                clave={(p) => p.radicado}
                etiquetaFila={(p) => `PQRS ${p.radicado}, ${ESTADOS_PQRS[p.estado].texto.toLowerCase()}`}
                onFila={(p) => onAbrir(p.radicado)}
                vacio="No hay PQRS con ese filtro."
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
  texto: { fontSize: 14 },
  insignia: { alignSelf: "flex-start" },
});
