// Faza 12 verifikacija: lični procenat provizije po dostavljaču (ručno
// podešavanje ima prednost) + automatski besplatan period od 3 meseca od
// aktivacije naloga, bez ručnog praćenja.
//
// Kombinuje dva nivoa provere:
//  - Deo A/B: direktno na nivou upita (isti kod koji advanceOrder stvarno
//    poziva), preko sopstvenih, izolovanih test podataka (firma + kurir +
//    pošiljke) — precizno i bez zavisnosti od Playwright-a/UI flow-a za
//    samu logiku obračuna.
//  - Deo C: operaterski UI na /operater/dostavljaci — prikaz i izmena
//    ličnog procenta preko forme.
import "dotenv/config";
import { chromium } from "playwright";
import { pool } from "../src/lib/db";
import { createCompanyAccount } from "../src/lib/queries/companies";
import {
  activateCourier,
  createPreApprovedCourier,
  setCourierCommissionPercent,
} from "../src/lib/queries/couriers";
import { createShipment } from "../src/lib/queries/shipments";
import { createManualOffer, acceptOffer } from "../src/lib/queries/offers";
import { advanceOrder } from "../src/lib/queries/orders";
import {
  getActiveCommissionPercent,
  getEffectiveCommissionPercent,
} from "../src/lib/queries/commission";

const BASE = "http://localhost:3100";
let failures = 0;

function check(name: string, cond: boolean, extra?: string) {
  if (cond) {
    console.log(`OK   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${extra ? " -- " + extra : ""}`);
  }
}

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

function expectedProvizija(cena: number, percent: number): number {
  return Math.round(cena * (percent / 100) * 100) / 100;
}

