// Faza 19a verifikacija: B2C registracija (Firma / Fizičko lice).
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
  const ts = Date.now();

  // === Check 1: podrazumevano ("Firma") stanje forme nepromenjeno ===
  const ctx1 = await browser.newContext();
  const p1 = await ctx1.newPage();
  await p1.goto(`${BASE}/registracija`);
  check("Naziv firme polje vidljivo podrazumevano (Firma)", await p1.locator('input[name="naziv"]').count() === 1);
  check("PIB polje vidljivo podrazumevano (Firma)", await p1.locator('input[name="pib"]').count() === 1);
  check("Dugme kaže 'Registruj firmu' podrazumevano", (await p1.locator("body").innerText()).includes("Registruj firmu"));

  // === Check 2: klik na "Fizičko lice" sakriva Naziv firme/PIB ===
  await p1.click('button:has-text("Fizičko lice")');
  check("Naziv firme polje NESTAJE za fizičko lice", await p1.locator('input[name="naziv"]').count() === 0);
  check("PIB polje NESTAJE za fizičko lice", await p1.locator('input[name="pib"]').count() === 0);
  const fizickoText = await p1.locator("body").innerText();
  // Legenda ima CSS uppercase transform, pa innerText vraća "VAŠI PODACI" —
  // provera je zato case-insensitive.
  check(
    "Legenda 'Vaši podaci' prikazana za fizičko lice",
    fizickoText.toUpperCase().includes("VAŠI PODACI")
  );
  check("Dugme kaže 'Registruj se' za fizičko lice", fizickoText.includes("Registruj se") && !fizickoText.includes("Registruj firmu"));

  // === Check 3: uspešna registracija fizičkog lica ===
  const emailFL = `fizicko.lice.${ts}@test.rs`;
  const imeFL = `Petar Petrović ${ts}`;
  await p1.fill('input[name="ime"]', imeFL);
  await p1.fill('input[name="telefon"]', `+38164${ts.toString().slice(-7)}`);
  await p1.fill('input[name="email"]', emailFL);
  await p1.fill('input[name="password"]', "lozinka123");
  const streetInputsFL = await p1.locator('input[type="text"]').all();
  // StreetNumberFields renders ulica+broj text inputs; fill the adresa street field if present (best-effort, not required).
  await p1.check('input[name="uslovi"]');
  await p1.click('button:has-text("Registruj se")');
  await p1.waitForURL(`${BASE}/klijent`, { timeout: 10000 }).catch(() => {});
  check("fizičko lice uspešno registrovano i ulogovano (redirect na /klijent)", p1.url() === `${BASE}/klijent`, `stiglo na ${p1.url()}`);
  const klijentText = await p1.locator("body").innerText();
  check("klijent dashboard prikazuje ime fizičkog lica", klijentText.includes(imeFL));

  // === Check 4: uspešna registracija firme i dalje radi (regresija) ===
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/registracija`);
  const emailFirma = `firma.test.${ts}@test.rs`;
  const nazivFirme = `Faza19a Test Firma ${ts}`;
  await p2.fill('input[name="naziv"]', nazivFirme);
  await p2.fill('input[name="pib"]', "12345678");
  await p2.fill('input[name="ime"]', "Ana Anić");
  await p2.fill('input[name="telefon"]', `+38165${ts.toString().slice(-7)}`);
  await p2.fill('input[name="email"]', emailFirma);
  await p2.fill('input[name="password"]', "lozinka123");
  await p2.check('input[name="uslovi"]');
  await p2.click('button:has-text("Registruj firmu")');
  await p2.waitForURL(`${BASE}/klijent`, { timeout: 10000 }).catch(() => {});
  check("firma i dalje uspešno registrovana (regresija)", p2.url() === `${BASE}/klijent`, `stiglo na ${p2.url()}`);

  // === Check 5: operater vidi oba tipa klijenta sa tačnim bedžom ===
  const opCtx = await browser.newContext();
  const op = await opCtx.newPage();
  await op.goto(`${BASE}/prijava`);
  await op.fill('input[name="email"]', "operater@ruta.rs");
  await op.fill('input[name="password"]', "operator123");
  await op.click('button[type="submit"]');
  await op.waitForURL(`${BASE}/operater`);
  await op.goto(`${BASE}/operater/klijenti`);
  await op.waitForLoadState("networkidle");
  const opText = await op.locator("body").innerText();
  check("operater vidi novog klijenta firmu", opText.includes(nazivFirme));
  check("operater vidi novo fizičko lice", opText.includes(imeFL));
  const flRow = op.locator("li", { hasText: imeFL });
  check("fizičko lice ima bedž 'Fizičko lice'", (await flRow.locator("text=Fizičko lice").count()) >= 1);
  const firmaRow = op.locator("li", { hasText: nazivFirme });
  check("firma ima bedž 'Firma'", (await firmaRow.locator("text=Firma").count()) >= 1);
  check("fizičko lice NEMA prikazan PIB red", !(await flRow.innerText()).includes("PIB:"));

  // === Check 6: Excel izvoz i dalje radi (200 OK) sa novom kolonom ===
  const exportResp = await op.request.get(`${BASE}/api/operater/izvoz-klijenata`);
  check("Excel izvoz klijenata vraća 200", exportResp.status() === 200);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
