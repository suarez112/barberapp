import { encode } from "uqr";

// Código QR como imagen PNG, hecho aquí mismo (sin canvas ni módulos nativos):
// sirve igual en el celular y en la web, tanto para mostrarlo como para guardarlo.

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const adler32 = (bytes: Uint8Array) => {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
};

const entero32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

// Un bloque del PNG: largo + tipo + datos + CRC
const bloque = (tipo: string, datos: Uint8Array) => {
  const cuerpo = new Uint8Array(4 + datos.length);
  for (let i = 0; i < 4; i++) cuerpo[i] = tipo.charCodeAt(i);
  cuerpo.set(datos, 4);
  return [...entero32(datos.length), ...cuerpo, ...entero32(crc32(cuerpo))];
};

// PNG en grises, 8 bits, con la compresión "sin comprimir" de zlib (suficiente para un QR)
function codificarPng(ancho: number, pixeles: Uint8Array): Uint8Array {
  const filas = new Uint8Array((ancho + 1) * ancho);
  for (let y = 0; y < ancho; y++) {
    filas.set(pixeles.subarray(y * ancho, (y + 1) * ancho), y * (ancho + 1) + 1);
  }
  const zlib: number[] = [0x78, 0x01];
  for (let i = 0; i < filas.length; i += 65535) {
    const trozo = filas.subarray(i, Math.min(i + 65535, filas.length));
    const ultimo = i + 65535 >= filas.length ? 1 : 0;
    zlib.push(ultimo, trozo.length & 255, trozo.length >>> 8, ~trozo.length & 255, (~trozo.length >>> 8) & 255);
    for (let j = 0; j < trozo.length; j++) zlib.push(trozo[j]);
  }
  zlib.push(...entero32(adler32(filas)));

  const cabecera = new Uint8Array([...entero32(ancho), ...entero32(ancho), 8, 0, 0, 0, 0]);
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
    ...bloque("IHDR", cabecera),
    ...bloque("IDAT", new Uint8Array(zlib)),
    ...bloque("IEND", new Uint8Array(0)),
  ]);
}

// PNG del QR de un texto: módulos negros sobre fondo blanco con el margen que piden los lectores
export function qrPng(texto: string, pixelesPorModulo = 10): Uint8Array {
  const modulos = encode(texto, { ecc: "M", border: 3 }).data;
  const lado = modulos.length * pixelesPorModulo;
  const pixeles = new Uint8Array(lado * lado);
  for (let y = 0; y < lado; y++) {
    const fila = modulos[Math.floor(y / pixelesPorModulo)];
    for (let x = 0; x < lado; x++) {
      pixeles[y * lado + x] = fila[Math.floor(x / pixelesPorModulo)] ? 0 : 255;
    }
  }
  return codificarPng(lado, pixeles);
}

export function aBase64(bytes: Uint8Array): string {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binario);
}
