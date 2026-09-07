import { chromium } from "playwright";

const BASE = "http://localhost:3100";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  const results = [];

  async function step(name, fn) {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`OK   ${name}`);
    } catch (err) {
      results.push({ name, ok: false, err: String(err) });
      console.log(`FAIL ${name}: ${err}`);
    }
  }

  // ---- Client flow: login, create standard shipment, accept offer ----
  const clientCtx = await browser.newContext();
  const client = await clientCtx.newPage();

  await step("client login", async () => {
    await client.goto(`${BASE}/prijava`);
    await client.fill('input[name="email"]', "klijent1@ruta.rs");
    await client.fill('input[name="password"]', "lozinka123");
    await client.click('form button:has-text("Prijavi se")');
    await client.waitForURL(`${BASE}/klijent`);
  });

  let shipmentUrl;
  await step("client creates standard shipment", async () => {
    await client.goto(`${BASE}/klijent/nova-posiljka`);
    await client.selectOption('select[name="zonaPreuzimanja"]', "STARI_GRAD");
    await client.selectOption('select[name="zonaIsporuke"]', "NOVI_BEOGRAD");
    await client.fill('input[name="adresaPreuzimanja"]', "Testna 1");
    await client.fill('input[name="adresaIsporuke"]', "Testna 2");
    await client.selectOption('select[name="tip"]', "MALI_PAKET");
    await client.selectOption('select[name="zeljeniTermin"]', "ODMAH");
    await client.click('button:has-text("Zatraži ponude")');
    await client.waitForURL(/\/klijent\/posiljke\//);
    shipmentUrl = client.url();
  });

  await step("auto-offer is visible", async () => {
    await client.waitForSelector("text=Prihvati ponudu", { timeout: 5000 });
  });

  await step("client accepts offer", async () => {
    await client.click("text=Prihvati ponudu");
    await client.waitForSelector("text=Praćenje isporuke", { timeout: 5000 });
  });

  // ---- Courier flow: login, advance order status ----
  const courierCtx = await browser.newContext();
  const courier = await courierCtx.newPage();

  await step("courier login", async () => {
    await courier.goto(`${BASE}/prijava`);
    await courier.fill('input[name="email"]', "dostavljac1@ruta.rs");
    await courier.fill('input[name="password"]', "lozinka123");
    await courier.click('button[type="submit"]');
    await courier.waitForURL(`${BASE}/dostavljac`);
  });

  await step("courier sees active delivery and advances status", async () => {
    await courier.goto(`${BASE}/dostavljac/aktivne`);
    await courier.waitForSelector("text=Označi:", { timeout: 5000 });
    // Advance through all steps to ISPORUCENO
    for (let i = 0; i < 3; i++) {
      await courier.click("text=Označi:");
      await courier.waitForTimeout(500);
    }
    await courier.waitForSelector("text=Nedavno završene", { timeout: 5000 });
  });

  // ---- Client rates the delivery ----
  await step("client rates delivery", async () => {
    await client.goto(shipmentUrl);
    await client.waitForSelector("text=Ocenite dostavljača", { timeout: 5000 });
    await client.click('button[aria-label="5 zvezdica"]');
    await client.fill('textarea[name="komentar"]', "Sve odlično, testirano automatski.");
    await client.click('button:has-text("Pošalji ocenu")');
    await client.waitForSelector("text=Ocenili ste dostavljača", { timeout: 5000 });
  });

  // ---- Operator flow: create pre-approved courier, set commission ----
  const opCtx = await browser.newContext();
  const op = await opCtx.newPage();

  await step("operator login", async () => {
    await op.goto(`${BASE}/prijava`);
    await op.fill('input[name="email"]', "operater@ruta.rs");
    await op.fill('input[name="password"]', "operator123");
    await op.click('button[type="submit"]');
    await op.waitForURL(`${BASE}/operater`);
  });

  await step("operator sees commission for completed order", async () => {
    await op.goto(`${BASE}/operater/provizija`);
    await op.waitForSelector("table");
    const bodyText = await op.textContent("body");
    if (!bodyText.includes("RSD")) throw new Error("no RSD amounts rendered");
  });

  let activationToken;
  await step("operator creates pre-approved courier", async () => {
    await op.goto(`${BASE}/operater/dostavljaci`);
    await op.fill('input[name="naziv"]', "Test Kurir Playwright");
    await op.fill('input[name="telefon"]', "+381650000999");
    await op.selectOption('select[name="izvorKontakta"]', "APR");
    await op.click('button:has-text("Kreiraj pre-approved nalog")');
    await op.waitForSelector("text=Test Kurir Playwright", { timeout: 5000 });
    const href = await op
      .locator('li:has-text("Test Kurir Playwright") a[href^="/aktivacija/"]')
      .getAttribute("href");
    activationToken = href?.split("/").pop();
    if (!activationToken) throw new Error("no activation link found");
  });

  const newCourierCtx = await browser.newContext();
  const newCourier = await newCourierCtx.newPage();

  await step("new courier activates account", async () => {
    await newCourier.goto(`${BASE}/aktivacija/${activationToken}`);
    await newCourier.fill('input[name="email"]', "test-kurir-playwright@ruta.rs");
    await newCourier.fill('input[name="password"]', "lozinka123");
    await newCourier.fill('input[name="telefon"]', "+381650000999");
    await newCourier.fill('input[name="pib"]', "111222333");
    await newCourier.selectOption('select[name="tipVozila"]', "KOMBI");
    await newCourier.fill('input[name="nosivostKg"]', "500");
    await newCourier.check('input[name="zona_ZEMUN"]');
    await newCourier.click('button:has-text("Aktiviraj nalog")');
    await newCourier.waitForURL(/\/prijava\?aktivirano=1/);
  });

  await step("newly activated courier can log in", async () => {
    await newCourier.fill('input[name="email"]', "test-kurir-playwright@ruta.rs");
    await newCourier.fill('input[name="password"]', "lozinka123");
    await newCourier.click('form button:has-text("Prijavi se")');
    await newCourier.waitForURL(`${BASE}/dostavljac`);
  });

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
