import { ErrorDeConexion, mensajeDeError } from "@/services/api/http";
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
      if (error instanceof ErrorDeConexion) {
        console.error("Error al conectar con la API:", error.causa);
        avisar(
          "Error de conexión",
          "No fue posible conectar con el servidor backend. Verifica que el servidor esté activo.",
        );
      } else {
        avisar(
          "Código Inválido",
          mensajeDeError(error, "Establecimiento no encontrado."),
        );
      }
      return false;
    }
  };
}
