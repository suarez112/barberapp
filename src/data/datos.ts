import { Dia, EmpresaConfig } from "../types";

// Generador automático de días para octubre de 2026 (del 1 al 31)
const GENERAR_DIAS_OCTUBRE = () => {
  const diasSemanaNombres = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SÁB"];
  const lista: Dia[] = [];
  for (let dia = 1; dia <= 31; dia++) {
    const fecha = new Date(2026, 9, dia);
    const diaNom = diasSemanaNombres[fecha.getDay()];
    const numStr = dia.toString();
    const fechaFull = `2026-10-${dia < 10 ? "0" + dia : dia}`;
    lista.push({
      id: `d_oct_${dia}`,
      diaNom,
      num: numStr,
      fechaFull,
      diaNumero: dia,
    });
  }
  return lista;
};

export const DIAS = GENERAR_DIAS_OCTUBRE();

// AQUÍ SE CONFIGURA CADA NEGOCIO.
// horarioApertura y horarioCierre van en formato de 24 horas ("09:00", "20:00").
export const EMPRESAS_DB: Record<string, EmpresaConfig> = {
  infinity: {
    id: "infinity",
    codigoAcceso: "INFINITY",
    nombre: "INFINITY BARBER",
    colorPrimario: "#EAB308",
    colorSecundario: "#0D0D0D",
    horarioApertura: "09:00",
    horarioCierre: "20:00",
    barberos: [
      {
        id: "b3",
        nombre: "Jhon Álvarez",
        usuario: "jhon",
        clave: "1234",
        esAdmin: true,
        especialidad: "Jefe de Equipo · Cortes modernos",
        equipo: "INFINITY TEAM",
        porcentajeGanancia: 50,
      },
      {
        id: "b1",
        nombre: "Anthonny Beleño",
        usuario: "anthonny",
        clave: "1234",
        esAdmin: false,
        especialidad: "Corte · Barba · Diseño",
        equipo: "INFINITY TEAM",
        porcentajeGanancia: 50,
      },
      {
        id: "b2",
        nombre: "Donny del Valle",
        usuario: "donny",
        clave: "1234",
        esAdmin: false,
        especialidad: "Fade · Barba profesional",
        equipo: "INFINITY TEAM",
        porcentajeGanancia: 45,
      },
    ],
    servicios: [
      {
        id: "s1",
        nombre: "Arreglo de Barba",
        duracion: "15 min",
        precio: 20000,
      },
      {
        id: "s2",
        nombre: "Arreglo barba + pigmentación",
        duracion: "30 min",
        precio: 30000,
      },
      {
        id: "s3",
        nombre: "Corte + asesoría (cliente nuevo)",
        duracion: "50 min",
        precio: 30000,
      },
      { id: "s4", nombre: "Corte + Barba", duracion: "60 min", precio: 40000 },
      { id: "s5", nombre: "Corte + cejas", duracion: "40 min", precio: 28000 },
      {
        id: "s6",
        nombre: "Corte + tinte + barba",
        duracion: "70 min",
        precio: 60000,
      },
      { id: "s7", nombre: "Corte Clásico", duracion: "40 min", precio: 25000 },
      { id: "s8", nombre: "Corte Premium", duracion: "60 min", precio: 50000 },
    ],
  },
  el_bunker: {
    id: "el_bunker",
    codigoAcceso: "BUNKER",
    nombre: "GLAMOUR BEAUTY SALON",
    colorPrimario: "#E11D48",
    colorSecundario: "#0F172A",
    // Ejemplo: este negocio abre distinto a Infinity
    horarioApertura: "09:00",
    horarioCierre: "19:00",
    barberos: [
      {
        id: "b4",
        nombre: "Valeria Rodríguez",
        usuario: "carlos",
        clave: "5678",
        esAdmin: true,
        especialidad: "Directora · Colorimetría y Balayage",
        equipo: "GLAMOUR TEAM",
        porcentajeGanancia: 60,
      },
      {
        id: "b5",
        nombre: "Camila López",
        usuario: "mateo",
        clave: "5678",
        esAdmin: false,
        especialidad: "Stylist · Cepillado y Manicure",
        equipo: "GLAMOUR TEAM",
        porcentajeGanancia: 50,
      },
    ],
    servicios: [
      {
        id: "s101",
        nombre: "Corte de Cabello + Cepillado",
        duracion: "45 min",
        precio: 35000,
      },
      {
        id: "s102",
        nombre: "Balayage / Tintura Glam",
        duracion: "120 min",
        precio: 150000,
      },
      {
        id: "s103",
        nombre: "Manicure Spa + Semipermanente",
        duracion: "40 min",
        precio: 30000,
      },
      {
        id: "s104",
        nombre: "Pedicure Spa Profundo",
        duracion: "45 min",
        precio: 35000,
      },
      {
        id: "s105",
        nombre: "Lifting de Pestañas + Cejas",
        duracion: "50 min",
        precio: 45000,
      },
      {
        id: "s106",
        nombre: "Hidratación Capilar Profunda",
        duracion: "60 min",
        precio: 50000,
      },
    ],
  },
};

export const DIAS_SEMANA_SELECTOR = [
  { clave: "DOM", label: "dom" },
  { clave: "LUN", label: "lun" },
  { clave: "MAR", label: "mar" },
  { clave: "MIE", label: "mié" },
  { clave: "JUE", label: "jue" },
  { clave: "VIE", label: "vie" },
  { clave: "SÁB", label: "sáb" },
];
