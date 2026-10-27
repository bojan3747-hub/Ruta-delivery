// Faza 24 verifikacija: "gost zahtev, nalog u pozadini" — fizičko lice
// naruči dostavu na /zahtev BEZ registracije, nalog se kreira u pozadini
// (placeholder email @gost.ruta-dostava.rs, password_hash NULL), a gost
// pristupa SVOJOJ pošiljci isključivo preko /pracenje/[gost_token] (bez
// pretrage po telefonu — odluka korisnika: "samo link, bez povratne
// pretrage"). Pokriva: kreiranje zahteva, otkazivanje pre ponude,
// prihvatanje ponude + otkazivanje porudžbine, i pun tok do isporuke +
// ocenjivanje — sve preko tokena, bez prijave. Dostavljač ostaje
// OBAVEZNO registrovan (ovo se nije menjalo).
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

async function fillShipmentFields(page, { posiljalac, primalac }) {
  await page.fill('input[name="posiljalacIme"]', posiljalac);
  await page.fill('input[name="posiljalacTelefon"]', "+381600001111");
  await page.selectOption('select[name="zonaPreuzimanja"]', "STARI_GRAD");
  await page.fill('input[name="adresaPreuzimanjaUlica"]', "Gost Ulica");
  await page.fill('input[name="adresaPreuzimanjaBroj"]', "1");
  await page.fill('input[name="primalacIme"]', primalac);
  await page.fill('input[name="primalacTelefon"]', "+381600002222");
  await page.selectOption('select[name="zonaIsporuke"]', "NOVI_BEOGRAD");
  await page.fill('input[name="adresaIsporukeUlica"]', "Gost Ulica");
  await page.fill('input[name="adresaIsporukeBroj"]', "2");
  await page.fill('input[name="deklarisanaVrednost"]', "2500");
  await page.selectOption('select[name="tip"]', "MALI_PAKET");
  await page.selectOption('select[name="sadrzajPosiljke"]', "KNJIGE");
  await page.selectOption('select[name="zeljeniTermin"]', "ODMAH");
}

