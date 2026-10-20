export type Punto = { latitude: number; longitude: number };

export type PropsMapa = {
  punto: Punto | null;
  // Sube cada vez que el pin llega desde el GPS o de coordenadas pegadas
  centrar: number;
  onMover: (p: Punto) => void;
};
