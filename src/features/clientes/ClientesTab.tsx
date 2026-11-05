import Cuadricula from "@/components/layout/Cuadricula";
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
import { Bloqueado, Cliente } from "./api";
import TarjetaBloqueado from "./components/TarjetaBloqueado";
import TarjetaCliente from "./components/TarjetaCliente";
import { useClientes } from "./useClientes";

type Filtro = "todos" | "bloqueados";

// Clientes del negocio (solo administrador). La búsqueda y las páginas las hace el servidor.
export default function ClientesTab({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const c = useClientes(token);
  useRefrescoPanel(c.refrescar);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const filtros = [
    { id: "todos", label: "Todos" },
    { id: "bloqueados", label: `Bloqueados (${c.bloqueados.length})` },
  ] as const;

  // La lista negra es corta y llega completa: se filtra aquí por nombre o teléfono
  const q = normalizar(c.busqueda);
  const qDigitos = soloDigitos(c.busqueda);
  const bloqueados = c.bloqueados.filter(
    (b) =>
      !q ||
      normalizar(b.nombre).includes(q) ||
      (qDigitos !== "" && soloDigitos(b.telefono).includes(qDigitos)),
  );

  const pedirDesbloqueo = async (id: string, nombre: string) => {
    const ok = await confirmar({
      titulo: "Desbloquear cliente",
      mensaje: `¿Quieres que ${nombre} pueda volver a reservar?`,
    });
    if (ok) await c.desbloquear(id, nombre);
  };

  const alternarBloqueo = async (cliente: Cliente) => {
    if (cliente.enListaNegra && cliente.listaNegraId) {
      await pedirDesbloqueo(cliente.listaNegraId, cliente.nombre);
    } else {
      const ok = await confirmar({
        titulo: "Bloquear cliente",
        mensaje: `${cliente.nombre} ya no podrá reservar en tu negocio. ¿Continuar?`,
        destructivo: true,
      });
      if (ok) await c.bloquear(cliente);
    }
  };

  const vacio =
    filtro === "bloqueados"
      ? bloqueados.length === 0
        ? c.buscando
          ? "Ningún cliente bloqueado coincide con la búsqueda."
          : "No tienes clientes bloqueados."
        : null
      : !c.cargando && !c.error && c.clientes.length === 0
        ? c.buscando
          ? "Ningún cliente coincide con la búsqueda."
          : "Aún no tienes clientes."
        : null;

  return (
    <View>
      <CampoTexto
        etiqueta="Buscar cliente"
        placeholder="ej: Juan o 316 278"
        ayuda="Busca por nombre o por teléfono"
        value={c.busqueda}
        onChangeText={c.setBusqueda}
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="search"
        izquierda={<Ionicons name="search" size={18} color={colors.textSecondary} />}
        style={{ marginTop: 12 }}
      />
      <Chips opciones={filtros} valor={filtro} onCambiar={setFiltro} />

      {filtro === "todos" ? (
        <>
          {c.cargando ? (
            <ActivityIndicator color={colors.primaryText} style={{ marginTop: 20 }} />
          ) : null}
          {c.error ? (
            <View>
              <TextoInfo>{c.error}</TextoInfo>
              <Boton
                titulo="REINTENTAR"
                ayuda="Vuelve a cargar los clientes"
                variante="secundario"
                onPress={c.recargar}
              />
            </View>
          ) : null}
          {vacio ? <TextoInfo>{vacio}</TextoInfo> : null}

          {/* Mientras llega una búsqueda nueva se sigue viendo la lista anterior */}
          {!c.error ? (
            <Cuadricula>
              {c.clientes.map((cliente) => (
                <TarjetaCliente
                  key={cliente.id}
                  token={token}
                  cliente={cliente}
                  onAlternarBloqueo={alternarBloqueo}
                />
              ))}
            </Cuadricula>
          ) : null}

          {!c.cargando && !c.error && c.hayMas ? (
            <Boton
              titulo={c.cargandoMas ? "CARGANDO…" : "VER MÁS"}
              ayuda="Muestra los siguientes clientes de la lista"
              variante="secundario"
              onPress={c.verMas}
              deshabilitado={c.cargandoMas}
            />
          ) : null}
        </>
      ) : (
        <>
          {vacio ? <TextoInfo>{vacio}</TextoInfo> : null}
          <Cuadricula>
            {bloqueados.map((b: Bloqueado) => (
              <TarjetaBloqueado
                key={b.id}
                bloqueado={b}
                onDesbloquear={(x) => pedirDesbloqueo(x.id, x.nombre)}
              />
            ))}
          </Cuadricula>
        </>
      )}
    </View>
  );
}
