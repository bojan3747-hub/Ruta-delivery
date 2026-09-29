// Faza 20 verifikacija: Google SSO za klijente ("Nastavi sa Google" na
// /prijava i /registracija). Sandbox okruženje NEMA podešen
// GOOGLE_CLIENT_ID/SECRET, pa se puni end-to-end tok (pravi Google consent
// ekran) ne može automatizovati ovde — taj deo mora ručno da proveri
// korisnik na produkciji posle podešavanja Google Cloud Console-a. Ovaj
// skript pokriva sve što JESTE testabilno bez pravog Google naloga:
// UI prisustvo dugmeta, graceful degradaciju kad kredencijali nisu
// podešeni, state/cookie zaštitu na callback ruti, "sesija istekla"
// fallback, DB nivo (password_hash NULL poruka pri loginu, UNIQUE
// google_id), i (sa privremenim drugim serverom + lažnim kredencijalima)
// tačan sadržaj redirekcije ka accounts.google.com.
import "dotenv/config";
import { chromium } from "playwright";
import { Client } from "pg";
import { spawn } from "node:child_process";

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

async function cleanupTestUser(client) {
  await client.query("DELETE FROM users WHERE email = $1", [
    "faza20-google-test@example.com",
  ]);
}

async function main() {
  const dbClient = new Client({ connectionString: process.env.DATABASE_URL });
  await dbClient.connect();
  await cleanupTestUser(dbClient);

  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage();

  try {
    // 1. Dugme prisutno na /prijava i vodi na /auth/google.
    await page.goto(`${BASE}/prijava`, { waitUntil: "networkidle" });
    const prijavaHref = await page
      .locator('a:has-text("Nastavi sa Google nalogom")')
      .first()
      .getAttribute("href");
    check(
      "/prijava sadrži link 'Nastavi sa Google nalogom' -> /auth/google",
      prijavaHref === "/auth/google",
      `dobijeno: ${prijavaHref}`
    );

    // 2. Dugme prisutno na /registracija i vodi na /auth/google.
    await page.goto(`${BASE}/registracija`, { waitUntil: "networkidle" });
    const registracijaHref = await page
      .locator('a:has-text("Nastavi sa Google nalogom")')
      .first()
      .getAttribute("href");
    check(
      "/registracija sadrži link 'Nastavi sa Google nalogom' -> /auth/google",
      registracijaHref === "/auth/google",
      `dobijeno: ${registracijaHref}`
    );

    // 3. Bez podešenih kredencijala, /auth/google redirektuje na
    //    /prijava?greska=google_nepodesen sa prijateljskom porukom.
    await page.goto(`${BASE}/auth/google`, { waitUntil: "networkidle" });
    const urlPosleNepodesen = page.url();
    check(
      "/auth/google (bez kredencijala) redirektuje na greska=google_nepodesen",
      urlPosleNepodesen.includes("/prijava") &&
        urlPosleNepodesen.includes("greska=google_nepodesen")
    );
    const nepodesenText = await page.locator("body").innerText();
    check(
      "poruka 'nije podešena' prikazana na /prijava",
      nepodesenText.includes("nije podešena"),
      nepodesenText.slice(0, 200)
    );

    // 4. /registracija/google bez pending kolačića -> "Sesija je istekla".
    await page.context().clearCookies();
    await page.goto(`${BASE}/registracija/google`, { waitUntil: "networkidle" });
    const istekloText = await page.locator("body").innerText();
    check(
      "/registracija/google (bez pending profila) prikazuje 'Sesija je istekla'",
      istekloText.includes("Sesija je istekla"),
      istekloText.slice(0, 200)
    );
    check(
      "/registracija/google fallback ima link nazad na /registracija",
      (await page.locator('a[href="/registracija"]').count()) > 0
    );

    // 5. /auth/google/callback bez validnog state kolačića (ili sa
    //    pogrešnim state-om) -> redirekcija na /prijava?greska=google.
    await page.context().clearCookies();
    await page.goto(`${BASE}/auth/google/callback?code=x&state=pogresan`, {
      waitUntil: "networkidle",
    });
    const urlPosleCallback = page.url();
    check(
      "/auth/google/callback (bez state kolačića) redirektuje na greska=google",
      urlPosleCallback.includes("/prijava") &&
        urlPosleCallback.includes("greska=google")
    );
    const callbackGreskaText = await page.locator("body").innerText();
    check(
      "poruka o neuspešnoj Google prijavi prikazana na /prijava",
      callbackGreskaText.includes("Prijava preko Google-a nije uspela")
    );

    // 6. DB nivo: nalog kreiran preko Google-a (password_hash NULL,
    //    google_id postavljen) -> login sa lozinkom daje specifičnu poruku,
    //    ne generičku "pogrešan email ili lozinka".
    const insertResult = await dbClient.query(
      `INSERT INTO users (email, password_hash, role, ime, telefon, uslovi_prihvaceni_at, google_id)
       VALUES ($1, NULL, 'CLIENT', 'Test Google Korisnik', '0601234567', now(), $2)
       RETURNING id`,
      ["faza20-google-test@example.com", "google-sub-test-12345"]
    );
    check("test Google nalog kreiran u bazi (password_hash NULL)", insertResult.rows.length === 1);

    await page.context().clearCookies();
    await page.goto(`${BASE}/prijava`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', "faza20-google-test@example.com");
    await page.fill('input[name="password"]', "bilokojasifra");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(800);
    const loginGoogleText = await page.locator("body").innerText();
    check(
      "login sa lozinkom na Google-only nalog daje poruku 'kreiran preko Google naloga'",
      loginGoogleText.includes("kreiran preko Google naloga"),
      loginGoogleText.slice(0, 300)
    );

    // 7. UNIQUE constraint na google_id odbija duplikat.
    let duplicateRejected = false;
    try {
      await dbClient.query(
        `INSERT INTO users (email, password_hash, role, ime, telefon, uslovi_prihvaceni_at, google_id)
         VALUES ($1, NULL, 'CLIENT', 'Drugi Test', '0607654321', now(), $2)`,
        ["faza20-google-test-2@example.com", "google-sub-test-12345"]
      );
    } catch (err) {
      duplicateRejected = /unique|duplicate/i.test(String(err.message));
    }
    check("google_id UNIQUE constraint odbija duplikat", duplicateRejected);
    await dbClient.query("DELETE FROM users WHERE email = $1", [
      "faza20-google-test-2@example.com",
    ]);
  } finally {
    await browser.close();
    await cleanupTestUser(dbClient);
  }

  // 8. Sa lažnim (ali podešenim) kredencijalima, /auth/google mora tačno
  //    redirektovati ka accounts.google.com sa svim očekivanim parametrima.
  //    Pokreće se privremena druga instanca servera (drugi port) sa
  //    ubačenim env varijablama, bez diranja pravog .env fajla.
  await new Promise((resolve, reject) => {
    const TEST_PORT = 3101;
    // detached: true puts the child in its own process group — "next start"
    // via npx spawns a further "next-server" child of its own, and killing
    // only the npx pid leaves that grandchild holding the port. Killing the
    // whole group (negative pid) takes all of them down together.
    const child = spawn("npx", ["next", "start", "-p", String(TEST_PORT)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        GOOGLE_CLIENT_ID: "fake-client-id-za-test",
        GOOGLE_CLIENT_SECRET: "fake-client-secret-za-test",
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });

    let settled = false;
    const finish = (err) => {
      if (settled) return;
      settled = true;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
      if (err) reject(err);
      else resolve();
    };

    const timeout = setTimeout(() => finish(new Error("timeout čekanja na test server")), 30000);

    let buf = "";
    let readyHandled = false;
    child.stdout.on("data", (d) => {
      buf += d.toString();
      if (!readyHandled && /Ready in|started server/i.test(buf)) {
        readyHandled = true;
        clearTimeout(timeout);
        (async () => {
          try {
            const res = await fetch(`http://localhost:${TEST_PORT}/auth/google`, {
              redirect: "manual",
            });
            const location = res.headers.get("location") || "";
            check(
              "sa podešenim (lažnim) kredencijalima /auth/google redirektuje ka accounts.google.com",
              location.startsWith("https://accounts.google.com/o/oauth2/v2/auth")
            );
            const loc = new URL(location || "https://invalid/");
            check("redirect URL sadrži client_id", loc.searchParams.get("client_id") === "fake-client-id-za-test");
            check(
              "redirect URL sadrži redirect_uri ka /auth/google/callback",
              (loc.searchParams.get("redirect_uri") || "").endsWith("/auth/google/callback")
            );
            check("redirect URL sadrži scope openid email profile", loc.searchParams.get("scope") === "openid email profile");
            check("redirect URL sadrži response_type=code", loc.searchParams.get("response_type") === "code");
            check("redirect URL sadrži neprazan state parametar", Boolean(loc.searchParams.get("state")));
            finish();
          } catch (err) {
            finish(err);
          }
        })();
      }
    });
    child.stderr.on("data", () => {});
    child.on("error", (err) => finish(err));
    child.on("exit", () => {
      if (!settled) finish(new Error("test server se ugasio pre nego što je bio spreman"));
    });
  }).catch((err) => {
    check("privremeni test server sa lažnim Google kredencijalima", false, String(err));
  });

  await dbClient.end();

  console.log(`\n${failures === 0 ? "SVI TESTOVI PROŠLI" : `${failures} TEST(OVA) NIJE PROŠLO`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
