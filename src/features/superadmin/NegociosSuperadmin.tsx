import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import CampoTexto from "@/components/ui/CampoTexto";
import Chips from "@/components/ui/Chips";
import Insignia from "@/components/ui/Insignia";
import { useAppTheme } from "@/theme/ThemeProvider";
import { FiltroEstado, listarNegocios, NegocioResumen } from "./api";
import Encabezado from "./components/Encabezado";
import EstadoCarga from "./components/EstadoCarga";
import Paginacion from "./components/Paginacion";
import Tabla, { Columna } from "./components/Tabla";
import DetalleNegocio from "./DetalleNegocio";
import { ESTADOS_NEGOCIO, FILTROS_ESTADO, formatearFecha } from "./formato";
import { useCargar } from "./useCargar";

const POR_PAGINA = 25;
// Espera a que termine de escribir antes de buscar
const ESPERA_BUSQUEDA_MS = 400;

type Filtro = FiltroEstado | "todos";

// Negocios: tabla con búsqueda y filtros; al tocar uno se abre su detalle
export default function NegociosSuperadmin() {
  const [abierto, setAbierto] = useState<string | null>(null);

  if (abierto) return <DetalleNegocio id={abierto} onVolver={() => setAbierto(null)} />;
  return <ListaNegocios onAbrir={setAbierto} />;
}

function ListaNegocios({ onAbrir }: { onAbrir: (id: string) => void }) {
  const { colors } = useAppTheme();
  const [texto, setTexto] = useState("");
  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState<Filtro>("todos");
  const [pagina, setPagina] = useState(1);

  // La búsqueda se envía poco después de dejar de escribir
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBuscar(texto.trim());
      setPagina(1);
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(temporizador);
  }, [texto]);

  const { datos, cargando, error, recargar } = useCargar(
    (token, signal) =>
      listarNegocios(token, { buscar, estado: estado === "todos" ? "" : estado, pagina, limite: POR_PAGINA }, signal),
    `${buscar}|${estado}|${pagina}`,
  );

  const columnas: Columna<NegocioResumen>[] = [
    {
      clave: "negocio",
      titulo: "Negocio",
      ancho: 3,
      render: (n) => (
        <View>
          <Text numberOfLines={1} style={[styles.principal, { color: colors.textPrimary }]}>
            {n.nombre}
          </Text>
          <Text numberOfLines={1} style={[styles.secundario, { color: colors.textSecondary }]}>
            {n.codigoAcceso}
          </Text>
        </View>
      ),
    },
    {
      clave: "plan",
      titulo: "Plan",
      ancho: 2,
      render: (n) => (
        <Text style={[styles.texto, { color: colors.textPrimary }]}>
          {n.planEquipo.nombre}
          {n.plan ? ` · ${n.plan}` : ""}
        </Text>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      ancho: 2,
      render: (n) => (
        <View style={styles.insignia}>
          <Insignia texto={ESTADOS_NEGOCIO[n.estado].texto} color={ESTADOS_NEGOCIO[n.estado].color} />
        </View>
      ),
    },
    {
      clave: "dias",
      titulo: "Días",
      ancho: 1,
      render: (n) => (
        <Text style={[styles.texto, { color: colors.textPrimary }]}>{n.diasRestantes ?? "—"}</Text>
      ),
    },
    {
      clave: "cupo",
      titulo: "Cupo",
      ancho: 1.2,
      render: (n) => (
        <Text style={[styles.texto, { color: colors.textPrimary }]}>
          {n.cupoUsado} de {n.planEquipo.cupo}
        </Text>
      ),
    },
    {
      clave: "ubicacion",
      titulo: "Ubicación",
      ancho: 2,
      render: (n) => (
        <Text numberOfLines={1} style={[styles.texto, { color: colors.textSecondary }]}>
          {[n.municipio, n.departamento].filter(Boolean).join(", ") || "—"}
        </Text>
      ),
    },
    {
      clave: "registro",
      titulo: "Registro",
      ancho: 1.6,
      render: (n) => (
        <Text style={[styles.texto, { color: colors.textSecondary }]}>{formatearFecha(n.fechaRegistro)}</Text>
      ),
    },
  ];

  return (
    <View>
      <Encabezado titulo="Negocios" subtitulo="Busca un negocio por nombre o código y toca una fila para ver su detalle" />
      <CampoTexto
        etiqueta="Buscar"
        ayuda="Escribe parte del nombre o del código del negocio"
        placeholder="ej: barbería central"
        value={texto}
        onChangeText={setTexto}
        autoCapitalize="none"
        style={styles.busqueda}
      />
      <Chips
        opciones={FILTROS_ESTADO}
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
                clave={(n) => n.id}
                etiquetaFila={(n) => `${n.nombre}, ${ESTADOS_NEGOCIO[n.estado].texto.toLowerCase()}`}
                onFila={(n) => onAbrir(n.id)}
                vacio="No hay negocios con esos filtros."
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
  busqueda: { maxWidth: 480 },
  tabla: { marginTop: 16 },
  principal: { fontSize: 14, fontWeight: "bold" },
  secundario: { fontSize: 12, marginTop: 2 },
  texto: { fontSize: 14 },
  insignia: { alignSelf: "flex-start" },
});
