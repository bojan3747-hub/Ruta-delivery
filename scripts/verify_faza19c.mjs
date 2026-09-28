// Faza 19c verifikacija: klijentska strana angažovanja mašina — nova
// stranica /klijent/masine (lista) i /klijent/masine/novo (forma).
import "dotenv/config";
import { chromium } from "playwright";
import { Client } from "pg";

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

// Skripta mora biti idempotentna preko više pokretanja — očisti zahteve
// test-klijenta ostavljene od prethodnog pokretanja.
async function resetTestData() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `DELETE FROM machine_requests WHERE client_id IN (
         SELECT c.id FROM companies c JOIN users u ON u.id = c.user_id
         WHERE u.email = 'klijent1@ruta.rs'
       )`
    );
  } finally {
    await client.end();
  }
}

async function main() {
  await resetTestData();
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/prijava`);
  await p.fill('input[name="email"]', "klijent1@ruta.rs");
  await p.fill('input[name="password"]', "lozinka123");
  await p.click('button[type="submit"]');
  await p.waitForURL(`${BASE}/klijent`);

  // === Nav stavka postoji i vodi na listu ===
  await p.click('a:has-text("Angažovanje mašina")');
  await p.waitForURL(`${BASE}/klijent/masine`);
  check("lista angažovanja prikazuje prazno stanje", (await p.locator("body").innerText()).includes("Još nemate zahteva"));

  // === Forma: novo angažovanje ===
  await p.click('a:has-text("Novo angažovanje")');
  await p.waitForURL(`${BASE}/klijent/masine/novo`);

  const allZones = await p.locator('select[name="zona"] option').count();
  check("zona select ima opcije (uključujući placeholder)", allZones > 1, `nađeno ${allZones}`);

  await p.selectOption('select[name="zona"]', "NOVI_BEOGRAD");
  // AddressPicker spaja Ulica+Broj u skriveno input[name="adresa"] pre slanja.
  await p.fill('input[name="adresaUlica"]', "Bulevar Mihajla Pupina");
  await p.fill('input[name="adresaBroj"]', "10");
  await p.selectOption('select[name="tipMasine"]', "MINI_BAGER");
  const opis = "Potrebno kopanje temelja za garažu, pristup je uzak, mašina manjih dimenzija.";
  await p.fill('textarea[name="opisPosla"]', opis);
  await p.fill('input[name="zeljeniTermin"]', "sledeće nedelje");
  await p.fill('textarea[name="napomena"]', "Ima mesta za parkiranje ispred kapije.");
  // Kontakt polja su prefilled iz naloga — samo proveravamo da nisu prazna.
  const kontaktIme = await p.locator('input[name="kontaktIme"]').inputValue();
  check("kontakt ime je prefilled iz naloga", kontaktIme.length > 0);

  await p.click('button:has-text("Pošalji zahtev")');
  await p.waitForURL(/\/klijent\/masine\?novo=/, { timeout: 10000 }).catch(() => {});
  check("posle slanja zahteva redirect na listu", p.url().startsWith(`${BASE}/klijent/masine?novo=`), `stiglo na ${p.url()}`);

  // === Lista sad prikazuje novi zahtev ===
  const listText = await p.locator("body").innerText();
  check("lista prikazuje tip mašine", listText.includes("Mini bager"));
  check("lista prikazuje zonu", listText.includes("Novi Beograd"));
  check("lista prikazuje opis posla", listText.includes(opis));
  check("lista prikazuje status 'Otvoren'", listText.includes("Otvoren"));
  check("dugme za otkazivanje je vidljivo za otvoren zahtev", (await p.locator('button:has-text("Otkaži zahtev")').count()) === 1);

  // === Validacija: prazan obavezan opis posla se odbija ===
  await p.goto(`${BASE}/klijent/masine/novo`);
  await p.selectOption('select[name="zona"]', "ZEMUN");
  await p.fill('input[name="adresaUlica"]', "Neka adresa");
  await p.fill('input[name="adresaBroj"]', "5");
  await p.selectOption('select[name="tipMasine"]', "VALJAK");
  // opisPosla ostaje prazno — HTML required bi trebalo da spreči submit,
  // ali server-side validacija je ono što stvarno štitimo (vidi
  // src/lib/validation.ts komentar o HTML atributima). Uklanjamo required
  // SAMO sa ovog polja (ne sa celog forma) — uklanjanje sa kontrolisanih
  // React polja (npr. Ulica u AddressPicker) zna da se vrati nazad na
  // sledeći re-render tog child komponenta (debounce za autocomplete).
  await p.evaluate(() => {
    document.querySelector('textarea[name="opisPosla"]')?.removeAttribute("required");
  });
  await p.click('button:has-text("Pošalji zahtev")');
  await p.waitForTimeout(500);
  check(
    "server odbija zahtev bez opisa posla",
    (await p.locator("text=Popunite sva obavezna polja").count()) >= 1
  );

  // === Otkazivanje zahteva ===
  await p.goto(`${BASE}/klijent/masine`);
  p.once("dialog", (d) => d.accept());
  await p.click('button:has-text("Otkaži zahtev")');
  await p.waitForTimeout(1000);
  const afterCancelText = await p.locator("body").innerText();
  check("posle otkazivanja status postaje 'Otkazano'", afterCancelText.includes("Otkazano"));
  check(
    "otkazan zahtev više nema dugme za otkazivanje",
    (await p.locator('button:has-text("Otkaži zahtev")').count()) === 0
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
