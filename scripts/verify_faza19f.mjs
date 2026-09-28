// Faza 19f verifikacija: landing page kopija/pozicioniranje ažurirano da
// odražava i angažovanje mašina i B2C (fizička lica), bez brisanja
// postojećeg B2B sadržaja o prevozu pošiljki (H1, "Koji problem
// rešavamo", "Kako radi", CTA za dostavljače).
import "dotenv/config";
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

  // === Anonimni posetilac ===
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`${BASE}/`);
  await anon.waitForLoadState("networkidle");
  const anonText = await anon.locator("body").innerText();
  // Bedževi u hero sekciji koriste CSS `uppercase` (text-transform), pa
  // `innerText` vraća VIZUELNI (velikim slovima) tekst iako je izvorni JSX
  // string mešovite veličine slova — poređenje za njih mora biti case-
  // insensitive.
  const anonTextLower = anonText.toLowerCase();

  // Novo pozicioniranje (B2C + mašine).
  check(
    "hero prikazuje novi bedž 'Dostava za firme i pojedince'",
    anonTextLower.includes("dostava za firme i pojedince")
  );
  check(
    "hero prikazuje najavu 'Novo: angažovanje mašina'",
    anonTextLower.includes("novo: angažovanje mašina")
  );
  check(
    "nova sekcija za angažovanje mašina je prisutna",
    anonText.includes("Treba vam mini bager, valjak ili dizalica")
  );
  check(
    "sekcija za mašine pominje da je dostupna firmama i fizičkim licima",
    anonText.includes("Dostupno i za firme i za fizička lica")
  );
  check(
    "sekcija za mašine objašnjava da je uvek sa rukovaocem",
    anonText.includes("Mašina uvek sa rukovaocem")
  );
  check(
    "CTA dugme za anonimnog posetioca vodi na registraciju",
    (await anon.getByRole("link", { name: "Angažujte mašinu" }).getAttribute("href")) === "/registracija"
  );

  // Postojeći B2B prevoz sadržaj NIJE izmenjen/uklonjen.
  check("H1 i dalje 'Kombi prevoz i dostava za firme u Beogradu'", anonText.includes("Kombi prevoz i dostava za"));
  check("sekcija 'Koji problem rešavamo' i dalje prisutna", anonText.includes("Koji problem rešavamo"));
  check(
    "B2B opis problema nepromenjen",
    anonText.includes("Firmama je dostava retko potpuno predvidljiva")
  );
  check("sekcija 'Kako radi' i dalje prisutna", anonText.includes("Kako radi"));
  check(
    "CTA sekcija za dostavljače i dalje prisutna",
    anonText.includes("Vozite kombi ili kamionet? Zaradite dodatno uz Ruta-Dostavu.")
  );
  check(
    "dodatna napomena za dostavljače o mašinama je dodata (aditivno)",
    anonText.includes("Imate i mašinu sa rukovaocem")
  );

  // === Klijent (ulogovan) ===
  const clientCtx = await browser.newContext();
  const client = await clientCtx.newPage();
  await client.goto(`${BASE}/prijava`);
  await client.fill('input[name="email"]', "klijent1@ruta.rs");
  await client.fill('input[name="password"]', "lozinka123");
  await client.click('button[type="submit"]');
  await client.waitForURL(`${BASE}/klijent`);
  await client.goto(`${BASE}/`);
  await client.waitForLoadState("networkidle");
  check(
    "ulogovan klijent vidi CTA 'Angažujte mašinu' ka formi za zahtev",
    (await client.getByRole("link", { name: "Angažujte mašinu" }).getAttribute("href")) === "/klijent/masine/novo"
  );

  // === Dostavljač (ulogovan) ===
  const courierCtx = await browser.newContext();
  const courier = await courierCtx.newPage();
  await courier.goto(`${BASE}/prijava`);
  await courier.fill('input[name="email"]', "dostavljac1@ruta.rs");
  await courier.fill('input[name="password"]', "lozinka123");
  await courier.click('button[type="submit"]');
  await courier.waitForURL(`${BASE}/dostavljac`);
  await courier.goto(`${BASE}/`);
  await courier.waitForLoadState("networkidle");
  check(
    "ulogovan dostavljač vidi CTA 'Dodajte svoje mašine' ka profilu mašina",
    (await courier.getByRole("link", { name: "Dodajte svoje mašine" }).getAttribute("href")) === "/dostavljac/masine"
  );

  // === Operater (ulogovan) — ne vidi CTA namenjen klijentu/dostavljaču ===
  const opCtx = await browser.newContext();
  const op = await opCtx.newPage();
  await op.goto(`${BASE}/prijava`);
  await op.fill('input[name="email"]', "operater@ruta.rs");
  await op.fill('input[name="password"]', "operator123");
  await op.click('button[type="submit"]');
  await op.waitForURL(`${BASE}/operater`);
  await op.goto(`${BASE}/`);
  await op.waitForLoadState("networkidle");
  check(
    "operater ne vidi CTA 'Angažujte mašinu' niti 'Dodajte svoje mašine'",
    (await op.getByRole("link", { name: "Angažujte mašinu" }).count()) === 0 &&
      (await op.getByRole("link", { name: "Dodajte svoje mašine" }).count()) === 0
  );
  check(
    "operater i dalje vidi sekciju o angažovanju mašina (samo bez CTA)",
    (await op.locator("body").innerText()).includes("Treba vam mini bager, valjak ili dizalica")
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
