import { ReactNode, useState } from "react";
import { CLIENTES_INICIALES, LISTA_NEGRA_INICIAL } from "../../data/mocks";
import { ClienteRegistrado, ElementoListaNegra } from "../../types";
import { crearContexto } from "../../utils/crearContexto";
import { normalizar } from "../../utils/formato";

type DatosReserva = {
  telefono: string;
  indicativo: string;
  nombre: string;
  fecha: string;
};

type ValorClientes = {
  clientes: ClienteRegistrado[];
  listaNegra: ElementoListaNegra[];
  // Suma la cita al historial del cliente (o lo registra si es nuevo)
  registrarReserva: (datos: DatosReserva) => void;
  telefonoEnListaNegra: (telefono: string) => boolean;
  // Coincide por teléfono o por nombre
  estaBloqueado: (nombre: string, telefono: string) => boolean;
  bloquear: (nombre: string, telefono: string) => void;
  desbloquear: (nombre: string, telefono: string) => void;
  quitarDeListaNegra: (id: string) => void;
};

const [ClientesContext, useClientes] = crearContexto<ValorClientes>("Clientes");
export { useClientes };

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] =
    useState<ClienteRegistrado[]>(CLIENTES_INICIALES);
  const [listaNegra, setListaNegra] =
    useState<ElementoListaNegra[]>(LISTA_NEGRA_INICIAL);

  const registrarReserva = ({
    telefono,
    indicativo,
    nombre,
    fecha,
  }: DatosReserva) =>
    setClientes((prev) => {
      const existe = prev.some((c) => c.telefono.trim() === telefono);
      if (!existe) {
        return [
          ...prev,
          { telefono, indicativo, nombre, fechaUltimaCita: fecha, totalCitas: 1 },
        ];
      }
      return prev.map((c) =>
        c.telefono.trim() === telefono
          ? { ...c, fechaUltimaCita: fecha, totalCitas: (c.totalCitas || 0) + 1 }
          : c,
      );
    });

  const telefonoEnListaNegra = (telefono: string) =>
    listaNegra.some(
      (item) => item.telefono.toLowerCase() === normalizar(telefono),
    );

  const coincide = (
    item: ElementoListaNegra,
    nombre: string,
    telefono: string,
  ) =>
    normalizar(item.telefono) === normalizar(telefono) ||
    normalizar(item.nombre) === normalizar(nombre);

  const estaBloqueado = (nombre: string, telefono: string) =>
    listaNegra.some((item) => coincide(item, nombre, telefono));

  const bloquear = (nombre: string, telefono: string) =>
    setListaNegra((prev) => [
      ...prev,
      { id: Date.now().toString(), nombre, telefono },
    ]);

  const desbloquear = (nombre: string, telefono: string) =>
    setListaNegra((prev) =>
      prev.filter(
        (item) =>
          normalizar(item.telefono) !== normalizar(telefono) &&
          normalizar(item.nombre) !== normalizar(nombre),
      ),
    );

  const quitarDeListaNegra = (id: string) =>
    setListaNegra((prev) => prev.filter((item) => item.id !== id));

  return (
    <ClientesContext
      value={{
        clientes,
        listaNegra,
        registrarReserva,
        telefonoEnListaNegra,
        estaBloqueado,
        bloquear,
        desbloquear,
        quitarDeListaNegra,
      }}
    >
      {children}
    </ClientesContext>
  );
}
