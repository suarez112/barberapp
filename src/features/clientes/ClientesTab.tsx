import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Boton from "@/components/ui/Boton";
import CampoTexto from "@/components/ui/CampoTexto";
import Chips from "@/components/ui/Chips";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import { confirmar } from "@/utils/dialogos";
import { normalizar } from "@/utils/formato";
import { soloDigitos } from "@/utils/telefonos";
import { useRefrescoPanel } from "../panel/RefrescoPanel";
import { Cliente } from "./api";
import TarjetaCliente from "./components/TarjetaCliente";
import { useClientes } from "./useClientes";

type Filtro = "todos" | "bloqueados";

// Clientes del negocio (solo administrador)
export default function ClientesTab({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const { clientes, cargando, error, recargar, refrescar, bloquear, desbloquear } =
    useClientes(token);
  useRefrescoPanel(refrescar);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const bloqueados = clientes.filter((c) => c.enListaNegra);
  const filtros = [
    { id: "todos", label: `Todos (${clientes.length})` },
    { id: "bloqueados", label: `Bloqueados (${bloqueados.length})` },
  ] as const;

  // Por nombre o por teléfono (dígitos, con o sin indicativo)
  const q = normalizar(busqueda);
  const qDigitos = soloDigitos(busqueda);
  const lista = (filtro === "bloqueados" ? bloqueados : clientes)
    .filter(
      (c) =>
        !q ||
        normalizar(c.nombre).includes(q) ||
        (qDigitos !== "" && soloDigitos(c.telefono).includes(qDigitos)),
    )
    // Los de visita más reciente primero
    .sort((a, b) => (b.fechaUltimaCita ?? "").localeCompare(a.fechaUltimaCita ?? ""));

  const alternarBloqueo = async (c: Cliente) => {
    if (c.enListaNegra && c.listaNegraId) {
      const ok = await confirmar({
        titulo: "Desbloquear cliente",
        mensaje: `¿Quieres que ${c.nombre} pueda volver a reservar?`,
      });
      if (ok) await desbloquear(c.listaNegraId, c.nombre);
    } else {
      const ok = await confirmar({
        titulo: "Bloquear cliente",
        mensaje: `${c.nombre} ya no podrá reservar en tu negocio. ¿Continuar?`,
        destructivo: true,
      });
      if (ok) await bloquear(c);
    }
  };

  return (
    <View>
      <CampoTexto
        etiqueta="Buscar cliente"
        placeholder="ej: Juan o 316 278"
        ayuda="Filtra la lista por nombre o por teléfono"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="search"
        izquierda={<Ionicons name="search" size={18} color={colors.textSecondary} />}
        style={{ marginTop: 12 }}
      />
      <Chips opciones={filtros} valor={filtro} onCambiar={setFiltro} />

      {cargando && clientes.length === 0 ? (
        <ActivityIndicator color={colors.primaryText} style={{ marginTop: 20 }} />
      ) : null}
      {error ? (
        <View>
          <TextoInfo>{error}</TextoInfo>
          <Boton
            titulo="REINTENTAR"
            ayuda="Vuelve a cargar los clientes"
            variante="secundario"
            onPress={recargar}
          />
        </View>
      ) : null}

      {!cargando && !error && lista.length === 0 ? (
        <TextoInfo>
          {q
            ? "Ningún cliente coincide con la búsqueda."
            : filtro === "bloqueados"
              ? "No tienes clientes bloqueados."
              : "Aún no tienes clientes."}
        </TextoInfo>
      ) : null}

      {lista.map((c) => (
        <TarjetaCliente key={c.id} token={token} cliente={c} onAlternarBloqueo={alternarBloqueo} />
      ))}
    </View>
  );
}
