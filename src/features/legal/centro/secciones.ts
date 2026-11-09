import { Ionicons } from "@expo/vector-icons";
import { Href } from "expo-router";
import { ComponentProps } from "react";
import { fechaColombiaISO, fechaLarga } from "@/utils/fechas";
import { DocumentoLegal, TipoDocumento } from "../api";

// Entradas del Centro Legal (/legales). Los nombres son solo para el menú: el título,
// la versión y la fecha de cada documento salen de lo que responde el backend.
export type EntradaLegal = {
  clave: TipoDocumento | "pqrs";
  ruta: Href;
  nombre: string;
  descripcion: string;
  icono: ComponentProps<typeof Ionicons>["name"];
};

export const ENTRADAS_LEGALES: EntradaLegal[] = [
  {
    clave: "terminos",
    ruta: "/legales/terminos",
    nombre: "Términos y Condiciones",
    descripcion: "Reglas de uso de la plataforma para negocios y clientes",
    icono: "document-text-outline",
  },
  {
    clave: "politica-datos",
    ruta: "/legales/politica-de-datos",
    nombre: "Política de Tratamiento de Datos",
    descripcion: "Qué datos tratamos, para qué y cómo ejercer tus derechos",
    icono: "shield-checkmark-outline",
  },
  {
    clave: "aviso-privacidad",
    ruta: "/legales/aviso-privacidad",
    nombre: "Aviso de Privacidad",
    descripcion: "Resumen corto de cómo tratamos tus datos",
    icono: "eye-outline",
  },
  {
    clave: "pqrs",
    ruta: "/pqrs",
    nombre: "PQRS",
    descripcion: "Peticiones, quejas, reclamos y sugerencias",
    icono: "chatbox-ellipses-outline",
  },
];

// "2026-11-05" o "2026-10-20T17:52:40.471Z" -> "5 de noviembre de 2026" (fecha de Colombia);
// null si no es una fecha válida
function fechaColombia(valor: string) {
  const soloFecha = /^\d{4}-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) {
    const [mes, dia] = [Number(soloFecha[1]), Number(soloFecha[2])];
    return mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 ? fechaLarga(valor) : null;
  }
  const ms = Date.parse(valor);
  return Number.isNaN(ms) ? null : fechaLarga(fechaColombiaISO(ms));
}

// "Vigente desde el 5 de noviembre de 2026"; null si el backend no envía vigenteDesde
export function textoVigencia(documento: DocumentoLegal) {
  const vigente = documento.vigenteDesde ? fechaColombia(documento.vigenteDesde) : null;
  return vigente ? `Vigente desde el ${vigente}` : null;
}

// Fecha que se muestra bajo el título: la de vigencia si el backend la envía;
// si no, la de publicación (con su nombre, para no hacerla pasar por la de vigencia)
export function textoFecha(documento: DocumentoLegal) {
  const vigente = textoVigencia(documento);
  if (vigente) return vigente;
  const publicado = fechaColombia(documento.publicadoEn);
  return publicado ? `Publicado el ${publicado}` : null;
}