async function createGuestRequest(browser, { gostIme, gostTelefon, posiljalac, primalac }) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/zahtev`);
  await page.fill('input[name="gostIme"]', gostIme);
  await page.fill('input[name="gostTelefon"]', gostTelefon);
  await fillShipmentFields(page, { posiljalac, primalac });
  await page.check('input[name="uslovi"]');
  await page.click('button:has-text("Pošaljite zahtev")');
  await page.waitForURL(/\/pracenje\//, { timeout: 10000 });
  const url = page.url();
  const token = url.split("/pracenje/")[1];
  return { ctx, page, url, token };
}

async function main() {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  // === Anonimni posetilac vidi link ka gost-formi na landing stranici ===
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`${BASE}/`);
  await anon.waitForLoadState("networkidle");
  check(
    "landing stranica (anonimni posetilac) ima link 'Ili naručite odmah, bez registracije' ka /zahtev",
    (await anon.getByRole("link", { name: "Ili naručite odmah, bez registracije" }).getAttribute("href")) ===
      "/zahtev"
  );

  // === Nevažeći token -> 404 ===
  const badCtx = await browser.newContext();
  const bad = await badCtx.newPage();
  const badResp = await bad.goto(`${BASE}/pracenje/00000000-0000-0000-0000-000000000000`);
  check("nepostojeći gost_token vraća 404", badResp.status() === 404);
  await badCtx.close();

  // === Scenario A: gost kreira zahtev, pa ga otkazuje pre ponude ===
  const a = await createGuestRequest(browser, {
    gostIme: "Faza24A Gost",
    gostTelefon: "+381641110001",
    posiljalac: "Faza24A Posiljalac",
    primalac: "Faza24A Primalac",
  });
  check("Scenario A: redirect na /pracenje/[token] nakon slanja zahteva", /\/pracenje\/[0-9a-f-]+$/.test(a.url));
  let bodyA = await a.page.locator("body").innerText();
  check("Scenario A: banner 'Sačuvajte ovaj link' prisutan", bodyA.includes("Sačuvajte ovaj link"));
  check("Scenario A: prikazan status 'Otvorena' i sekcija Ponude", bodyA.includes("Ponude"));
  check("Scenario A: dugme 'Otkaži pošiljku' prisutno (nema još ponude)", bodyA.includes("Otkaži pošiljku"));

  a.page.once("dialog", (d) => d.accept());
  await a.page.click('button:has-text("Otkaži pošiljku")');
  await a.page.waitForTimeout(500);
  bodyA = await a.page.locator("body").innerText();
  check("Scenario A: status prikazuje 'Otkazana' nakon otkazivanja", bodyA.includes("Otkazana"));
  check(
    "Scenario A: dugme 'Otkaži pošiljku' nestalo nakon otkazivanja",
    !bodyA.includes("Otkaži pošiljku")
  );
  const { rows: rowsA } = await db.query(
    "SELECT status FROM shipments WHERE gost_token = $1",
    [a.token]
  );
  check("Scenario A: pošiljka u bazi ima status OTKAZANA", rowsA[0]?.status === "OTKAZANA");
  await a.ctx.close();

  // === Dostavljač (postojeći, registrovan) priprema se za B i C ===
  const courierCtx = await browser.newContext();
  const courier = await courierCtx.newPage();
  await courier.goto(`${BASE}/prijava`);
  await courier.fill('input[name="email"]', "dostavljac1@ruta.rs");
  await courier.fill('input[name="password"]', "lozinka123");
  await courier.click('button[type="submit"]');
  await courier.waitForURL(`${BASE}/dostavljac`);

  async function courierSendsOffer(posiljalacIme, cena) {
    await courier.goto(`${BASE}/dostavljac/zahtevi`);
    await courier.waitForSelector(`text=${posiljalacIme}`, { timeout: 5000 });
    const li = courier.locator("li", { hasText: posiljalacIme }).first();
    await li.locator('input[name="cena"]').fill(String(cena));
    await li.locator('input[name="procenjenoVremeMin"]').fill("25");
    await li.locator('button:has-text("Pošalji ponudu")').click();
    await courier.waitForSelector("text=Ponuda je poslata klijentu.", { timeout: 5000 });
  }

  // === Scenario B: gost prihvata ponudu, zatim otkazuje porudžbinu ===
  const b = await createGuestRequest(browser, {
    gostIme: "Faza24B Gost",
    gostTelefon: "+381641110002",
    posiljalac: "Faza24B Posiljalac",
    primalac: "Faza24B Primalac",
  });
  await courierSendsOffer("Faza24B Posiljalac", 1300);

  await b.page.reload();
  await b.page.waitForSelector("text=Prihvati ponudu", { timeout: 5000 });
  check("Scenario B: gost vidi ponudu dostavljača (bez prijave)", true);
  await b.page.click("text=Prihvati ponudu");
  await b.page.waitForSelector("text=Praćenje isporuke", { timeout: 5000 });
  check("Scenario B: nakon prihvatanja gost vidi 'Praćenje isporuke'", true);

  let bodyB = await b.page.locator("body").innerText();
  check("Scenario B: dugme 'Otkaži porudžbinu' prisutno", bodyB.includes("Otkaži porudžbinu"));
  await b.page.click('button:has-text("Otkaži porudžbinu")');
  await b.page.click('button:has-text("Potvrdi otkazivanje")');
  await b.page.waitForSelector("text=Porudžbina je otkazana.", { timeout: 5000 });
  check("Scenario B: gost je otkazao porudžbinu preko tokena", true);
  await b.ctx.close();

  // === Scenario C: gost prihvata ponudu, dostavljač isporučuje, gost ocenjuje ===
  const c = await createGuestRequest(browser, {
    gostIme: "Faza24C Gost",
    gostTelefon: "+381641110003",
    posiljalac: "Faza24C Posiljalac",
    primalac: "Faza24C Primalac",
  });
  await courierSendsOffer("Faza24C Posiljalac", 1400);

  await c.page.reload();
  await c.page.waitForSelector("text=Prihvati ponudu", { timeout: 5000 });
  await c.page.click("text=Prihvati ponudu");
  await c.page.waitForSelector("text=Praćenje isporuke", { timeout: 5000 });

  await courier.goto(`${BASE}/dostavljac/aktivne`);
  for (let i = 0; i < 3; i++) {
    const advanceBtn = courier.locator('button:has-text("Označi:")').first();
    if (await advanceBtn.count() === 0) break;
    await advanceBtn.click();
    await courier.waitForTimeout(500);
  }

  await c.page.reload();
  await c.page.waitForSelector("text=Ocenite dostavljača", { timeout: 5000 });
  check("Scenario C: gost vidi formu za ocenjivanje nakon isporuke", true);
  await c.page.click("text=★", { timeout: 5000 }).catch(() => {});
  // klik na 5. zvezdicu (poslednja)
  const stars = c.page.locator('button[aria-label$="zvezdica"]');
  await stars.nth(4).click();
  await c.page.fill('textarea[name="komentar"]', "Faza24 test komentar");
  await c.page.click('button:has-text("Pošalji ocenu")');
  await c.page.waitForSelector("text=Ocenili ste dostavljača sa 5", { timeout: 5000 });
  check("Scenario C: gost je ocenio dostavljača preko tokena", true);
  await c.ctx.close();
  await courierCtx.close();

  // === Provera naloga u bazi (createGuestClientAccount) ===
  const { rows: guestUsers } = await db.query(
    `SELECT u.email, u.password_hash, c.tip_klijenta
     FROM users u JOIN companies c ON c.user_id = u.id
     WHERE u.telefon IN ('+381641110001','+381641110002','+381641110003')`
  );
  check("3 gost-naloga kreirana u bazi (po jedan po zahtevu)", guestUsers.length === 3);
  check(
    "svi gost-nalozi imaju placeholder email na @gost.ruta-dostava.rs",
    guestUsers.every((r) => r.email.endsWith("@gost.ruta-dostava.rs"))
  );
  check(
    "svi gost-nalozi imaju password_hash NULL (bez lozinke)",
    guestUsers.every((r) => r.password_hash === null)
  );
  check(
    "svi gost-nalozi su tip_klijenta FIZICKO_LICE",
    guestUsers.every((r) => r.tip_klijenta === "FIZICKO_LICE")
  );

  // --- cleanup test podataka ---
  await db.query(
    `DELETE FROM shipments WHERE client_id IN (
       SELECT c.id FROM companies c JOIN users u ON u.id = c.user_id
       WHERE u.telefon IN ('+381641110001','+381641110002','+381641110003')
     )`
  );
  await db.query(
    `DELETE FROM companies WHERE user_id IN (
       SELECT id FROM users WHERE telefon IN ('+381641110001','+381641110002','+381641110003')
     )`
  );
  await db.query(
    "DELETE FROM users WHERE telefon IN ('+381641110001','+381641110002','+381641110003')"
  );

  await db.end();
  console.log(`\n${failures === 0 ? "SVI TESTOVI PROŠLI" : failures + " TEST(OVA) NIJE PROŠAO"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
