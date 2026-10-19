import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar, confirmar } from "@/utils/dialogos";
import { normalizar } from "@/utils/formato";
import { EstadoClientes } from "../useClientes";

// Compara teléfonos por sus dígitos, como el backend
const digitos = (t: string) => t.replace(/\D/g, "");

export default function ListaNegra({ estado }: { estado: EstadoClientes }) {
  const { colors } = useAppTheme();
  const { clientes, listaNegra, bloquear, desbloquear } = estado;
  const [telefono, setTelefono] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const tel = digitos(telefono);
  const clienteEncontrado = tel
    ? clientes.find((c) => digitos(c.telefono) === tel)
    : undefined;

  // Búsqueda en tiempo real por nombre o teléfono
  const q = normalizar(busqueda);
  const filtrada = q
    ? listaNegra.filter(
        (item) => item.nombre.toLowerCase().includes(q) || item.telefono.includes(q),
      )
    : listaNegra;

  const agregar = async () => {
    if (!tel) {
      avisar("Falta el teléfono", "Escribe el teléfono del cliente.");
      return;
    }
    if (!clienteEncontrado) {
      avisar(
        "No es cliente registrado",
        "Este número no pertenece a ningún cliente que haya reservado.",
      );
      return;
    }
    if (clienteEncontrado.enListaNegra) {
      avisar(
        "Ya está bloqueado",
        `${clienteEncontrado.nombre} ya está en la lista negra.`,
      );
      return;
    }
    if (await bloquear(clienteEncontrado)) setTelefono("");
  };

  const quitar = async (id: string, nombre: string) => {
    const ok = await confirmar({
      titulo: "Quitar de la lista negra",
      mensaje: `¿Permitir que ${nombre} vuelva a agendar?`,
      textoConfirmar: "Sí, quitar",
    });
    if (ok) await desbloquear(id, nombre);
  };

  return (
    <View>
      <TituloSeccion>LISTA NEGRA (BLOQUEAR CLIENTES)</TituloSeccion>

      <CampoTexto
        placeholder={
          tel
            ? "⚠️ Número no registrado como cliente"
            : "El nombre aparece al escribir el teléfono"
        }
        value={clienteEncontrado ? clienteEncontrado.nombre : ""}
        editable={false}
      />
      <CampoTexto
        placeholder="Teléfono del Cliente"
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={setTelefono}
      />
      <Boton titulo="AGREGAR A LISTA NEGRA" variante="peligro" onPress={agregar} />

      <TituloSeccion style={styles.tituloRestringidos}>
        CLIENTES RESTRINGIDOS ({filtrada.length})
      </TituloSeccion>
      <CampoTexto
        style={[styles.buscador, { borderColor: colors.primary }]}
        placeholder="🔍 Buscar bloqueado por nombre o teléfono..."
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {filtrada.length === 0 ? (
        <TextoInfo>No hay coincidencias en la lista negra.</TextoInfo>
      ) : (
        filtrada.map((item) => (
          <TarjetaFila key={item.id}>
            <View style={styles.flex}>
              <Text style={[estilosTexto.titulo, { color: colors.textPrimary }]}>
                🚫 {item.nombre}
              </Text>
              <Text
                style={[estilosTexto.subtitulo, { color: colors.textSecondary }]}
              >
                📞 Teléfono: {item.telefono}
              </Text>
            </View>
            <BotonIcono
              icono="trash-outline"
              color={COLORES.peligro}
              etiqueta={`Quitar a ${item.nombre} de la lista negra`}
              onPress={() => quitar(item.id, item.nombre)}
            />
          </TarjetaFila>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tituloRestringidos: { marginTop: 25 },
  buscador: { marginBottom: 15 },
  flex: { flex: 1 },
});
