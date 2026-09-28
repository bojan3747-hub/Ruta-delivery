// Faza 19e verifikacija: operaterski panel za angažovanje mašina
// (pregled/pretraga/detalji, po uzoru na /operater/porudzbine) i poseban
// procenat provizije za mašine — globalni (MachineCommissionForm) i lični
// override po dostavljaču (CourierMachineCommissionForm), sa ispravnim
// redosledom prvenstva (ručno > besplatan period > globalno) primenjenim
// pri obračunu provizije kad zahtev pređe u status ZAVRŠENO.
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
    await client.query(
      `UPDATE couriers SET provizija_procenat_masine = NULL WHERE email = 'dostavljac1@ruta.rs'`
    );
    await client.query(
      `UPDATE commission_settings SET procenat_masine = 10.00 WHERE id = 1`
    );
  } finally {
    await client.end();
  }
}

async function createMachineRequestAsClient(p, { zona, ulica, broj, tip, opis }) {
  await p.goto(`${BASE}/klijent/masine/novo`);
  await p.selectOption('select[name="zona"]', zona);
  await p.fill('input[name="adresaUlica"]', ulica);
  await p.fill('input[name="adresaBroj"]', broj);
  await p.selectOption('select[name="tipMasine"]', tip);
  await p.fill('textarea[name="opisPosla"]', opis);
  await p.click('button:has-text("Pošalji zahtev")');
  await p.waitForURL(/\/klijent\/masine\?novo=/, { timeout: 10000 });
  const url = new URL(p.url());
  return url.searchParams.get("novo");
}

