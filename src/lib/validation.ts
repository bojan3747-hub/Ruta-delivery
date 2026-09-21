// Faza 14: deljene pomoćne funkcije za validaciju formata unosa na serveru.
//
// VAŽNO: HTML atributi na formama (required, type="email"...) su samo
// kozmetika na frontend-u — bilo ko ko pošalje zahtev direktno (npr. mimo
// naše forme) ih zaobilazi. Server mora nezavisno da proveri format, jer je
// jedino mesto koje korisnik ne kontroliše. Ove funkcije se pozivaju iz
// svih src/lib/actions/*.ts fajlova pre upisa u bazu.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Permisivno za srpske (i strane) brojeve telefona — dozvoljava opcioni +
// na početku, cifre, razmake, crtice, kose crte i zagrade (npr. "064/123-456"
// je uobičajen zapis kod nas). Namerno ne insistiramo na tačnom formatu
// pozivnog broja (fiksni/mobilni se razlikuju), samo odbacujemo očigledno
// netačan unos (slova, prekratak/predugačak niz).
const PHONE_CHARS_RE = /^[0-9+\s()/-]+$/;

// Srpski PIB (poreski identifikacioni broj) je uvek tačno 8 cifara.
const PIB_RE = /^[0-9]{8}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isValidPhone(value: string): boolean {
  if (!PHONE_CHARS_RE.test(value)) return false;
  const digits = value.replace(/[^0-9]/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

export function isValidPib(value: string): boolean {
  return PIB_RE.test(value);
}

// Gornje granice dužine za slobodna tekstualna polja — ne blokiraju
// legitiman unos, samo sprečavaju da neko pošalje ogroman tekst umesto
// očekivanog kratkog polja.
export const MAX_NAME_LEN = 200;
export const MAX_TEXT_LEN = 1000;

export function isTooLong(value: string, max: number): boolean {
  return value.length > max;
}

// Gornje granice za fajlove koje korisnici otpremaju (PDF opštih uslova,
// CSV uvoz, fotografija dostave) — sprečava slučajno (ili namerno)
// otpremanje ogromnog fajla na server.
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
