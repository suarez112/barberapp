import { ClienteRegistrado, ElementoListaNegra } from "../types";

// Datos de demostración mientras clientes y lista negra no vienen del backend

export const CLIENTES_INICIALES: ClienteRegistrado[] = [
  {
    telefono: "3109876543",
    nombre: "Carlos Mendoza",
    fechaUltimaCita: "2026-10-08",
    totalCitas: 3,
  },
  {
    telefono: "3112223344",
    nombre: "Andrés Gomez",
    fechaUltimaCita: "2026-09-15",
    totalCitas: 1,
  },
  {
    telefono: "3001112233",
    nombre: "Laura Restrepo",
    fechaUltimaCita: "2026-08-01",
    totalCitas: 0,
  },
];

export const LISTA_NEGRA_INICIAL: ElementoListaNegra[] = [
  { id: "1", nombre: "Laura Restrepo", telefono: "3001112233" },
  { id: "2", nombre: "Carlos Mendoza", telefono: "3109876543" },
];
