import "dotenv/config";
import { pool } from "../src/lib/db";
import { createCompanyAccount } from "../src/lib/queries/companies";
import {
  activateCourier,
  createPreApprovedCourier,
  updateCourierPricing,
} from "../src/lib/queries/couriers";
import { createShipment } from "../src/lib/queries/shipments";
import { createAutoOffers } from "../src/lib/queries/offers";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("Brisanje postojećih podataka...");
  await pool.query(
    `TRUNCATE ratings, orders, offers, shipments, courier_zones, couriers, companies, users RESTART IDENTITY CASCADE`
  );
  await pool.query(
    `UPDATE commission_settings SET procenat = 10.00, updated_at = now() WHERE id = 1`
  );

  console.log("Kreiranje operatera...");
  const opHash = await hashPassword("operator123");
  await pool.query(
    `INSERT INTO users (email, password_hash, role, ime, telefon)
     VALUES ('operater@ruta.rs', $1, 'OPERATOR', 'Operater Platforme', '+381600000000')`,
    [opHash]
  );

  console.log("Kreiranje klijenata...");
  const { company: klijent1 } = await createCompanyAccount({
    email: "klijent1@ruta.rs",
    password: "lozinka123",
    ime: "Ana Jovanović",
    telefon: "+381641111111",
    naziv: "Boja Print d.o.o.",
    pib: "109876543",
    adresa: "Kneza Miloša 10, Beograd",
  });
  const { company: klijent2 } = await createCompanyAccount({
    email: "klijent2@ruta.rs",
    password: "lozinka123",
    ime: "Marko Petrović",
    telefon: "+381642222222",
    naziv: "Zelena Pijaca d.o.o.",
    pib: "108765432",
    adresa: "Bulevar Zorana Đinđića 50, Novi Beograd",
  });

  console.log("Kreiranje i aktivacija dostavljača...");
  const kombiNikola = await createPreApprovedCourier({
    naziv: "Brzi Kombi Nikola",
    telefon: "+381651111111",
    izvorKontakta: "APR",
  });
  await activateCourier({
    courierId: kombiNikola.id,
    email: "dostavljac1@ruta.rs",
    password: "lozinka123",
    telefon: "+381651111111",
    pib: "107654321",
    tipVozila: "KOMBI",
    nosivostKg: 800,
    zones: ["NOVI_BEOGRAD", "ZEMUN", "STARI_GRAD", "SAVSKI_VENAC"],
  });
  await updateCourierPricing(kombiNikola.id, {
    cenaPoKm: 60,
    cenaPoKg: 20,
    minimalnaCena: 400,
    dnevniKapacitet: 8,
    zones: ["NOVI_BEOGRAD", "ZEMUN", "STARI_GRAD", "SAVSKI_VENAC"],
  });

  const markoDostava = await createPreApprovedCourier({
    naziv: "Marko Dostava",
    telefon: "+381652222222",
    izvorKontakta: "Oglasi",
  });
  await activateCourier({
    courierId: markoDostava.id,
    email: "dostavljac2@ruta.rs",
    password: "lozinka123",
    telefon: "+381652222222",
    pib: "106543210",
    tipVozila: "MOTOR",
    nosivostKg: 30,
    zones: ["VRACAR", "ZVEZDARA", "STARI_GRAD", "PALILULA"],
  });
  await updateCourierPricing(markoDostava.id, {
    cenaPoKm: 50,
    cenaPoKg: 15,
    minimalnaCena: 300,
    dnevniKapacitet: 12,
    zones: ["VRACAR", "ZVEZDARA", "STARI_GRAD", "PALILULA"],
  });

  const cukaricaTransport = await createPreApprovedCourier({
    naziv: "Čukarica Transport",
    telefon: "+381653333333",
    izvorKontakta: "APR",
  });
  await activateCourier({
    courierId: cukaricaTransport.id,
    email: "dostavljac3@ruta.rs",
    password: "lozinka123",
    telefon: "+381653333333",
    pib: "105432109",
    tipVozila: "KAMION",
    nosivostKg: 3000,
    zones: ["CUKARICA", "VOZDOVAC", "RAKOVICA"],
  });
  await updateCourierPricing(cukaricaTransport.id, {
    cenaPoKm: 80,
    cenaPoKg: 25,
    minimalnaCena: 600,
    dnevniKapacitet: 5,
    zones: ["CUKARICA", "VOZDOVAC", "RAKOVICA"],
  });

  // Pre-approved, not yet activated — demonstrates KAN-10/KAN-11.
  const novaEkspres = await createPreApprovedCourier({
    naziv: "Nova Ekspres Dostava",
    telefon: "+381654444444",
    izvorKontakta: "APR",
  });

  console.log("Kreiranje pošiljki i ponuda...");
  const standardna = await createShipment({
    clientId: klijent1.id,
    zonaPreuzimanja: "STARI_GRAD",
    zonaIsporuke: "NOVI_BEOGRAD",
    adresaPreuzimanja: "Kneza Miloša 10, Beograd",
    adresaIsporuke: "Bulevar Mihajla Pupina 10, Novi Beograd",
    tip: "SREDNJI_PAKET",
    hitno: false,
    nestandardna: false,
    zeljeniTermin: "DANAS_DO",
    terminDetalji: "do 17h",
    napomena: "Pozvati pre dolaska.",
  });
  await createAutoOffers(standardna);

  await createShipment({
    clientId: klijent2.id,
    zonaPreuzimanja: "CUKARICA",
    zonaIsporuke: "VOZDOVAC",
    adresaPreuzimanja: "Požeška 100, Beograd",
    adresaIsporuke: "Ustanička 64, Beograd",
    tip: "VELIKI_PAKET",
    hitno: false,
    nestandardna: true,
    zeljeniTermin: "ZAKAZANO",
    terminDetalji: "Sutra ujutru",
    napomena: "3 palete povrća, potrebna rampa za utovar.",
  });

  console.log("\nGotovo. Nalozi za prijavu:");
  console.log("  Operater:   operater@ruta.rs / operator123");
  console.log("  Klijent 1:  klijent1@ruta.rs / lozinka123 (Boja Print d.o.o.)");
  console.log("  Klijent 2:  klijent2@ruta.rs / lozinka123 (Zelena Pijaca d.o.o.)");
  console.log("  Dostavljač 1: dostavljac1@ruta.rs / lozinka123 (Brzi Kombi Nikola)");
  console.log("  Dostavljač 2: dostavljac2@ruta.rs / lozinka123 (Marko Dostava)");
  console.log("  Dostavljač 3: dostavljac3@ruta.rs / lozinka123 (Čukarica Transport)");
  console.log(
    `  Neaktiviran dostavljač "Nova Ekspres Dostava" — link za aktivaciju: /aktivacija/${novaEkspres.aktivacioni_token}`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
