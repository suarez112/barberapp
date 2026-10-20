import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTelefono from "@/components/ui/CampoTelefono";
import CampoTexto from "@/components/ui/CampoTexto";
import { estilosTexto } from "@/components/ui/estilosTexto";
import TarjetaFila from "@/components/ui/TarjetaFila";
import TextoInfo from "@/components/ui/TextoInfo";
import TituloSeccion from "@/components/ui/TituloSeccion";
import { useTelefono } from "@/hooks/useTelefono";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar, confirmar } from "@/utils/dialogos";
import { normalizar } from "@/utils/formato";
import { normalizarTelefono, soloDigitos, telefonoConBandera } from "@/utils/telefonos";
import { EstadoClientes } from "../useClientes";

export default function ListaNegra({ estado }: { estado: EstadoClientes }) {
  const { colors } = useAppTheme();
  const { clientes, listaNegra, bloquear, desbloquear } = estado;
  const telefono = useTelefono();
  const [busqueda, setBusqueda] = useState("");

  // Se compara en E.164 (como el backend); los teléfonos antiguos sin "+" por sus dígitos
  const escrito = soloDigitos(telefono.texto);
  const e164 = escrito ? normalizarTelefono(telefono.texto, telefono.indicativo) : null;
  const clienteEncontrado = escrito
    ? clientes.find((c) =>
        c.telefono.startsWith("+")
          ? e164 !== null && c.telefono === e164.telefono
          : soloDigitos(c.telefono) === escrito,
      )
    : undefined;

  // Búsqueda en tiempo real por nombre o teléfono
  const q = normalizar(busqueda);
  const qDigitos = soloDigitos(busqueda);
  const filtrada = q
    ? listaNegra.filter(
        (item) =>
          item.nombre.toLowerCase().includes(q) ||
          (qDigitos !== "" && soloDigitos(item.telefono).includes(qDigitos)),
      )
    : listaNegra;

  const agregar = async () => {
    if (!escrito) {
      telefono.setError("Escribe el celular del cliente que quieres bloquear.");
      return;
    }
    if (!clienteEncontrado) {
      telefono.setError(
        "Ningún cliente que haya reservado tiene este número: revisa los dígitos y la bandera del país.",
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
    if (await bloquear(clienteEncontrado)) telefono.limpiar();
  };

  const quitar = async (id: string, nombre: string) => {
    const ok = await confirmar({
      titulo: "Quitar de la lista negra",
      mensaje: `¿Permitir que ${nombre} vuelva a agendar?`,
    });
    if (ok) await desbloquear(id, nombre);
  };

  return (
    <View>
      <TituloSeccion>LISTA NEGRA (BLOQUEAR CLIENTES)</TituloSeccion>

      <CampoTelefono
        telefono={telefono}
        etiqueta="Celular del cliente"
        ayuda="Escribe el celular con el que reservó. Debajo aparece su nombre"
        onSubmitEditing={agregar}
      />
      <CampoTexto
        etiqueta="Cliente"
        ayuda="Se llena solo al escribir un celular de un cliente que ya reservó"
        placeholder={
          escrito
            ? "Número no registrado como cliente"
            : "El nombre aparece al escribir el celular"
        }
        value={clienteEncontrado ? clienteEncontrado.nombre : ""}
        editable={false}
      />
      <Boton
        titulo="AGREGAR A LISTA NEGRA"
        ayuda="Bloquea a este cliente: ya no podrá reservar en tu negocio"
        variante="peligro"
        onPress={agregar}
      />

      <TituloSeccion style={styles.tituloRestringidos}>
        CLIENTES RESTRINGIDOS ({filtrada.length})
      </TituloSeccion>
      <CampoTexto
        etiqueta="Buscar en la lista negra"
        ayuda="Filtra por nombre o celular mientras escribes"
        placeholder="ej: Ana o 316"
        autoCorrect={false}
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.buscador}
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
                📞 {telefonoConBandera(item.telefono)}
              </Text>
            </View>
            <BotonIcono
              icono="trash-outline"
              color={COLORES.peligro}
              etiqueta={`Quitar a ${item.nombre} de la lista negra`}
              ayuda="Le permite volver a reservar"
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
