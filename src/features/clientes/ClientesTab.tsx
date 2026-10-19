import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Boton from "@/components/ui/Boton";
import Selector from "@/components/ui/Selector";
import TextoInfo from "@/components/ui/TextoInfo";
import { useAppTheme } from "@/theme/ThemeProvider";
import HistorialClientes from "./components/HistorialClientes";
import ListaNegra from "./components/ListaNegra";
import { useClientes } from "./useClientes";

type Seccion = "HISTORIAL" | "LISTA_NEGRA";

const SECCIONES = [
  { id: "HISTORIAL", label: "Historial" },
  { id: "LISTA_NEGRA", label: "Lista negra" },
] as const;

// Clientes del negocio (solo administrador)
export default function ClientesTab({ token }: { token: string }) {
  const { colors } = useAppTheme();
  const [seccion, setSeccion] = useState<Seccion>("HISTORIAL");
  const estado = useClientes(token);

  return (
    <View>
      <Selector opciones={SECCIONES} valor={seccion} onCambiar={setSeccion} />
      {estado.cargando && estado.clientes.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : null}
      {estado.error ? (
        <View>
          <TextoInfo>{estado.error}</TextoInfo>
          <Boton titulo="REINTENTAR" variante="neutro" onPress={estado.recargar} />
        </View>
      ) : null}
      {seccion === "HISTORIAL" ? (
        <HistorialClientes token={token} estado={estado} />
      ) : (
        <ListaNegra estado={estado} />
      )}
    </View>
  );
}
