// Faza 19d verifikacija: strana provajdera za angažovanje mašina — zahtevi
// (otvoreni, po zoni/tipu mašine), ručna ponuda, prihvatanje ponude na
// klijentskoj strani, tok statusa Prihvaćeno → Na lokaciji → Završeno, i
// otkazivanje posle prihvatanja.
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
    // machine_offers se briše kaskadno sa machine_requests (ON DELETE CASCADE).
    await client.query(
      `DELETE FROM machine_requests WHERE client_id IN (
         SELECT c.id FROM companies c JOIN users u ON u.id = c.user_id
         WHERE u.email = 'klijent1@ruta.rs'
       )`
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

  // === Klijent kreira DVA zahteva: jedan za "srećan tok", jedan za otkazivanje ===
  const clientCtx = await browser.newContext();
  const client = await clientCtx.newPage();
  await client.goto(`${BASE}/prijava`);
  await client.fill('input[name="email"]', "klijent1@ruta.rs");
  await client.fill('input[name="password"]', "lozinka123");
  await client.click('button[type="submit"]');
  await client.waitForURL(`${BASE}/klijent`);

  // dostavljac1 ("Brzi Kombi Nikola") pokriva NOVI_BEOGRAD i nudi MINI_BAGER.
  const happyId = await createMachineRequestAsClient(client, {
    zona: "NOVI_BEOGRAD",
    ulica: "Bulevar Mihajla Pupina",
    broj: "10",
    tip: "MINI_BAGER",
    opis: "Kopanje temelja za garažu, uzak pristup.",
  });
  const cancelId = await createMachineRequestAsClient(client, {
    zona: "NOVI_BEOGRAD",
    ulica: "Jurija Gagarina",
    broj: "50",
    tip: "MINI_BAGER",
    opis: "Ravnanje dvorišta pre polaganja ploča.",
  });
  check("oba zahteva kreirana", Boolean(happyId) && Boolean(cancelId));

  // === Dostavljac1: vidi oba zahteva u "Zahtevi za mašine", cena je prefilled ===
  const courierCtx = await browser.newContext();
  const courier = await courierCtx.newPage();
  await courier.goto(`${BASE}/prijava`);
  await courier.fill('input[name="email"]', "dostavljac1@ruta.rs");
  await courier.fill('input[name="password"]', "lozinka123");
  await courier.click('button[type="submit"]');
  await courier.waitForURL(`${BASE}/dostavljac`);

  await courier.goto(`${BASE}/dostavljac/masine/zahtevi`);
  await courier.waitForLoadState("networkidle");
  const zahteviText = await courier.locator("body").innerText();
  check("dostavljac1 vidi oba zahteva u svojoj zoni/mašini", (zahteviText.match(/Mini bager/g) ?? []).length >= 2);
  const firstCenaInput = courier.locator('input[name="cena"]').first();
  check("cena je prefilled iz cenovnika mašine (3500)", await firstCenaInput.inputValue() === "3500");

  // === Dostavljac2 (bez mašina) ne vidi NIŠTA ===
  const courier2Ctx = await browser.newContext();
  const courier2 = await courier2Ctx.newPage();
  await courier2.goto(`${BASE}/prijava`);
  await courier2.fill('input[name="email"]', "dostavljac2@ruta.rs");
  await courier2.fill('input[name="password"]', "lozinka123");
  await courier2.click('button[type="submit"]');
  await courier2.waitForURL(`${BASE}/dostavljac`);
  await courier2.goto(`${BASE}/dostavljac/masine/zahtevi`);
  await courier2.waitForLoadState("networkidle");
  check(
    "dostavljac2 (bez podešenih mašina) ne vidi nijedan zahtev",
    (await courier2.locator("body").innerText()).includes("Trenutno nema otvorenih zahteva")
  );

  // === Dostavljac1 šalje ponudu za "happy" zahtev ===
  const happyCard = courier.locator("li", { hasText: "Kopanje temelja" });
  await happyCard.locator('input[name="cena"]').fill("4000");
  await happyCard.locator('input[name="procenaTrajanja"]').fill("pola dana");
  await happyCard.locator('button:has-text("Pošalji ponudu")').click();
  await courier.waitForSelector("text=Ponuda je poslata klijentu.", { timeout: 5000 });
  check("ponuda uspešno poslata (poruka prikazana)", true);

  // Posle slanja ponude, taj zahtev nestaje iz otvorene liste za OVOG dostavljača.
  await courier.goto(`${BASE}/dostavljac/masine/zahtevi`);
  await courier.waitForLoadState("networkidle");
  const afterOfferText = await courier.locator("body").innerText();
  check(
    "zahtev nestaje iz liste dostavljača posle slanja ponude",
    !afterOfferText.includes("Kopanje temelja") && afterOfferText.includes("Ravnanje dvorišta")
  );

  // === Klijent vidi ponudu i prihvata je ===
  await client.goto(`${BASE}/klijent/masine/${happyId}`);
  await client.waitForLoadState("networkidle");
  const offerPageText = await client.locator("body").innerText();
  check("klijent vidi ponudu izvođača", offerPageText.includes("Brzi Kombi Nikola"));
  check("klijent vidi procenu trajanja", offerPageText.includes("pola dana"));
  await client.click('button:has-text("Prihvati ponudu")');
  await client.waitForTimeout(1000);
  const afterAcceptText = await client.locator("body").innerText();
  check("posle prihvatanja status postaje 'Prihvaćeno'", afterAcceptText.includes("Prihvaćeno"));
  check("posle prihvatanja prikazana dogovorena cena", afterAcceptText.includes("4.000") || afterAcceptText.includes("4000"));
  check("posle prihvatanja prikazan izvođač", afterAcceptText.includes("Brzi Kombi Nikola"));

  // === Dostavljac1: vidi angažovanje u "Aktivna angažovanja", napreduje kroz statuse ===
  await courier.goto(`${BASE}/dostavljac/masine/aktivna`);
  await courier.waitForLoadState("networkidle");
  check("dostavljac1 vidi prihvaćeno angažovanje", (await courier.locator("body").innerText()).includes("Kopanje temelja"));
  await courier.click('button:has-text("Označi: Na lokaciji")');
  await courier.waitForTimeout(800);
  check("status napreduje na 'Na lokaciji'", (await courier.locator("body").innerText()).includes("Na lokaciji"));
  await courier.click('button:has-text("Označi: Završeno")');
  await courier.waitForTimeout(800);
  const finishedText = await courier.locator("body").innerText();
  check(
    "posle završetka, angažovanje je u 'Nedavno završena'",
    finishedText.includes("Nedavno završena") && finishedText.includes("Bulevar Mihajla Pupina")
  );
  check("nema više dugmeta za napredovanje statusa", (await courier.locator('button:has-text("Označi:")').count()) === 0);

  // === Klijent vidi finalni status 'Završeno' ===
  await client.goto(`${BASE}/klijent/masine/${happyId}`);
  const finalClientText = await client.locator("body").innerText();
  check("klijent vidi finalni status 'Završeno'", finalClientText.includes("Završeno"));

  // === Drugi zahtev: dostavljac1 šalje ponudu, klijent prihvata, PA se otkazuje ===
  await courier.goto(`${BASE}/dostavljac/masine/zahtevi`);
  await courier.waitForLoadState("networkidle");
  const cancelCard = courier.locator("li", { hasText: "Ravnanje dvorišta" });
  await cancelCard.locator('input[name="procenaTrajanja"]').fill("2 sata");
  await cancelCard.locator('button:has-text("Pošalji ponudu")').click();
  await courier.waitForSelector("text=Ponuda je poslata klijentu.", { timeout: 5000 });

  await client.goto(`${BASE}/klijent/masine/${cancelId}`);
  await client.waitForLoadState("networkidle");
  await client.click('button:has-text("Prihvati ponudu")');
  await client.waitForTimeout(800);
  check("drugi zahtev takođe prihvaćen", (await client.locator("body").innerText()).includes("Prihvaćeno"));

  // Otkazivanje POSLE prihvatanja (sa razlogom) — klijent otkazuje.
  await client.click('button:has-text("Otkaži angažovanje")');
  await client.fill('input[placeholder="npr. mašina se pokvarila"]', "Predomislili smo se");
  await client.click('button:has-text("Potvrdi otkazivanje")');
  await client.waitForTimeout(800);
  const afterCancelText = await client.locator("body").innerText();
  check("posle otkazivanja status je 'Otkazano'", afterCancelText.includes("Otkazano"));
  check("razlog otkazivanja je prikazan", afterCancelText.includes("Predomislili smo se"));

  // Dostavljac1 vidi da je angažovanje nestalo iz aktivnih.
  await courier.goto(`${BASE}/dostavljac/masine/aktivna`);
  await courier.waitForLoadState("networkidle");
  check(
    "otkazano angažovanje više nije u aktivnim kod dostavljača",
    !(await courier.locator("body").innerText()).includes("Ravnanje dvorišta")
  );

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
  await browser.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