async function main() {
  const globalPercent = await getActiveCommissionPercent();

  // === Deo A: čista logika getEffectiveCommissionPercent ===
  {
    const r = await getEffectiveCommissionPercent({
      provizija_procenat: "7.50",
      aktiviran_at: new Date().toISOString(),
    });
    check(
      "ručni procenat važi čak i unutar besplatnog perioda",
      r.percent === 7.5 && r.source === "RUCNO",
      JSON.stringify(r)
    );
  }
  {
    const r = await getEffectiveCommissionPercent({
      provizija_procenat: "0",
      aktiviran_at: monthsAgo(5),
    });
    check(
      "ručni procenat 0% važi i posle isteka besplatnog perioda",
      r.percent === 0 && r.source === "RUCNO",
      JSON.stringify(r)
    );
  }
  {
    const r = await getEffectiveCommissionPercent({
      provizija_procenat: null,
      aktiviran_at: new Date().toISOString(),
    });
    check(
      "bez ručnog podešavanja, netom aktiviran dostavljač je u besplatnom periodu (0%)",
      r.percent === 0 && r.source === "BESPLATAN_PERIOD",
      JSON.stringify(r)
    );
  }
  {
    const r = await getEffectiveCommissionPercent({
      provizija_procenat: null,
      aktiviran_at: monthsAgo(4),
    });
    check(
      "bez ručnog podešavanja, posle 3+ meseca automatski prelazi na globalni procenat",
      r.percent === globalPercent && r.source === "GLOBALNO",
      JSON.stringify(r)
    );
  }
  {
    const r = await getEffectiveCommissionPercent({
      provizija_procenat: null,
      aktiviran_at: null,
    });
    check(
      "neaktiviran nalog (aktiviran_at = null) prati globalni procenat, ne besplatan period",
      r.percent === globalPercent && r.source === "GLOBALNO",
      JSON.stringify(r)
    );
  }

  // === Deo B: end-to-end kroz stvarne upite (izolovani test podaci) ===
  const uniq = Date.now();
  const { company } = await createCompanyAccount({
    email: `faza12-klijent-${uniq}@test.rs`,
    password: "test12345",
    ime: "Faza12 Test Kontakt",
    telefon: "+381600000000",
    naziv: `Faza12 Test Firma ${uniq}`,
  });
  const courier = await createPreApprovedCourier({
    naziv: `Faza12 Test Kurir ${uniq}`,
    telefon: `+38161${String(uniq).slice(-7)}`,
    izvorKontakta: "Drugo",
  });
  await activateCourier({
    courierId: courier.id,
    email: `faza12-kurir-${uniq}@test.rs`,
    password: "test12345",
    telefon: courier.telefon,
    pib: "111222333",
    tipVozila: "KOMBI",
    nosivostKg: 500,
    zones: ["NOVI_BEOGRAD"],
  });

  const freshRes = await pool.query<{ aktiviran_at: string | null }>(
    "SELECT aktiviran_at FROM couriers WHERE id = $1",
    [courier.id]
  );
  check(
    "activateCourier upisuje aktiviran_at u trenutku aktivacije",
    freshRes.rows[0]?.aktiviran_at !== null
  );

  async function deliverTestOrder(cena: number) {
    const shipment = await createShipment({
      clientId: company.id,
      zonaPreuzimanja: "NOVI_BEOGRAD",
      zonaIsporuke: "NOVI_BEOGRAD",
      adresaPreuzimanja: "Test ulica 1",
      adresaIsporuke: "Test ulica 2",
      tip: "MALI_PAKET",
      sadrzajPosiljke: "KNJIGE",
      hitno: false,
      nestandardna: false,
      zeljeniTermin: "ODMAH",
      deklarisanaVrednost: 0,
    });
    const offer = await createManualOffer({
      shipmentId: shipment.id,
      courierId: courier.id,
      cena,
      procenjenoVremeMin: 30,
    });
    const orderId = await acceptOffer(shipment.id, offer.id);
    await advanceOrder(orderId, courier.id); // PREUZETO -> U_TRANZITU
    return advanceOrder(orderId, courier.id); // U_TRANZITU -> ISPORUCENO
  }

  // Scenario 1: netom aktiviran (now) => besplatan period => 0% provizije
  const delivered1 = await deliverTestOrder(1000);
  check(
    "isporuka tokom besplatnog perioda ima proviziju 0",
    Number(delivered1.provizija) === 0,
    `provizija=${delivered1.provizija}`
  );

  // Scenario 2: "vratimo vreme unazad" — besplatan period istekao, bez
  // ručnog podešavanja => automatski globalni procenat
  await pool.query("UPDATE couriers SET aktiviran_at = $1 WHERE id = $2", [
    monthsAgo(4),
    courier.id,
  ]);
  const delivered2 = await deliverTestOrder(2000);
  const expected2 = expectedProvizija(2000, globalPercent);
  check(
    "isporuka posle isteka besplatnog perioda koristi globalni procenat",
    Number(delivered2.provizija) === expected2,
    `očekivano ${expected2}, dobijeno ${delivered2.provizija}`
  );

  // Scenario 3: ručno podešen procenat ima prednost, čak i kad je "besplatan
  // period" već istekao (dokazuje da RUCNO uvek pobeđuje)
  await setCourierCommissionPercent(courier.id, 3.5);
  const delivered3 = await deliverTestOrder(3000);
  const expected3 = expectedProvizija(3000, 3.5);
  check(
    "ručno podešen procenat ima prednost nad automatikom",
    Number(delivered3.provizija) === expected3,
    `očekivano ${expected3}, dobijeno ${delivered3.provizija}`
  );

  // Vraćamo na automatiku (brisanje ručnog podešavanja) pre UI provere ispod.
  await setCourierCommissionPercent(courier.id, null);

  // === Deo C: operaterski UI na /operater/dostavljaci ===
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const op = await browser.newPage();
  await op.goto(`${BASE}/prijava`);
  await op.fill('input[name="email"]', "operater@ruta.rs");
  await op.fill('input[name="password"]', "operator123");
  await op.click('button[type="submit"]');
  await op.waitForURL(`${BASE}/operater`);
  await op.goto(`${BASE}/operater/dostavljaci`);
  await op.waitForLoadState("networkidle");

  const row = op.locator("li", { hasText: courier.naziv });
  check(
    "operaterska strana prikazuje red 'Provizija:' za dostavljača",
    (await row.locator("text=Provizija:").count()) === 1
  );
  check(
    "posle brisanja ručnog podešavanja i isteka besplatnog perioda, prikazuje globalni procenat",
    (await row.innerText()).includes("globalni procenat")
  );

  await row.locator('input[type="number"]').fill("12.5");
  await row.locator('button:has-text("Sačuvaj")').click();
  await op.waitForTimeout(800);
  await op.reload();
  await op.waitForLoadState("networkidle");
  const rowAfterSet = op.locator("li", { hasText: courier.naziv });
  check(
    "ručno podešavanje preko UI forme se čuva i prikazuje 'ručno podešeno'",
    (await rowAfterSet.innerText()).includes("12.5% · ručno podešeno")
  );

  await rowAfterSet.locator('input[type="number"]').fill("");
  await rowAfterSet.locator('button:has-text("Sačuvaj")').click();
  await op.waitForTimeout(800);
  await op.reload();
  await op.waitForLoadState("networkidle");
  const rowAfterClear = op.locator("li", { hasText: courier.naziv });
  check(
    "brisanje polja (prazno) preko UI forme vraća na automatiku",
    (await rowAfterClear.innerText()).includes("globalni procenat")
  );

  await browser.close();
  await pool.end();

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
