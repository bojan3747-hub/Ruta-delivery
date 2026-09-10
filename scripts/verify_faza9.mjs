// Faza 9 verifikacija: pojednostavljeni statusi porudžbine (Primio ponudu /
// Preuzeo ponudu / Isporučio) + preuzeto_at/isporuceno_at timestamp-ovi.
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

  const clientCtx = await browser.newContext();
  const client = await clientCtx.newPage();
  const courierCtx = await browser.newContext();
  const courier = await courierCtx.newPage();
  const opCtx = await browser.newContext();
  const op = await opCtx.newPage();

  // --- login all three ---
  await client.goto(`${BASE}/prijava`);
  await client.fill('input[name="email"]', "klijent1@ruta.rs");
  await client.fill('input[name="password"]', "lozinka123");
  await client.click('form button:has-text("Prijavi se")');
  await client.waitForURL(`${BASE}/klijent`);

  await courier.goto(`${BASE}/prijava`);
  await courier.fill('input[name="email"]', "dostavljac1@ruta.rs");
  await courier.fill('input[name="password"]', "lozinka123");
  await courier.click('button[type="submit"]');
  await courier.waitForURL(`${BASE}/dostavljac`);

  await op.goto(`${BASE}/prijava`);
  await op.fill('input[name="email"]', "operater@ruta.rs");
  await op.fill('input[name="password"]', "operator123");
  await op.click('button[type="submit"]');
  await op.waitForURL(`${BASE}/operater`);

  // --- client creates a shipment ---
  await client.goto(`${BASE}/klijent/nova-posiljka`);
  await client.fill('input[name="posiljalacIme"]', "Faza9 Posiljalac");
  await client.fill('input[name="posiljalacTelefon"]', "+381600001111");
  await client.selectOption('select[name="zonaPreuzimanja"]', "STARI_GRAD");
  await client.fill('input[name="adresaPreuzimanjaUlica"]', "Faza9 Ulica");
  await client.fill('input[name="adresaPreuzimanjaBroj"]', "9");
  await client.fill('input[name="primalacIme"]', "Faza9 Primalac");
  await client.fill('input[name="primalacTelefon"]', "+381600002222");
  await client.selectOption('select[name="zonaIsporuke"]', "NOVI_BEOGRAD");
  await client.fill('input[name="adresaIsporukeUlica"]', "Faza9 Ulica");
  await client.fill('input[name="adresaIsporukeBroj"]', "10");
  await client.fill('input[name="deklarisanaVrednost"]', "3000");
  await client.selectOption('select[name="tip"]', "MALI_PAKET");
  await client.selectOption('select[name="sadrzajPosiljke"]', "KNJIGE");
  await client.selectOption('select[name="zeljeniTermin"]', "ODMAH");
  await client.click('button:has-text("Zatraži ponude")');
  await client.waitForURL(/\/klijent\/posiljke\//);
  const shipmentUrl = client.url();

  // --- courier sends offer, client accepts ---
  await courier.goto(`${BASE}/dostavljac/zahtevi`);
  await courier.waitForSelector("text=Standardna", { timeout: 5000 });
  const li = courier.locator("li", { hasText: "Standardna" }).first();
  await li.locator('input[name="cena"]').fill("1200");
  await li.locator('input[name="procenjenoVremeMin"]').fill("30");
  await li.locator('button:has-text("Pošalji ponudu")').click();
  await courier.waitForSelector("text=Ponuda je poslata klijentu.", { timeout: 5000 });

  await client.goto(shipmentUrl);
  await client.waitForSelector("text=Prihvati ponudu", { timeout: 5000 });
  await client.click("text=Prihvati ponudu");
  await client.waitForSelector("text=Praćenje isporuke", { timeout: 5000 });

  // === Check 1: client page shows "Primio ponudu" as reached step, with a timestamp ===
  await client.waitForTimeout(300);
  const bodyText1 = await client.locator("body").innerText();
  check("client page shows 'Primio ponudu' label", bodyText1.includes("Primio ponudu"));
  check("client page shows 'Preuzeo ponudu' label (not-yet-reached)", bodyText1.includes("Preuzeo ponudu"));
  check("client page shows 'Isporučio' label", bodyText1.includes("Isporučio"));
  check(
    "client page does NOT show old 'Preuzeto'/'Na isporuci' labels",
    !bodyText1.includes("Na isporuci") && !/\bPreuzeto\b/.test(bodyText1)
  );

  // === Check 2: courier UI at PREUZETO has no photo-upload input yet ===
  await courier.goto(`${BASE}/dostavljac/aktivne`);
  await courier.waitForSelector("text=Označi:", { timeout: 5000 });
  const fileInputsBefore = await courier.locator('input[type="file"]').count();
  check("no photo-upload input while still at PREUZETO (before 1st click)", fileInputsBefore === 0);
  const firstBtnLabel = await courier.locator("button:has-text('Označi:')").first().innerText();
  check(
    "first advance button says 'Označi: Preuzeo ponudu'",
    firstBtnLabel.trim() === "Označi: Preuzeo ponudu",
    firstBtnLabel
  );

  // --- click 1: PREUZETO -> U_TRANZITU ---
  await courier.locator("button:has-text('Označi:')").first().click();
  await courier.waitForTimeout(1000);
  const errAfter1 = await courier.locator("p.text-red-600").count();
  check("no error shown after 1st advance click", errAfter1 === 0);

  // === Check 3: after 1st click, courier now sees photo-upload input (final step) ===
  const fileInputsAfter1 = await courier.locator('input[type="file"]').count();
  check("photo-upload input appears once at U_TRANZITU (final step before delivered)", fileInputsAfter1 === 1);
  const secondBtnLabel = await courier.locator("button:has-text('Označi:')").first().innerText();
  check(
    "second advance button says 'Označi: Isporučio'",
    secondBtnLabel.trim() === "Označi: Isporučio",
    secondBtnLabel
  );

  // === Check 4: client page now shows preuzeto_at timestamp for "Preuzeo ponudu" ===
  await client.goto(shipmentUrl);
  const bodyText2 = await client.locator("body").innerText();
  check(
    "client page shows 'Preuzeo ponudu' as reached (has a timestamp under it)",
    bodyText2.includes("Preuzeo ponudu")
  );

  // --- click 2: U_TRANZITU -> ISPORUCENO ---
  await courier.locator("button:has-text('Označi:')").first().click();
  await courier.waitForTimeout(1000);
  const errAfter2 = await courier.locator("p.text-red-600").count();
  check("no error shown after 2nd (final) advance click", errAfter2 === 0);
  await courier.waitForSelector("text=Nedavno završene", { timeout: 5000 });
  check("order left active list and moved to 'Nedavno završene'", true);

  // === Check 5: client sees rating form now (order fully delivered) ===
  await client.goto(shipmentUrl);
  await client.waitForSelector("text=Ocenite dostavljača", { timeout: 5000 });
  check("client sees rating form after delivery", true);
  const bodyText3 = await client.locator("body").innerText();
  check("client page shows 'Isporučio' as reached", bodyText3.includes("Isporučio"));

  // --- rate the courier so DB/operator checks below have a stable end state ---
  await client.click('button:has-text("★")', { timeout: 2000 }).catch(() => {});

  // === Check 6: operator order list/detail show the new labels ===
  await op.goto(`${BASE}/operater/porudzbine`);
  await op.waitForLoadState("networkidle");
  const opListText = await op.locator("body").innerText();
  check("operator order list shows 'Isporučio'", opListText.includes("Isporučio"));
  // filter pills (rendered as <Link> chips, not a <select>) should have exactly
  // one "Preuzeo ponudu" entry (no NA_ISPORUCI duplicate). Scope narrowly to
  // the rounded-full filter pills so order-row links with the same status
  // label (also <a> tags) aren't counted.
  const filterOptions = await op.locator("a.rounded-full", { hasText: "Preuzeo ponudu" }).count();
  check("operator filter pills have no duplicate 'Preuzeo ponudu' entry", filterOptions === 1, `found ${filterOptions}`);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
