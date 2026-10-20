import { request } from "../../services/api/http";

// Elimina la cuenta (administradora o cliente) y sus datos personales.
// Una administradora única necesita eliminarNegocio para cerrar también el negocio.
export const eliminarCuenta = (token: string, clave: string, eliminarNegocio = false) =>
  request<{ mensaje: string }>("/api/v1/cuentas/eliminar", {
    method: "POST",
    body: { clave, eliminarNegocio },
    token,
  });
