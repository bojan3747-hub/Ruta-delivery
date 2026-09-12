// Faza 11 verifikacija: javna forma "Prijavite se za saradnju" na landing
// page-u za dostavljače, i njeno pojavljivanje kod operatera.
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

  const visitorCtx = await browser.newContext();
  const visitor = await visitorCtx.newPage();
  const opCtx = await browser.newContext();
  const op = await opCtx.newPage();

  const uniquePhone = `+38160${Date.now().toString().slice(-7)}`;
  const naziv = `Faza11 Test Prevoz ${Date.now()}`;

  // === Check 1: landing page (logged out) shows the new courier pitch + form ===
  await visitor.goto(`${BASE}/`);
  const landingText = await visitor.locator("body").innerText();
  check(
    "landing page shows new courier value-prop copy",
    landingText.includes("Vi određujete cenu") && landingText.includes("Bez pretplate")
  );
  check(
    "landing page shows interest form heading",
    landingText.includes("Prijavite se za saradnju")
  );

  // === Check 2: submit the form with minimal required fields + a couple optional ones ===
  await visitor.fill('input[name="naziv"]', naziv);
  await visitor.fill('input[name="telefon"]', uniquePhone);
  await visitor.fill('input[name="pib"]', "123456789");
  await visitor.selectOption('select[name="tipVozila"]', "KAMION");
  await visitor.fill('input[name="nosivostKg"]', "1000");
  await visitor.check('input[name="zona_ZEMUN"]');
  await visitor.click('button:has-text("Prijavite se za saradnju")');
  await visitor.waitForSelector("text=Hvala!", { timeout: 5000 });
  check("success message shown after submitting interest form", true);

  // === Check 3: form did NOT require login/redirect (still on landing page) ===
  check(
    "still on landing page after submit (no auth required)",
    visitor.url() === `${BASE}/` || visitor.url().startsWith(`${BASE}/?`)
  );

  // === Check 4: operator sees the new pending courier with pre-filled details ===
  await op.goto(`${BASE}/prijava`);
  await op.fill('input[name="email"]', "operater@ruta.rs");
  await op.fill('input[name="password"]', "operator123");
  await op.click('button[type="submit"]');
  await op.waitForURL(`${BASE}/operater`);
  await op.goto(`${BASE}/operater/dostavljaci`);
  await op.waitForLoadState("networkidle");

  const opText = await op.locator("body").innerText();
  check("operator page shows the new lead's naziv", opText.includes(naziv));
  check("operator page shows 'Landing page prijava' as izvor kontakta", opText.includes("Landing page prijava"));
  check("operator page shows vehicle type (Kamion)", opText.includes("Kamion"));
  check("operator page shows nosivost (1000 kg)", opText.includes("1000 kg"));
  check("operator page shows PIB", opText.includes("PIB 123456789"));
  check(
    "operator page shows an activation link for the new lead",
    (await op.locator("li", { hasText: naziv }).locator("text=Link za aktivaciju").count()) === 1
  );

  // === Check 5: submitting the SAME phone number again does not create a duplicate ===
  const visitor2Ctx = await browser.newContext();
  const visitor2 = await visitor2Ctx.newPage();
  await visitor2.goto(`${BASE}/`);
  await visitor2.fill('input[name="naziv"]', "Duplikat pokušaj");
  await visitor2.fill('input[name="telefon"]', uniquePhone);
  await visitor2.click('button:has-text("Prijavite se za saradnju")');
  await visitor2.waitForSelector("text=Hvala!", { timeout: 5000 });

  await op.goto(`${BASE}/operater/dostavljaci`);
  const countWithPhone = await op.locator("li", { hasText: uniquePhone }).count();
  check("duplicate phone submission did not create a second courier row", countWithPhone === 1, `found ${countWithPhone}`);
  const dupText = await op.locator("body").innerText();
  check(
    "original naziv still shown (dedup submission was silently ignored, not overwritten)",
    dupText.includes(naziv) && !dupText.includes("Duplikat pokušaj")
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
