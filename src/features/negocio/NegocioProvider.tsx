import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { Barbero, Empresa, Servicio } from "../../types";
import { crearContexto } from "../../utils/crearContexto";
import { DatosNegocio } from "./api";

type ValorNegocio = {
  empresa: Empresa | null;
  barberos: Barbero[];
  servicios: Servicio[];
  abrirNegocio: (datos: DatosNegocio) => void;
  salirDelNegocio: () => void;
  setBarberos: Dispatch<SetStateAction<Barbero[]>>;
  setServicios: Dispatch<SetStateAction<Servicio[]>>;
};

const [NegocioContext, useNegocio] = crearContexto<ValorNegocio>("Negocio");
export { useNegocio };

// Negocio que se está viendo (como cliente o como integrante del equipo)
export function NegocioProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const abrirNegocio = (datos: DatosNegocio) => {
    setEmpresa(datos.empresa);
    setBarberos(datos.barberos);
    setServicios(datos.servicios);
  };

  const salirDelNegocio = () => {
    setEmpresa(null);
    setBarberos([]);
    setServicios([]);
  };

  return (
    <NegocioContext
      value={{
        empresa,
        barberos,
        servicios,
        abrirNegocio,
        salirDelNegocio,
        setBarberos,
        setServicios,
      }}
    >
      {children}
    </NegocioContext>
  );
}
