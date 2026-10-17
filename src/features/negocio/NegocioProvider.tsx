import { ReactNode, useState } from "react";
import { Barbero, Empresa, Producto, Servicio } from "../../types";
import { crearContexto } from "../../utils/crearContexto";
import { DatosNegocio } from "./api";

type ValorNegocio = {
  empresa: Empresa | null;
  barberos: Barbero[];
  servicios: Servicio[];
  productos: Producto[];
  abrirNegocio: (datos: DatosNegocio) => void;
  salirDelNegocio: () => void;
  setBarberos: (barberos: Barbero[]) => void;
  setServicios: (servicios: Servicio[]) => void;
  setProductos: (productos: Producto[]) => void;
};

const [NegocioContext, useNegocio] = crearContexto<ValorNegocio>("Negocio");
export { useNegocio };

// Negocio que se está viendo (como cliente o como integrante del equipo)
export function NegocioProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const abrirNegocio = (datos: DatosNegocio) => {
    setEmpresa(datos.empresa);
    setBarberos(datos.barberos);
    setServicios(datos.servicios);
  };

  const salirDelNegocio = () => setEmpresa(null);

  return (
    <NegocioContext
      value={{
        empresa,
        barberos,
        servicios,
        productos,
        abrirNegocio,
        salirDelNegocio,
        setBarberos,
        setServicios,
        setProductos,
      }}
    >
      {children}
    </NegocioContext>
  );
}
