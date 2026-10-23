// Faza 23 verifikacija: landing page se ne vodi kroz "firme" u prvi plan —
// pojedinci (fizička lica) treba da budu ravnopravno predstavljeni na
// svim mestima koja su ranije bila firma-centrična (H1, hero pasus, "Koji
// problem rešavamo", kartica "Napravljeno za firme", CTA za dostavljače).
// Namerno BEZ izmene šeme/funkcionalnosti — čisto landing page kopija.
import "dotenv/config";
import { chromium } from "playwright";

const BASE = "http://localhost:3100";
let failures = 0;

function check(name, cond, extra) {
  if (cond) {
    console.log(`OK   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${extra ? " -- " + extra : ""}`);
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`${BASE}/`);
  await anon.waitForLoadState("networkidle");
  const anonText = await anon.locator("body").innerText();

  // === H1: "za firme" izbačeno, ostaje neutralan ===
  check(
    "H1 NE sadrži 'za firme'",
    !anonText.includes("Kombi prevoz i dostava za firme")
  );
  check(
    "H1 sad glasi 'Kombi prevoz i dostava u Beogradu'",
    anonText.includes("Kombi prevoz i dostava") && anonText.includes("u Beogradu")
  );

  // === Hero pasus: uključuje i firmu i pojedinca ===
  check(
    "hero pasus pominje 'firmi ili pojedincu'",
    anonText.includes("firmi ili pojedincu")
  );
  check(
    "hero pasus NE kaže 'napravljena za firme kojima'",
    !anonText.includes("napravljena za firme kojima")
  );

  // === "Koji problem rešavamo": firme i pojedinci ravnopravno ===
  check(
    "'Koji problem rešavamo' pominje i firme i pojedince",
    anonText.includes("I firmama i pojedincima dostava je retko potpuno predvidljiva")
  );
  check(
    "stari tekst 'Firmama je dostava retko' je zamenjen",
    !anonText.includes("Firmama je dostava retko potpuno predvidljiva")
  );

  // === Kartica preimenovana ===
  check(
    "kartica 'Jednostavno za sve' prisutna (zamena za 'Napravljeno za firme')",
    anonText.includes("Jednostavno za sve")
  );
  check(
    "stari naziv kartice 'Napravljeno za firme' više ne postoji",
    !anonText.includes("Napravljeno za firme")
  );
  check(
    "tekst kartice pominje 'firme ili fizičkog lica'",
    anonText.includes("firme ili fizičkog lica")
  );

  // === CTA sekcija za dostavljače: firme i pojedinci kao klijenti ===
  check(
    "CTA za dostavljače pominje 'Firmama i pojedincima u Beogradu'",
    anonText.includes("Firmama i pojedincima u Beogradu treba prevoz")
  );

  // === Regresija: neutralni bedž i sekcija za mašine ostaju netaknuti ===
  // Bedž koristi CSS `uppercase` (text-transform), pa `innerText` vraća
  // vizuelno velika slova iako je izvorni JSX string mešovite veličine —
  // poređenje mora biti case-insensitive (isti obrazac kao u
  // verify_faza19f.mjs).
  check(
    "bedž 'Dostava za firme i pojedince' i dalje prisutan (nepromenjen)",
    anonText.toLowerCase().includes("dostava za firme i pojedince")
  );
  check(
    "napomena 'Dostupno i za firme i za fizička lica' (mašine) i dalje prisutna",
    anonText.includes("Dostupno i za firme i za fizička lica")
  );

  // === Regresija: forma za prijavu dostavljača/izvođača i dalje radi ===
  check(
    "forma 'Prijavite se za saradnju' i dalje prisutna",
    anonText.includes("Prijavite se za saradnju")
  );

  console.log(`\n${failures === 0 ? "SVI TESTOVI PROŠLI" : failures + " TEST(OVA) NIJE PROŠAO"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
