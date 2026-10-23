// Faza 22 verifikacija: proširenje javne forme "Prijavite se za saradnju"
// (landing page, Faza 11) da hvata i interesovanje IZVOĐAČA MAŠINA (Faza 19),
// ne samo dostavljača/vozila kao do sad. Pokriva: landing kopija pominje i
// mašine, prijava SAMO sa mašinama (bez vozila) uspeva i operater je vidi,
// prijava sa VOZILOM I mašinama uspeva i operater vidi oba, i da duplirana
// prijava (isti telefon) i dalje ne pravi duplikat niti dodaje mašine na
// postojeći red (ista dedup politika kao u Fazi 11).
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

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

  try {
    // === Check 1: landing kopija pominje mašine, ne samo vozila ===
    const visitorCtx = await browser.newContext();
    const visitor = await visitorCtx.newPage();
    await visitor.goto(`${BASE}/`);
    const landingText = await visitor.locator("body").innerText();
    check(
      "landing naslov pominje i mašinu, ne samo kombi/kamion",
      landingText.includes("građevinsku mašinu sa rukovaocem")
    );
    check(
      "forma ima sekciju za mašine sa napomenom da vozilo nije obavezno",
      landingText.includes("Mašine koje nudite sa rukovaocem")
    );
    check(
      "forma prikazuje bar jedan konkretan tip mašine (checkbox labela)",
      landingText.includes("Mini bager (kopačica)") && landingText.includes("Auto-dizalica")
    );

    // === Check 2: prijava SAMO sa mašinama (bez vozila/nosivosti) ===
    const onlyMachinesPhone = `+38161${Date.now().toString().slice(-7)}`;
    const onlyMachinesNaziv = `Faza22 Samo Mašine ${Date.now()}`;
    await visitor.fill('input[name="naziv"]', onlyMachinesNaziv);
    await visitor.fill('input[name="telefon"]', onlyMachinesPhone);
    await visitor.check('input[name="masina_MINI_BAGER"]');
    await visitor.check('input[name="masina_AUTO_DIZALICA"]');
    await visitor.check('input[name="zona_ZEMUN"]');
    await visitor.click('button:has-text("Prijavite se za saradnju")');
    await visitor.waitForSelector("text=Hvala!", { timeout: 5000 });
    check("prijava samo sa mašinama (bez vozila) uspeva", true);

    // === Check 3: prijava sa VOZILOM I mašinama ===
    const bothPhone = `+38162${Date.now().toString().slice(-7)}`;
    const bothNaziv = `Faza22 Vozilo I Mašine ${Date.now()}`;
    const visitor2Ctx = await browser.newContext();
    const visitor2 = await visitor2Ctx.newPage();
    await visitor2.goto(`${BASE}/`);
    await visitor2.fill('input[name="naziv"]', bothNaziv);
    await visitor2.fill('input[name="telefon"]', bothPhone);
    await visitor2.selectOption('select[name="tipVozila"]', "KAMION");
    await visitor2.fill('input[name="nosivostKg"]', "2000");
    await visitor2.check('input[name="masina_VALJAK"]');
    await visitor2.click('button:has-text("Prijavite se za saradnju")');
    await visitor2.waitForSelector("text=Hvala!", { timeout: 5000 });
    check("prijava sa vozilom I mašinama uspeva", true);

    // === Check 4: operater vidi oba lida ispravno ===
    const opCtx = await browser.newContext();
    const op = await opCtx.newPage();
    await op.goto(`${BASE}/prijava`);
    await op.fill('input[name="email"]', "operater@ruta.rs");
    await op.fill('input[name="password"]', "operator123");
    await op.click('button[type="submit"]');
    await op.waitForURL(`${BASE}/operater`);
    await op.goto(`${BASE}/operater/dostavljaci`);
    await op.waitForLoadState("networkidle");

    const onlyMachinesLi = op.locator("li", { hasText: onlyMachinesNaziv });
    const onlyMachinesLiText = await onlyMachinesLi.innerText();
    check(
      "operater vidi 'samo mašine' lid sa oba izabrana tipa mašine",
      onlyMachinesLiText.includes("Mašine:") &&
        onlyMachinesLiText.includes("Mini bager (kopačica)") &&
        onlyMachinesLiText.includes("Auto-dizalica (mobilna dizalica)")
    );
    check(
      "'samo mašine' lid NEMA prikazan tip vozila (nije unet)",
      !onlyMachinesLiText.includes("· Kombi") && !onlyMachinesLiText.includes("· Kamion")
    );

    const bothLi = op.locator("li", { hasText: bothNaziv });
    const bothLiText = await bothLi.innerText();
    check(
      "'vozilo i mašine' lid prikazuje tip vozila (Kamion) i nosivost",
      bothLiText.includes("Kamion") && bothLiText.includes("2000 kg")
    );
    check(
      "'vozilo i mašine' lid prikazuje izabranu mašinu (Valjak)",
      bothLiText.includes("Mašine:") && bothLiText.includes("Valjak (vibracioni)")
    );

    // === Check 5: DB nivo — cena_po_satu/cena_po_danu su NULL za nove lid-ove ===
    const { rows: priceRows } = await db.query(
      `SELECT cm.cena_po_satu, cm.cena_po_danu
       FROM courier_machines cm
       JOIN couriers c ON c.id = cm.courier_id
       WHERE c.telefon = $1`,
      [onlyMachinesPhone]
    );
    check(
      "cene mašina ostaju NULL pri prijavi (popunjavaju se posle aktivacije)",
      priceRows.length === 2 && priceRows.every((r) => r.cena_po_satu === null && r.cena_po_danu === null),
      `found ${priceRows.length} rows`
    );

    // === Check 6: duplirana prijava (isti telefon) sa DODATNIM mašinama ne menja original ===
    const dupCtx = await browser.newContext();
    const dup = await dupCtx.newPage();
    await dup.goto(`${BASE}/`);
    await dup.fill('input[name="naziv"]', "Duplikat Pokušaj Mašine");
    await dup.fill('input[name="telefon"]', onlyMachinesPhone);
    await dup.check('input[name="masina_VILJUSKAR"]');
    await dup.click('button:has-text("Prijavite se za saradnju")');
    await dup.waitForSelector("text=Hvala!", { timeout: 5000 });

    const { rows: afterDupRows } = await db.query(
      `SELECT cm.tip_masine
       FROM courier_machines cm
       JOIN couriers c ON c.id = cm.courier_id
       WHERE c.telefon = $1
       ORDER BY cm.tip_masine`,
      [onlyMachinesPhone]
    );
    check(
      "duplirana prijava ne dodaje novu mašinu (VILJUSKAR) na postojeći red",
      afterDupRows.length === 2 && !afterDupRows.some((r) => r.tip_masine === "VILJUSKAR"),
      `found ${afterDupRows.map((r) => r.tip_masine).join(", ")}`
    );

    // cleanup
    await db.query(
      `DELETE FROM courier_machines WHERE courier_id IN (
         SELECT id FROM couriers WHERE telefon IN ($1, $2)
       )`,
      [onlyMachinesPhone, bothPhone]
    );
    await db.query("DELETE FROM couriers WHERE telefon IN ($1, $2)", [
      onlyMachinesPhone,
      bothPhone,
    ]);
  } finally {
    await browser.close();
    await db.end();
  }

  console.log(`\n${failures === 0 ? "SVI TESTOVI PROŠLI" : `${failures} TEST(OVA) NIJE PROŠLO`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
