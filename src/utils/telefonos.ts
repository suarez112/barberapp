import {
  AsYouType,
  CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js/max";

// Teléfonos con libphonenumber-js (metadatos completos), con las mismas reglas del
// backend (src/shared/telefonos.ts): se envían en E.164 ("+573162781393").

export const PAIS_POR_DEFECTO: CountryCode = "CO";

export const TELEFONO_INVALIDO =
  "El número no es válido para el país elegido. Revisa los dígitos o cambia la bandera (ej: 316 278 1393 para Colombia).";

const MAXIMO_DIGITOS = 15;

export const soloDigitos = (texto: string) => texto.replace(/\D/g, "");

// Bandera como imagen pequeña (los emoji de bandera no se dibujan en Windows ni en la web:
// salen como letras, ej. "co"). Imágenes de flagcdn.com por código ISO, a doble tamaño
// para pantallas nítidas; el componente <Bandera> las muestra.
export const urlBandera = (pais: string) =>
  `https://flagcdn.com/w80/${pais.toLowerCase()}.png`;

export const indicativoDe = (pais: CountryCode) => getCountryCallingCode(pais);

// Igual que normalizarTelefono() del backend: con "+" se usa su propio código de país;
// sin "+", el indicativo recibido (Colombia por defecto), y también se acepta el
// número con el indicativo pegado ("573001234567"). null = inválido.
export const normalizarTelefono = (
  telefono: string,
  indicativo: string = indicativoDe(PAIS_POR_DEFECTO),
): { telefono: string; indicativo: string } | null => {
  const texto = telefono.trim();
  const digitos = soloDigitos(texto);
  if (!digitos || digitos.length > MAXIMO_DIGITOS) return null;

  const candidatos = texto.startsWith("+")
    ? [`+${digitos}`]
    : [`+${indicativo}${digitos}`, ...(digitos.startsWith(indicativo) ? [`+${digitos}`] : [])];

  for (const candidato of candidatos) {
    const numero = parsePhoneNumberFromString(candidato);
    if (numero?.isValid()) return { telefono: numero.number, indicativo: numero.countryCallingCode };
  }
  return null;
};

// Colombia se agrupa 3-3-4 ("316 278 1393"); libphonenumber lo deja en "316 2781393"
const formatoColombia = (digitos: string) =>
  [digitos.slice(0, 3), digitos.slice(3, 6), digitos.slice(6)].filter(Boolean).join(" ");

// Número nacional mientras se escribe: "3162781393" -> "316 278 1393"
export const formatearMientrasEscribe = (pais: CountryCode, digitos: string) => {
  const d = digitos.slice(0, MAXIMO_DIGITOS);
  if (!d) return "";
  if (pais === "CO" && d.length <= 10) return formatoColombia(d);
  return new AsYouType(pais).input(d);
};

// Si el texto trae el código del país ("+52 55 1234 5678" o "0052…"), devuelve el
// país y el número nacional. null si no empieza así o no se reconoce el país.
export const separarPais = (
  texto: string,
): { pais: CountryCode; digitos: string } | null => {
  const t = texto.trim();
  if (!t.startsWith("+") && !t.startsWith("00")) return null;
  const digitos = t.startsWith("+") ? soloDigitos(t) : soloDigitos(t).slice(2);
  const formateador = new AsYouType();
  formateador.input(`+${digitos}`);
  const pais = formateador.getCountry();
  if (!pais) return null;
  return { pais, digitos: digitos.slice(formateador.getCallingCode()?.length ?? 0) };
};

// Teléfono guardado para mostrar: "+573162781393" -> { pais: "CO", texto: "+57 316 278 1393" }.
// Los antiguos (solo dígitos) se arman con su indicativo; si no se entienden, tal cual (sin país).
export const telefonoMostrado = (
  telefono?: string | null,
  indicativo?: string | null,
): { pais: CountryCode | null; texto: string } => {
  const tel = (telefono ?? "").trim();
  if (!tel) return { pais: null, texto: "" };
  const digitos = soloDigitos(tel);
  const e164 = tel.startsWith("+") ? `+${digitos}` : indicativo ? `+${indicativo}${digitos}` : null;
  const numero = e164 ? parsePhoneNumberFromString(e164) : undefined;
  if (!numero?.isValid()) {
    return { pais: null, texto: indicativo && !tel.startsWith("+") ? `+${indicativo} ${tel}` : tel };
  }
  const nacional =
    numero.country === "CO" ? formatoColombia(numero.nationalNumber) : numero.formatNational();
  return { pais: numero.country ?? null, texto: `+${numero.countryCallingCode} ${nacional}` };
};
