import type { CountryCode } from "libphonenumber-js/max";

// Países del selector de teléfono (código ISO y nombre en español). Colombia
// primero (es el predeterminado); el indicativo y la bandera salen del código.
export interface Pais {
  codigo: CountryCode;
  nombre: string;
}

export const PAISES: Pais[] = [
  { codigo: "CO", nombre: "Colombia" },
  { codigo: "VE", nombre: "Venezuela" },
  { codigo: "EC", nombre: "Ecuador" },
  { codigo: "PE", nombre: "Perú" },
  { codigo: "PA", nombre: "Panamá" },
  { codigo: "MX", nombre: "México" },
  { codigo: "US", nombre: "Estados Unidos" },
  { codigo: "ES", nombre: "España" },
  { codigo: "AR", nombre: "Argentina" },
  { codigo: "AW", nombre: "Aruba" },
  { codigo: "BO", nombre: "Bolivia" },
  { codigo: "BR", nombre: "Brasil" },
  { codigo: "CA", nombre: "Canadá" },
  { codigo: "CL", nombre: "Chile" },
  { codigo: "CR", nombre: "Costa Rica" },
  { codigo: "CU", nombre: "Cuba" },
  { codigo: "CW", nombre: "Curazao" },
  { codigo: "DO", nombre: "República Dominicana" },
  { codigo: "SV", nombre: "El Salvador" },
  { codigo: "GT", nombre: "Guatemala" },
  { codigo: "HN", nombre: "Honduras" },
  { codigo: "NI", nombre: "Nicaragua" },
  { codigo: "PY", nombre: "Paraguay" },
  { codigo: "PR", nombre: "Puerto Rico" },
  { codigo: "UY", nombre: "Uruguay" },
  { codigo: "DE", nombre: "Alemania" },
  { codigo: "BE", nombre: "Bélgica" },
  { codigo: "FR", nombre: "Francia" },
  { codigo: "NL", nombre: "Países Bajos" },
  { codigo: "IT", nombre: "Italia" },
  { codigo: "PT", nombre: "Portugal" },
  { codigo: "GB", nombre: "Reino Unido" },
  { codigo: "CH", nombre: "Suiza" },
  { codigo: "SE", nombre: "Suecia" },
  { codigo: "AU", nombre: "Australia" },
  { codigo: "CN", nombre: "China" },
  { codigo: "IN", nombre: "India" },
  { codigo: "IL", nombre: "Israel" },
  { codigo: "JP", nombre: "Japón" },
];

// Nombre del país, o su código si no está en la lista (ej. detectado por "+…")
export const nombrePais = (codigo: CountryCode) =>
  PAISES.find((p) => p.codigo === codigo)?.nombre ?? codigo;
