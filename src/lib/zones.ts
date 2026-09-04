import type { Zone } from "./types";

export const ZONES: Zone[] = [
  "STARI_GRAD",
  "VRACAR",
  "SAVSKI_VENAC",
  "NOVI_BEOGRAD",
  "ZEMUN",
  "ZVEZDARA",
  "VOZDOVAC",
  "CUKARICA",
  "PALILULA",
  "RAKOVICA",
];

export const ZONE_LABELS: Record<Zone, string> = {
  STARI_GRAD: "Stari grad",
  VRACAR: "Vračar",
  SAVSKI_VENAC: "Savski venac",
  NOVI_BEOGRAD: "Novi Beograd",
  ZEMUN: "Zemun",
  ZVEZDARA: "Zvezdara",
  VOZDOVAC: "Voždovac",
  CUKARICA: "Čukarica",
  PALILULA: "Palilula",
  RAKOVICA: "Rakovica",
};

// Approximate driving distances (km) between Belgrade municipalities, used
// only to produce a plausible auto-quote for the MVP — not routing-accurate.
const PAIR_DISTANCES: [Zone, Zone, number][] = [
  ["STARI_GRAD", "VRACAR", 3],
  ["STARI_GRAD", "SAVSKI_VENAC", 3],
  ["STARI_GRAD", "NOVI_BEOGRAD", 5],
  ["STARI_GRAD", "ZEMUN", 9],
  ["STARI_GRAD", "ZVEZDARA", 5],
  ["STARI_GRAD", "VOZDOVAC", 7],
  ["STARI_GRAD", "CUKARICA", 8],
  ["STARI_GRAD", "PALILULA", 4],
  ["STARI_GRAD", "RAKOVICA", 9],
  ["VRACAR", "SAVSKI_VENAC", 4],
  ["VRACAR", "NOVI_BEOGRAD", 7],
  ["VRACAR", "ZEMUN", 11],
  ["VRACAR", "ZVEZDARA", 4],
  ["VRACAR", "VOZDOVAC", 5],
  ["VRACAR", "CUKARICA", 10],
  ["VRACAR", "PALILULA", 6],
  ["VRACAR", "RAKOVICA", 7],
  ["SAVSKI_VENAC", "NOVI_BEOGRAD", 4],
  ["SAVSKI_VENAC", "ZEMUN", 8],
  ["SAVSKI_VENAC", "ZVEZDARA", 7],
  ["SAVSKI_VENAC", "VOZDOVAC", 6],
  ["SAVSKI_VENAC", "CUKARICA", 5],
  ["SAVSKI_VENAC", "PALILULA", 7],
  ["SAVSKI_VENAC", "RAKOVICA", 8],
  ["NOVI_BEOGRAD", "ZEMUN", 5],
  ["NOVI_BEOGRAD", "ZVEZDARA", 10],
  ["NOVI_BEOGRAD", "VOZDOVAC", 11],
  ["NOVI_BEOGRAD", "CUKARICA", 7],
  ["NOVI_BEOGRAD", "PALILULA", 8],
  ["NOVI_BEOGRAD", "RAKOVICA", 13],
  ["ZEMUN", "ZVEZDARA", 14],
  ["ZEMUN", "VOZDOVAC", 15],
  ["ZEMUN", "CUKARICA", 9],
  ["ZEMUN", "PALILULA", 11],
  ["ZEMUN", "RAKOVICA", 16],
  ["ZVEZDARA", "VOZDOVAC", 6],
  ["ZVEZDARA", "CUKARICA", 12],
  ["ZVEZDARA", "PALILULA", 6],
  ["ZVEZDARA", "RAKOVICA", 10],
  ["VOZDOVAC", "CUKARICA", 9],
  ["VOZDOVAC", "PALILULA", 11],
  ["VOZDOVAC", "RAKOVICA", 5],
  ["CUKARICA", "PALILULA", 12],
  ["CUKARICA", "RAKOVICA", 7],
  ["PALILULA", "RAKOVICA", 13],
];

const SAME_ZONE_KM = 3;

function buildDistanceMatrix(): Record<string, number> {
  const matrix: Record<string, number> = {};
  for (const zone of ZONES) {
    matrix[`${zone}|${zone}`] = SAME_ZONE_KM;
  }
  for (const [a, b, km] of PAIR_DISTANCES) {
    matrix[`${a}|${b}`] = km;
    matrix[`${b}|${a}`] = km;
  }
  return matrix;
}

const DISTANCE_MATRIX = buildDistanceMatrix();

export function distanceKm(a: Zone, b: Zone): number {
  return DISTANCE_MATRIX[`${a}|${b}`] ?? SAME_ZONE_KM;
}
