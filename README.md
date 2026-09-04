# RUTA — B2B platforma za dostavu (MVP, Beograd)

Agregator dostavljača (kombi prevoznici, kurirske službe) za male i srednje
firme u Beogradu. Klijent unosi pošiljku i dobija ponude; dostavljači
konkurišu automatski (na osnovu sopstvenog cenovnika) ili ručno (za
nestandardne pošiljke).

Ovaj MVP pokriva Jira epic **KAN-4** i priče **KAN-5 do KAN-12** (projekat
KAN, itcapacitynetwork.atlassian.net):

| Priča | Šta pokriva | Gde u kodu |
|---|---|---|
| KAN-5 | Klijent unosi pošiljku, dobija automatsku ponudu | `/klijent/nova-posiljka`, `lib/pricing.ts`, `lib/queries/offers.ts#createAutoOffers` |
| KAN-6 | Klijent upoređuje ponude i bira dostavljača | `/klijent/posiljke/[id]`, `lib/queries/offers.ts#acceptOffer` |
| KAN-7 | Klijent prati status pošiljke, istorija | `/klijent/posiljke/[id]`, `/klijent`, `lib/queries/orders.ts#advanceOrder` |
| KAN-8 | Dostavljač podešava cenovnik | `/dostavljac/cenovnik` |
| KAN-9 | Dostavljač šalje ručnu ponudu (15 min rok) | `/dostavljac/zahtevi` |
| KAN-10 | Dostavljač aktivira pre-approved nalog | `/aktivacija/[token]` |
| KAN-11 | Operater kreira pre-approved naloge | `/operater/dostavljaci` |
| KAN-12 | Provizija po realizovanoj dostavi | `/operater/provizija`, `lib/queries/orders.ts#advanceOrder` |

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + TypeScript
- **Tailwind CSS v4**
- **PostgreSQL** — u produkciji Supabase ili Neon; lokalno običan Postgres
- Bez naplate/plaćanja za sada (samo obračun procenta provizije, bez
  integracije sa platnim sistemom)

### O Prisma šemi i zašto app ne koristi Prisma Client

`prisma/schema.prisma` dokumentuje kompletan data model i predviđen je za
korišćenje sa `npx prisma migrate dev` / `npx prisma generate` **kada projekat
radi na mašini sa normalnim internet pristupom**. U sandboxu u kom je ovaj
kod pisan, odlazni pristup ka `binaries.prisma.sh` (odakle Prisma preuzima
svoj engine) je bio blokiran mrežnom politikom, pa Prisma CLI ovde uopšte
nije mogao da se pokrene — ni `prisma generate`, ni `prisma migrate`.

Zato app u ovom repou razgovara sa Postgres-om direktno preko `pg` drajvera:

- `db/schema.sql` — kompletna SQL šema (ista kao Prisma šema), primenjuje se
  sa `npm run db:push`
- `src/lib/db.ts` — `pg` connection pool
- `src/lib/types.ts` — ručno pisani TS tipovi koji prate šemu
- `src/lib/queries/*.ts` — tipizirane funkcije za čitanje/pisanje po entitetu

Ovo je potpuno funkcionalan pristup i ništa ne treba menjati da bi app radio.
Ako želite da pređete na Prisma Client (npr. na mašini/CI-ju gde
binaries.prisma.sh nije blokiran), `prisma/schema.prisma` je već spreman —
samo pokrenite `npm run prisma:migrate` i zamenite pozive u `lib/queries/`
Prisma Client pozivima.

## Pokretanje lokalno

Potreban je lokalni Postgres (ili connection string ka Supabase/Neon instanci).

```bash
npm install

cp .env.example .env
# upišite pravi DATABASE_URL i generišite SESSION_SECRET, npr:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run db:setup   # primeni db/schema.sql + ubaci test podatke
npm run dev        # http://localhost:3000
```

Test nalozi (iz `npm run db:seed`):

| Uloga | Email | Lozinka |
|---|---|---|
| Operater | `operater@ruta.rs` | `operator123` |
| Klijent — Boja Print d.o.o. | `klijent1@ruta.rs` | `lozinka123` |
| Klijent — Zelena Pijaca d.o.o. | `klijent2@ruta.rs` | `lozinka123` |
| Dostavljač — Brzi Kombi Nikola | `dostavljac1@ruta.rs` | `lozinka123` |
| Dostavljač — Marko Dostava | `dostavljac2@ruta.rs` | `lozinka123` |
| Dostavljač — Čukarica Transport | `dostavljac3@ruta.rs` | `lozinka123` |

Seed takođe kreira jedan **neaktiviran** (pre-approved) nalog dostavljača
("Nova Ekspres Dostava") — link za aktivaciju se ispisuje u konzoli nakon
`npm run db:seed`, a isti link je uvek vidljiv i operateru na
`/operater/dostavljaci`.

## Deploy (Vercel + Supabase/Neon)

1. Napravite Postgres bazu (Supabase ili Neon) i uzmite connection string.
2. Na Vercel-u podesite env promenljive `DATABASE_URL` i `SESSION_SECRET`.
3. Pre prvog deploy-a primenite šemu: `DATABASE_URL="..." npm run db:push`
   (može i lokalno, samo uperite `DATABASE_URL` na produkcionu bazu), pa po
   želji `npm run db:seed` za test podatke.
4. Push na Vercel — build je standardan `next build`, bez dodatnih koraka.

## Cenovnik / auto-ponude — kako se računa cena

Za standardne pošiljke, cena po dostavljaču se računa iz njegovog cenovnika
(`lib/pricing.ts`):

```
cena = max(minimalna_cena, cena_po_km × km + cena_po_kg × pretpostavljena_težina)
       × 1.2 ako je pošiljka hitna
```

`km` je udaljenost između zona preuzimanja/isporuke iz statične tabele u
`lib/zones.ts` (10 beogradskih zona/opština, aproksimativne razdaljine — nije
prava ruting/mapping integracija, dovoljno za MVP demo). Pretpostavljena
težina zavisi od tipa pošiljke (dokument/mali/srednji/veliki paket), pošto
klijent u formi ne unosi tačnu težinu.

## Poznata ograničenja MVP-a (namerno pojednostavljeno)

- **Fotografija pošiljke**: u formi nema pravog upload-a fajla (trebalo bi
  cloud storage, npr. Vercel Blob ili Supabase Storage) — polje postoji u
  šemi (`fotografija_url`) ali ga forma trenutno ne popunjava.
- **Notifikacije**: KAN-9 traži push + SMS obaveštenje dostavljaču o novom
  zahtevu; ovde dostavljač vidi zahtev kad otvori `/dostavljac/zahtevi` (bez
  stvarnog push/SMS provajdera).
- **Rok od 15 minuta** za ručne ponude (KAN-9) se proverava u trenutku
  učitavanja stranice (nema cron/background job); dovoljno za MVP jer i
  klijent i dostavljač aktivno gledaju stranicu.
- **Distance/ruting**: aproksimativna statična tabela, ne prava mapa/API.
- **Plaćanje**: samo obračun procenta provizije po porudžbini, bez
  integracije sa platnim procesorom (u skladu sa "bez naplate za sada").

## Provera da sve radi

`scripts/smoke-test.mjs` je Playwright skripta koja end-to-end proverava sve
priče (login, nova pošiljka → auto ponuda → prihvatanje → praćenje statusa →
ocena, kao i cenovnik/ručna ponuda/aktivacija naloga/provizija na operater
strani). Pokreće se nad build-ovanom app-om:

```bash
npm run build && npm run start -- -p 3100 &
node scripts/smoke-test.mjs
```
