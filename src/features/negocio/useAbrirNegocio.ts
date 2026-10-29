import { describirError, registrarCausa } from "@/services/api/errores";
import { avisar } from "@/utils/dialogos";
import { useAgenda } from "../agenda/AgendaProvider";
import { validarCodigoEmpresa } from "./api";
import { useNegocio } from "./NegocioProvider";

// Entra a un negocio con su código (lo escribe el cliente o llega en el enlace)
export function useAbrirNegocio() {
  const { abrirNegocio } = useNegocio();
  const { cargarOcupacion } = useAgenda();

  return async (codigoEscrito: string): Promise<boolean> => {
    const codigo = codigoEscrito.trim().toUpperCase();
    if (!codigo) {
      avisar("Código requerido", "Ingresa el código del establecimiento.");
      return false;
    }

    try {
      const datos = await validarCodigoEmpresa(codigo);
      abrirNegocio(datos);
      cargarOcupacion(datos.empresa.id);
      return true;
    } catch (error) {
      registrarCausa("Abrir negocio", error);
      const aviso = describirError(error, {
        titulo: "Código inválido",
        porDefecto: "Establecimiento no encontrado.",
      });
      avisar(aviso.titulo, aviso.mensaje, "error");
      return false;
    }
  };
}
