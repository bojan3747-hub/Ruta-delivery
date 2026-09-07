// Kreira jedan pravi operater nalog, bez diranja ostalih podataka
// (za razliku od seed.ts, koji briše sve i ubacuje test podatke).
//
// Upotreba: npx tsx scripts/create-operator.ts email lozinka "Ime Prezime" telefon
import "dotenv/config";
import { pool } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const [email, password, ime, telefon] = process.argv.slice(2);

  if (!email || !password || !ime) {
    console.error(
      'Upotreba: npx tsx scripts/create-operator.ts email lozinka "Ime Prezime" [telefon]'
    );
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Lozinka mora imati bar 6 karaktera.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await pool.query(
    `INSERT INTO users (email, password_hash, role, ime, telefon)
     VALUES ($1, $2, 'OPERATOR', $3, $4)`,
    [email.toLowerCase().trim(), passwordHash, ime, telefon ?? null]
  );

  console.log(`Operater nalog kreiran: ${email}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
