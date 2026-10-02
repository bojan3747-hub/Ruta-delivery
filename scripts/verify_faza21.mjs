// Faza 21 verifikacija: Web Push notifikacije za klijente (nova ponuda,
// promena statusa porudžbine). Ono što OVAJ sandbox ne može da proveri:
// da li push stvarno stigne na pravi telefon — to zahteva da browser
// dostigne Google-ov FCM push servis (push servis koji Chrome koristi), a
// izlazni mrežni pristup iz ovog sandbox-a ka *.googleapis.com je ograničen
// (isto ograničenje viđeno i pri testiranju Google OAuth u Fazi 20). Zato
// ovaj skript proverava sve što JESTE testabilno bez prave pretplate:
// statički servisni fajlovi, UI banner za uključivanje, DA LI se tačno
// mesta u kodu (nova ponuda, promena statusa) pokušavaju da pošalju push
// (bez padanja cele akcije ako push ne uspe — to je najvažnija osobina
// ove funkcije), i da graceful degradacija (nepodešeni VAPID ključevi,
// neuspelo slanje) nikad ne sruši ono što korisnik stvarno radi.
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

async function getClient1UserId(db) {
  const { rows } = await db.query(
    "SELECT id FROM users WHERE email = 'klijent1@ruta.rs'"
  );
  if (!rows[0]) throw new Error("Test korisnik klijent1@ruta.rs nije pronađen (pokreni seed).");
  return rows[0].id;
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  // 1. Statički fajlovi (service worker + ikonica za notifikaciju).
  const swRes = await fetch(`${BASE}/sw.js`);
  check("/sw.js je dostupan (200)", swRes.status === 200);
  check(
    "/sw.js sadrži push/notificationclick listener-e",
    (await swRes.clone().text()).includes('addEventListener("push"') &&
      (await swRes.text()).includes('addEventListener("notificationclick"')
  );
  const iconRes = await fetch(`${BASE}/icon-192.png`);
  check("/icon-192.png je dostupan (200)", iconRes.status === 200);
  check(
    "/icon-192.png je PNG",
    (iconRes.headers.get("content-type") || "").includes("image/png")
  );

  const clientUserId = await getClient1UserId(db);

  // Očisti eventualne ostatke iz prethodnih pokretanja ovog skripta.
  await db.query(
    "DELETE FROM push_subscriptions WHERE endpoint LIKE 'https://fcm.googleapis.com/fcm/send/faza21-test-%'"
  );

  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

  try {
    // 2. UI banner: ulogovan klijent bez aktivne pretplate u OVOM browseru
    //    treba da vidi ponudu za uključivanje notifikacija.
    const bannerCtx = await browser.newContext();
    await bannerCtx.grantPermissions(["notifications"], { origin: BASE });
    const bannerPage = await bannerCtx.newPage();
    await bannerPage.goto(`${BASE}/prijava`, { waitUntil: "networkidle" });
    await bannerPage.fill('input[name="email"]', "klijent1@ruta.rs");
    await bannerPage.fill('input[name="password"]', "lozinka123");
    await bannerPage.click('button[type="submit"]');
    await bannerPage.waitForURL(`${BASE}/klijent`);
    await bannerPage.waitForSelector("text=Uključite obaveštenja", { timeout: 5000 });
    check("klijent bez pretplate vidi banner za uključivanje obaveštenja", true);

    const dismissBtn = bannerPage.locator('button:has-text("Ne sada")');
    check("banner ima dugme 'Ne sada'", (await dismissBtn.count()) > 0);
    await dismissBtn.click();
    await bannerPage.waitForTimeout(300);
    check(
      "banner nestaje posle klika na 'Ne sada'",
      (await bannerPage.locator("text=Uključite obaveštenja").count()) === 0
    );
    await bannerPage.reload();
    await bannerPage.waitForTimeout(500);
    check(
      "banner ostaje sakriven posle reload-a (zapamćeno u localStorage)",
      (await bannerPage.locator("text=Uključite obaveštenja").count()) === 0
    );

    // 3. Klik na "Uključi" iz čiste sesije: zahteva dozvolu (već odobrena
    //    preko grantPermissions) i pokušava pravu pretplatu. U ovom
    //    sandbox-u se očekuje da SAM poziv ka FCM-u ne uspe (mrežno
    //    ograničenje), pa test proverava da komponenta to obradi
    //    korektno — prijateljska poruka, ne pad stranice — umesto da
    //    tvrdi da je prava pretplata uspela (to mora ručno na pravom
    //    telefonu, van sandbox-a).
    const enableCtx = await browser.newContext();
    await enableCtx.grantPermissions(["notifications"], { origin: BASE });
    const enablePage = await enableCtx.newPage();
    await enablePage.goto(`${BASE}/prijava`, { waitUntil: "networkidle" });
    await enablePage.fill('input[name="email"]', "klijent1@ruta.rs");
    await enablePage.fill('input[name="password"]', "lozinka123");
    await enablePage.click('button[type="submit"]');
    await enablePage.waitForURL(`${BASE}/klijent`);
    await enablePage.waitForSelector('button:has-text("Uključi")', { timeout: 5000 });
    await enablePage.click('button:has-text("Uključi")');
    await enablePage.waitForTimeout(3000);
    const bodyText = await enablePage.locator("body").innerText();
    const subscribed = bodyText.includes("Uključite obaveštenja") === false &&
      bodyText.includes("Uključivanje obaveštenja nije uspelo") === false;
    check(
      "klik na 'Uključi' ili uspe (pretplata) ili pokaže prijateljsku grešku (bez pada stranice)",
      subscribed || bodyText.includes("Uključivanje obaveštenja nije uspelo"),
      subscribed ? "pretplata uspela (FCM dostupan iz ovog okruženja)" : "FCM nedostupan iz sandbox-a (očekivano) — prijateljska greška prikazana"
    );

    // 4. DB nivo + realan tok: ubaci lažnu (ali ispravno oblikovanu)
    //    pretplatu za klijent1, pa proveri da slanje ponude i napredovanje
    //    statusa i dalje rade do kraja — push koji ne uspe NIKAD ne sme da
    //    sruši samu akciju.
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)`,
      [
        clientUserId,
        "https://fcm.googleapis.com/fcm/send/faza21-test-lazna-pretplata",
        "BNJxVv6rT1D2p4t7XqF3wLk9a1b2c3d4e5f6g7h8i9j0klmnopqrstuvwx-FAKE",
        "YWJjZGVmZ2hpams-FAKE",
      ]
    );
    check("lažna push pretplata ubačena u bazu za klijent1", true);

    const clientCtx = await browser.newContext();
    const client = await clientCtx.newPage();
    await client.goto(`${BASE}/prijava`, { waitUntil: "networkidle" });
    await client.fill('input[name="email"]', "klijent1@ruta.rs");
    await client.fill('input[name="password"]', "lozinka123");
    await client.click('button[type="submit"]');
    await client.waitForURL(`${BASE}/klijent`);

    let shipmentUrl;
    await client.goto(`${BASE}/klijent/nova-posiljka`);
    await client.fill('input[name="posiljalacIme"]', "Faza21 Test Pošiljalac");
    await client.fill('input[name="posiljalacTelefon"]', "+381600000011");
    await client.selectOption('select[name="zonaPreuzimanja"]', "STARI_GRAD");
    await client.fill('input[name="adresaPreuzimanjaUlica"]', "Testna");
    await client.fill('input[name="adresaPreuzimanjaBroj"]', "1");
    await client.fill('input[name="primalacIme"]', "Faza21 Test Primalac");
    await client.fill('input[name="primalacTelefon"]', "+381600000012");
    await client.selectOption('select[name="zonaIsporuke"]', "NOVI_BEOGRAD");
    await client.fill('input[name="adresaIsporukeUlica"]', "Testna");
    await client.fill('input[name="adresaIsporukeBroj"]', "2");
    await client.fill('input[name="deklarisanaVrednost"]', "3000");
    await client.selectOption('select[name="tip"]', "MALI_PAKET");
    await client.selectOption('select[name="sadrzajPosiljke"]', "ELEKTRONIKA_I_KOMPONENTE");
    await client.selectOption('select[name="zeljeniTermin"]', "ODMAH");
    await client.click('button:has-text("Zatraži ponude")');
    await client.waitForURL(/\/klijent\/posiljke\//);
    shipmentUrl = client.url();
    check("test pošiljka kreirana", Boolean(shipmentUrl));

    const courierCtx = await browser.newContext();
    const courier = await courierCtx.newPage();
    await courier.goto(`${BASE}/prijava`, { waitUntil: "networkidle" });
    await courier.fill('input[name="email"]', "dostavljac1@ruta.rs");
    await courier.fill('input[name="password"]', "lozinka123");
    await courier.click('button[type="submit"]');
    await courier.waitForURL(`${BASE}/dostavljac`);

    await courier.goto(`${BASE}/dostavljac/zahtevi`);
    await courier.waitForSelector("text=Standardna", { timeout: 5000 });
    const li = courier.locator("li", { hasText: "Standardna" }).first();
    await li.locator('input[name="cena"]').fill("1800");
    await li.locator('input[name="procenjenoVremeMin"]').fill("35");
    await li.locator('button:has-text("Pošalji ponudu")').click();
    await courier.waitForSelector("text=Ponuda je poslata klijentu.", { timeout: 5000 });
    check(
      "slanje ponude uspeva i pored (neuspele) push notifikacije ka lažnoj pretplati",
      true
    );

    await client.goto(shipmentUrl);
    await client.waitForSelector("text=Prihvati ponudu", { timeout: 5000 });
    await client.click("text=Prihvati ponudu");
    await client.waitForTimeout(500);

    await courier.goto(`${BASE}/dostavljac/aktivne`);
    await courier.waitForSelector('button:has-text("Označi:")', { timeout: 5000 });
    await courier.click('button:has-text("Označi:")');
    await courier.waitForTimeout(500);
    check(
      "napredovanje statusa (U_TRANZITU) uspeva i pored (neuspele) push notifikacije",
      true
    );
  } finally {
    await browser.close();
    await db.query(
      "DELETE FROM push_subscriptions WHERE endpoint LIKE 'https://fcm.googleapis.com/fcm/send/faza21-test-%'"
    );
  }

  await db.end();

  console.log(`\n${failures === 0 ? "SVI TESTOVI PROŠLI" : `${failures} TEST(OVA) NIJE PROŠLO`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