async function main() {
  await resetTestData();
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

  // === Operater: globalni procenat provizije za mašine ===
  const opCtx = await browser.newContext();
  const op = await opCtx.newPage();
  await op.goto(`${BASE}/prijava`);
  await op.fill('input[name="email"]', "operater@ruta.rs");
  await op.fill('input[name="password"]', "operator123");
  await op.click('button[type="submit"]');
  await op.waitForURL(`${BASE}/operater`);

  await op.goto(`${BASE}/operater/masine`);
  await op.waitForLoadState("networkidle");
  check(
    "operater vidi naslov 'Angažovanja mašina'",
    (await op.locator("h1").innerText()).includes("Angažovanja mašina")
  );
  check(
    "globalni procenat provizije za mašine prikazan (10)",
    (await op.locator('input[name="procenat"]').inputValue()) === "10"
  );
  await op.fill('input[name="procenat"]', "15");
  await op.click('button:has-text("Sačuvaj")');
  await op.waitForSelector("text=Sačuvano.", { timeout: 5000 });
  await op.goto(`${BASE}/operater/masine`);
  await op.waitForLoadState("networkidle");
  check(
    "izmenjen globalni procenat je persistovan (15)",
    (await op.locator('input[name="procenat"]').inputValue()) === "15"
  );

  // === Operater: lični procenat provizije za mašine po dostavljaču ===
  await op.goto(`${BASE}/operater/dostavljaci`);
  await op.waitForLoadState("networkidle");
  const dostavljaciText = await op.locator("body").innerText();
  check(
    "operater vidi red 'Provizija (mašine)' za dostavljača sa mašinama",
    dostavljaciText.includes("Provizija (mašine)")
  );

  const courier1Row = op.locator("li", { hasText: "Brzi Kombi Nikola" });
  check(
    "dostavljac1 (ima mašine) ima poseban red za proviziju mašina",
    (await courier1Row.locator("text=Provizija (mašine)").count()) === 1
  );
  const courier2Row = op.locator("li", { hasText: "Marko Dostava" }).first();
  const courier2Text = await courier2Row.innerText().catch(() => "");
  if (courier2Text) {
    check(
      "dostavljac bez podešenih mašina nema red za proviziju mašina",
      !courier2Text.includes("Provizija (mašine)")
    );
  } else {
    console.log("SKIP dostavljac2 red nije pronađen po imenu — preskačem tu proveru");
  }

  // Postavi ručni override od 5% za dostavljac1 (mašine).
  const machineOverrideInput = courier1Row.locator('input[type="number"]').last();
  await machineOverrideInput.fill("5");
  await courier1Row.locator('button:has-text("Sačuvaj")').last().click();
  await op.waitForTimeout(800);
  await op.goto(`${BASE}/operater/dostavljaci`);
  await op.waitForLoadState("networkidle");
  const afterOverrideText = await op.locator("li", { hasText: "Brzi Kombi Nikola" }).innerText();
  check(
    "ručni override od 5% za mašine je persistovan i prikazan",
    afterOverrideText.includes("5% · ručno podešeno")
  );

  // === Ceo tok: klijent -> ponuda -> prihvatanje -> završeno, sa proverom provizije ===
  const clientCtx = await browser.newContext();
  const client = await clientCtx.newPage();
  await client.goto(`${BASE}/prijava`);
  await client.fill('input[name="email"]', "klijent1@ruta.rs");
  await client.fill('input[name="password"]', "lozinka123");
  await client.click('button[type="submit"]');
  await client.waitForURL(`${BASE}/klijent`);

  const requestId = await createMachineRequestAsClient(client, {
    zona: "NOVI_BEOGRAD",
    ulica: "Omladinskih brigada",
    broj: "88",
    tip: "MINI_BAGER",
    opis: "Kopanje kanala za instalacije, provera provizije.",
  });
  check("zahtev za proveru provizije kreiran", Boolean(requestId));

  const courierCtx = await browser.newContext();
  const courier = await courierCtx.newPage();
  await courier.goto(`${BASE}/prijava`);
  await courier.fill('input[name="email"]', "dostavljac1@ruta.rs");
  await courier.fill('input[name="password"]', "lozinka123");
  await courier.click('button[type="submit"]');
  await courier.waitForURL(`${BASE}/dostavljac`);

  await courier.goto(`${BASE}/dostavljac/masine/zahtevi`);
  await courier.waitForLoadState("networkidle");
  const offerCard = courier.locator("li", { hasText: "Kopanje kanala" });
  await offerCard.locator('input[name="cena"]').fill("4000");
  await offerCard.locator('input[name="procenaTrajanja"]').fill("1 dan");
  await offerCard.locator('button:has-text("Pošalji ponudu")').click();
  await courier.waitForSelector("text=Ponuda je poslata klijentu.", { timeout: 5000 });

  await client.goto(`${BASE}/klijent/masine/${requestId}`);
  await client.waitForLoadState("networkidle");
  await client.click('button:has-text("Prihvati ponudu")');
  await client.waitForTimeout(800);

  await courier.goto(`${BASE}/dostavljac/masine/aktivna`);
  await courier.waitForLoadState("networkidle");
  await courier.click('button:has-text("Označi: Na lokaciji")');
  await courier.waitForTimeout(800);
  await courier.click('button:has-text("Označi: Završeno")');
  await courier.waitForTimeout(800);

  // === Operater: detalj zahteva prikazuje ispravno obračunatu proviziju (5% od 4000 = 200) ===
  await op.goto(`${BASE}/operater/masine/${requestId}`);
  await op.waitForLoadState("networkidle");
  const detailText = await op.locator("body").innerText();
  check("operater detalj prikazuje tip mašine 'Mini bager'", detailText.includes("Mini bager"));
  check("operater detalj prikazuje klijenta 'Boja Print d.o.o.'", detailText.includes("Boja Print d.o.o."));
  check("operater detalj prikazuje izvođača 'Brzi Kombi Nikola'", detailText.includes("Brzi Kombi Nikola"));
  check("operater detalj prikazuje status 'Završeno'", detailText.includes("Završeno"));
  check("operater detalj prikazuje dogovorenu cenu (4.000)", detailText.includes("4.000"));
  check(
    "operater detalj prikazuje ispravno obračunatu proviziju (200, tj. 5% od 4000)",
    detailText.includes("Provizija:") && detailText.includes("200")
  );

  // === Operater: lista angažovanja mašina prikazuje/pretražuje novi zahtev ===
  await op.goto(`${BASE}/operater/masine?q=${encodeURIComponent("Boja Print")}`);
  await op.waitForLoadState("networkidle");
  check(
    "pretraga po nazivu klijenta pronalazi zahtev",
    (await op.locator("body").innerText()).includes("Mini bager")
  );
  await op.goto(`${BASE}/operater/masine?status=ZAVRSENO`);
  await op.waitForLoadState("networkidle");
  check(
    "filter po statusu 'Završeno' prikazuje zahtev",
    (await op.locator("body").innerText()).includes("Mini bager")
  );
  await op.goto(`${BASE}/operater/masine?status=OTVOREN`);
  await op.waitForLoadState("networkidle");
  check(
    "filter po statusu 'Otvoreno' NE prikazuje završeni zahtev",
    !(await op.locator("body").innerText()).includes("Kopanje kanala")
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
