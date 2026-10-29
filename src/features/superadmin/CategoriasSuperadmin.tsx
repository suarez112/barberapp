import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import Boton from "@/components/ui/Boton";
import BotonIcono from "@/components/ui/BotonIcono";
import CampoTexto from "@/components/ui/CampoTexto";
import Insignia from "@/components/ui/Insignia";
import { useAppTheme } from "@/theme/ThemeProvider";
import { COLORES } from "@/theme/paleta";
import { avisar, confirmar } from "@/utils/dialogos";
import { CategoriaAdmin, crearCategoria, editarCategoria, listarCategoriasAdmin } from "./api";
import Encabezado from "./components/Encabezado";
import EstadoCarga from "./components/EstadoCarga";
import ModalAccion from "./components/ModalAccion";
import Tabla, { Columna } from "./components/Tabla";
import { useSuperadmin } from "./SuperadminContext";
import { useCargar } from "./useCargar";

// Nueva categoría (id null) o edición del nombre de una existente
type Edicion = { id: string | null; nombre: string } | null;

// Categorías de negocio: crear, editar el nombre y desactivar o reactivar (no se borran)
export default function CategoriasSuperadmin() {
  const { colors } = useAppTheme();
  const { token, avisarError } = useSuperadmin();
  const { datos, cargando, error, recargar } = useCargar(
    (t, signal) => listarCategoriasAdmin(t, signal),
    "categorias",
  );
  const [edicion, setEdicion] = useState<Edicion>(null);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cerrar = () => {
    setEdicion(null);
    setErrorNombre(null);
  };

  const guardar = async () => {
    if (!edicion || enviando) return;
    const nombre = edicion.nombre.trim();
    if (!nombre) {
      setErrorNombre("Escribe el nombre de la categoría.");
      return;
    }
    setEnviando(true);
    try {
      const respuesta = edicion.id
        ? await editarCategoria(token, edicion.id, { nombre })
        : await crearCategoria(token, nombre);
      avisar("Listo", respuesta.mensaje, "exito");
      cerrar();
      recargar();
    } catch (e) {
      avisarError("Guardar categoría", e, "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (c: CategoriaAdmin) => {
    const seguir = await confirmar({
      titulo: c.activa ? "¿Desactivar la categoría?" : "¿Reactivar la categoría?",
      mensaje: c.activa
        ? `"${c.nombre}" dejará de aparecer al registrar un negocio. Los negocios que ya la tienen no cambian.`
        : `"${c.nombre}" volverá a aparecer al registrar un negocio.`,
      textoAceptar: c.activa ? "Desactivar" : "Reactivar",
      destructivo: c.activa,
    });
    if (!seguir) return;
    try {
      const respuesta = await editarCategoria(token, c.id, { activa: !c.activa });
      avisar("Listo", respuesta.mensaje, "exito");
      recargar();
    } catch (e) {
      avisarError("Cambiar estado de categoría", e, "No se pudo cambiar");
    }
  };

  const columnas: Columna<CategoriaAdmin>[] = [
    {
      clave: "nombre",
      titulo: "Nombre",
      ancho: 4,
      render: (c) => <Text style={[styles.principal, { color: colors.textPrimary }]}>{c.nombre}</Text>,
    },
    {
      clave: "estado",
      titulo: "Estado",
      ancho: 2,
      render: (c) => (
        <View style={styles.insignia}>
          <Insignia texto={c.activa ? "ACTIVA" : "INACTIVA"} color={c.activa ? COLORES.verde : COLORES.neutro} suave />
        </View>
      ),
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      ancho: 3,
      render: (c) => (
        <View style={styles.acciones}>
          <BotonIcono
            icono="create-outline"
            color={colors.primaryText}
            etiqueta={`Editar ${c.nombre}`}
            ayuda="Cambia el nombre de la categoría"
            onPress={() => setEdicion({ id: c.id, nombre: c.nombre })}
          />
          <Switch
            value={c.activa}
            onValueChange={() => cambiarEstado(c)}
            accessibilityLabel={`${c.nombre}: ${c.activa ? "activa" : "inactiva"}`}
            accessibilityHint={
              c.activa
                ? "Desactiva la categoría: deja de ofrecerse al registrar negocios"
                : "Reactiva la categoría: vuelve a ofrecerse al registrar negocios"
            }
            trackColor={{ false: colors.inputBorder, true: COLORES.verde }}
            thumbColor="#FFFFFF"
          />
        </View>
      ),
    },
  ];

  return (
    <View>
      <Encabezado
        titulo="Categorías"
        subtitulo="Las activas se ofrecen al registrar un negocio. No se borran: se desactivan."
        derecha={
          <Boton
            titulo="NUEVA CATEGORÍA"
            ayuda="Abre el formulario para crear una categoría"
            onPress={() => setEdicion({ id: null, nombre: "" })}
            style={styles.nueva}
          />
        }
      />
      <EstadoCarga cargando={cargando} error={error} hayDatos={datos !== null} onReintentar={recargar}>
        {datos ? (
          <Tabla
            columnas={columnas}
            filas={datos}
            clave={(c) => c.id}
            vacio="Aún no hay categorías."
          />
        ) : null}
      </EstadoCarga>

      {edicion ? (
        <ModalAccion
          titulo={edicion.id ? "Editar categoría" : "Nueva categoría"}
          descripcion="Los negocios que ya tienen esta categoría no cambian."
          textoConfirmar="GUARDAR"
          ayudaConfirmar="Guarda la categoría"
          enviando={enviando}
          onConfirmar={guardar}
          onCerrar={cerrar}
        >
          <CampoTexto
            etiqueta="Nombre"
            obligatorio
            error={errorNombre}
            ayuda="Máximo 60 caracteres"
            placeholder="ej: Spa de uñas"
            maxLength={60}
            autoCapitalize="sentences"
            value={edicion.nombre}
            onChangeText={(nombre) => {
              setEdicion({ ...edicion, nombre });
              setErrorNombre(null);
            }}
            onSubmitEditing={guardar}
          />
        </ModalAccion>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  principal: { fontSize: 14, fontWeight: "bold" },
  insignia: { alignSelf: "flex-start" },
  acciones: { flexDirection: "row", alignItems: "center", gap: 8 },
  nueva: { minWidth: 0, paddingHorizontal: 16 },
});
