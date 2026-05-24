export const ZONAS = [
  "Centro",
  "Pocitos",
  "Cordón",
  "Punta Carretas",
  "Carrasco",
  "Buceo",
  "Malvín",
  "Prado",
  "La Blanqueada",
  "Maroñas",
  "Sayago",
  "Colón",
  "Otro",
] as const;

export type Zona = (typeof ZONAS)[number];

export function isValidZona(value: string): value is Zona {
  return (ZONAS as readonly string[]).includes(value);
}
