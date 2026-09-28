// Faza 19b verifikacija: dostavljač bira mašine (SA rukovaocem) za
// "Angažovanje mašina", operater ih vidi.
import "dotenv/config";
import { chromium } from "playwright";
import { Client } from "pg";

const BASE = "http://localhost:3100";
let failures = 0;

// Skripta mora biti idempotentna preko više pokretanja — očisti mašine
// test-dostavljača ostavljene od prethodnog pokretanja pre nego što
// proveravamo prazno ("Dodaj") stanje.
async function resetTestData() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `DELETE FROM courier_machines WHERE courier_id IN (
         SELECT id FROM couriers WHERE email = 'dostavljac1@ruta.rs'
       )`
    );
  } finally {
    await client.end();
  }
}

function check(name, cond, extra) {
  if (cond) {
    console.log(`OK   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${extra ? " -- " + extra : ""}`);
  }
}

async function main() {
  await resetTestData();
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

  // === Dostavljač: strana za mašine ===
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/prijava`);
  await p.fill('input[name="email"]', "dostavljac1@ruta.rs");
  await p.fill('input[name="password"]', "lozinka123");
  await p.click('button[type="submit"]');
  await p.waitForURL(`${BASE}/dostavljac`);

  const dashText = await p.locator("body").innerText();
  check("dashboard prikazuje red 'Mašine za angažovanje'", dashText.includes("Mašine za angažovanje"));
  check("dashboard pokazuje 'Dodaj' kad nema mašina", dashText.includes("Dodaj"));

  await p.goto(`${BASE}/dostavljac/masine`);
  await p.waitForLoadState("networkidle");
  const allCheckboxes = await p.locator('input[type="checkbox"]').count();
  check("svih 14 mašina prikazano kao checkbox", allCheckboxes === 14, `nađeno ${allCheckboxes}`);

  // Izaberi "Mini bager" i "Vibro ploča", unesi cene za mini bager.
  await p.check('input[name="masina_MINI_BAGER"]');
  await p.check('input[name="masina_VIBRO_PLOCA"]');
  await p.fill('input[name="cenaPoSatu_MINI_BAGER"]', "3500");
  await p.fill('input[name="cenaPoDanu_MINI_BAGER"]', "25000");
  await p.click('button:has-text("Sačuvaj mašine")');
  await p.waitForSelector("text=Mašine su sačuvane.", { timeout: 5000 });
  check("uspešno sačuvane mašine (poruka prikazana)", true);

  // Reload — proveri da su izbori i cene persistovani.
  await p.goto(`${BASE}/dostavljac/masine`);
  await p.waitForLoadState("networkidle");
  check("Mini bager ostaje čekiran posle reload-a", await p.locator('input[name="masina_MINI_BAGER"]').isChecked());
  check("Vibro ploča ostaje čekirana posle reload-a", await p.locator('input[name="masina_VIBRO_PLOCA"]').isChecked());
  check(
    "cena po satu za Mini bager persistovana",
    (await p.locator('input[name="cenaPoSatu_MINI_BAGER"]').inputValue()) === "3500.00"
  );
  check(
    "cena po danu za Mini bager persistovana",
    (await p.locator('input[name="cenaPoDanu_MINI_BAGER"]').inputValue()) === "25000.00"
  );
  check(
    "neizabrana mašina (npr. Valjak) nema price input prikazan",
    (await p.locator('input[name="cenaPoSatu_VALJAK"]').count()) === 0
  );

  // Dashboard sad prikazuje izabrane mašine.
  await p.goto(`${BASE}/dostavljac`);
  const dashText2 = await p.locator("body").innerText();
  check("dashboard sad prikazuje 'Mini bager'", dashText2.includes("Mini bager"));
  check("dashboard sad prikazuje 'Vibro ploča'", dashText2.includes("Vibro ploča"));
  check("dashboard sad pokazuje 'Izmeni' (ne 'Dodaj')", dashText2.includes("Izmeni"));

  // === Operater vidi mašine ovog dostavljača ===
  const opCtx = await browser.newContext();
  const op = await opCtx.newPage();
  await op.goto(`${BASE}/prijava`);
  await op.fill('input[name="email"]', "operater@ruta.rs");
  await op.fill('input[name="password"]', "operator123");
  await op.click('button[type="submit"]');
  await op.waitForURL(`${BASE}/operater`);
  await op.goto(`${BASE}/operater/dostavljaci`);
  await op.waitForLoadState("networkidle");
  const opText = await op.locator("body").innerText();
  check("operater vidi 'Mašine:' red", opText.includes("Mašine:"));
  check("operater vidi 'Mini bager' za dostavljača", opText.includes("Mini bager"));

  // === Regresija: dostugi drugi dostavljač i dalje nema mašine (prazna lista, bez greške) ===
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/prijava`);
  await p2.fill('input[name="email"]', "dostavljac2@ruta.rs");
  await p2.fill('input[name="password"]', "lozinka123");
  await p2.click('button[type="submit"]');
  await p2.waitForURL(`${BASE}/dostavljac`);
  await p2.goto(`${BASE}/dostavljac/masine`);
  await p2.waitForLoadState("networkidle");
  check(
    "drugi dostavljač (bez mašina) vidi praznu formu bez greške",
    (await p2.locator('input[type="checkbox"]:checked').count()) === 0
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
