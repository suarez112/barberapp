// Indicativos telefónicos disponibles al agendar. Colombia es el predeterminado.
export interface Pais {
  indicativo: string; // solo dígitos, sin "+"
  nombre: string;
}

export const INDICATIVO_POR_DEFECTO = "57";

export const PAISES: Pais[] = [
  { indicativo: "57", nombre: "Colombia" },
  { indicativo: "58", nombre: "Venezuela" },
  { indicativo: "593", nombre: "Ecuador" },
  { indicativo: "51", nombre: "Perú" },
  { indicativo: "507", nombre: "Panamá" },
  { indicativo: "52", nombre: "México" },
  { indicativo: "56", nombre: "Chile" },
  { indicativo: "54", nombre: "Argentina" },
  { indicativo: "1", nombre: "Estados Unidos / Canadá" },
  { indicativo: "34", nombre: "España" },
  { indicativo: "55", nombre: "Brasil" },
  { indicativo: "506", nombre: "Costa Rica" },
  { indicativo: "502", nombre: "Guatemala" },
  { indicativo: "503", nombre: "El Salvador" },
  { indicativo: "504", nombre: "Honduras" },
  { indicativo: "505", nombre: "Nicaragua" },
  { indicativo: "591", nombre: "Bolivia" },
  { indicativo: "595", nombre: "Paraguay" },
  { indicativo: "598", nombre: "Uruguay" },
  { indicativo: "44", nombre: "Reino Unido" },
  { indicativo: "33", nombre: "Francia" },
  { indicativo: "39", nombre: "Italia" },
  { indicativo: "49", nombre: "Alemania" },
  { indicativo: "351", nombre: "Portugal" },
];

// Si el texto empieza con "+" o "00" (ej: "+52 55 1234 5678"), separa el
// indicativo del número. Devuelve null si no empieza así o el país no está en la lista.
export const separarIndicativo = (
  texto: string,
): { indicativo: string; telefono: string } | null => {
  const t = texto.trim();
  if (!t.startsWith("+") && !t.startsWith("00")) return null;
  let digitos = t.replace(/\D/g, "");
  if (!t.startsWith("+")) digitos = digitos.replace(/^00/, "");
  const pais = [...PAISES]
    .sort((a, b) => b.indicativo.length - a.indicativo.length)
    .find((p) => digitos.startsWith(p.indicativo));
  if (!pais) return null;
  return {
    indicativo: pais.indicativo,
    telefono: digitos.slice(pais.indicativo.length),
  };
};

// Reglas aproximadas de celulares (largo nacional y primer dígito) para adivinar
// el país mientras se escribe, sin "+". Es una pista, no una certeza: varios países
// comparten formato (ej. México y EE. UU.). Los países sin regla solo se eligen a mano.
const REGLAS_CELULAR: Record<
  string,
  { largo: number; primero: RegExp; prefijos?: string[] }
> = {
  "57": { largo: 10, primero: /[3]/ },
  "52": { largo: 10, primero: /[2-9]/ },
  "58": {
    largo: 10,
    primero: /[4]/,
    prefijos: ["412", "414", "416", "424", "426"],
  },
  "51": { largo: 9, primero: /[9]/ },
  "56": { largo: 9, primero: /[9]/ },
  "1": { largo: 10, primero: /[2-9]/ },
  "34": { largo: 9, primero: /[67]/ },
  "507": { largo: 8, primero: /[6]/ },
  "55": { largo: 11, primero: /[1-9]/ },
};
// Orden de preferencia cuando varios países encajan con lo escrito
const PRIORIDAD_DETECCION = [
  "57",
  "58",
  "52",
  "51",
  "56",
  "1",
  "34",
  "507",
  "55",
];

export const detectarIndicativo = (digitos: string): string => {
  if (!digitos) return INDICATIVO_POR_DEFECTO;
  const compatibles = PRIORIDAD_DETECCION.filter((ind) => {
    const r = REGLAS_CELULAR[ind];
    if (digitos.length > r.largo || !r.primero.test(digitos[0])) return false;
    // Si el país tiene prefijos conocidos, lo escrito debe encajar con alguno
    if (r.prefijos) {
      const inicio = digitos.slice(0, 3);
      return r.prefijos.some((pf) => pf.startsWith(inicio));
    }
    return true;
  });
  // Si lo escrito no encaja con ningún formato conocido, se deja Colombia
  if (compatibles.length === 0) return INDICATIVO_POR_DEFECTO;
  // Colombia manda si encaja; si no, se prefieren los que ya completaron su largo
  if (compatibles.includes(INDICATIVO_POR_DEFECTO))
    return INDICATIVO_POR_DEFECTO;
  const exactos = compatibles.filter(
    (ind) => REGLAS_CELULAR[ind].largo === digitos.length,
  );
  return (exactos.length > 0 ? exactos : compatibles)[0];
};
