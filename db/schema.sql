-- RUTA — MVP schema
--
-- NOTE ON TOOLING: this app talks to Postgres directly through the `pg`
-- driver (see src/lib/db.ts) instead of through the Prisma Client. The
-- Prisma schema at prisma/schema.prisma still documents the same data
-- model and is kept for when the project runs somewhere with normal
-- internet access, where `npx prisma migrate dev` / `npx prisma generate`
-- work as usual — inside this build sandbox, outbound access to
-- binaries.prisma.sh (needed to download Prisma's engine) is blocked by
-- network policy, so the CLI cannot fetch its engine here. Everything in
-- this file is applied with `npm run db:push` (see package.json), which
-- runs it through a plain `pg` client connection (scripts/db-push.mjs) —
-- no system `psql` binary required.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('CLIENT', 'COURIER', 'OPERATOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE zone AS ENUM (
    'STARI_GRAD', 'VRACAR', 'SAVSKI_VENAC', 'NOVI_BEOGRAD', 'ZEMUN',
    'ZVEZDARA', 'VOZDOVAC', 'CUKARICA', 'PALILULA', 'RAKOVICA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('MOTOR', 'PUTNICKO_VOZILO', 'KOMBI', 'KAMION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE courier_status AS ENUM ('NA_POTVRDI', 'AKTIVAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE courier_status ADD VALUE IF NOT EXISTS 'SUSPENDOVAN';

DO $$ BEGIN
  CREATE TYPE shipment_type AS ENUM ('DOKUMENT', 'MALI_PAKET', 'SREDNJI_PAKET', 'VELIKI_PAKET');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE termin_type AS ENUM ('ODMAH', 'DANAS_DO', 'ZAKAZANO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM ('OTVORENA', 'PONUDE_STIGLE', 'IZABRANA', 'ZAVRSENA', 'OTKAZANA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE offer_type AS ENUM ('AUTOMATSKA', 'RUCNA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('POSLATA', 'PRIHVACENA', 'ODBIJENA', 'ISTEKLA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PREUZETO', 'U_TRANZITU', 'NA_ISPORUCI', 'ISPORUCENO', 'OTKAZANO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('NEPLACENO', 'NAPLACENO', 'NEUSPESNO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rating_direction AS ENUM ('KLIJENT_KA_DOSTAVLJACU', 'DOSTAVLJAC_KA_KLIJENTU');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Faza 8: tip sačuvane adrese — za koga se koristi (filtrira dropdown u
-- formi nove pošiljke na pošiljaoca/primaoca/oba).
DO $$ BEGIN
  CREATE TYPE address_type AS ENUM ('POSILJALAC', 'PRIMALAC', 'OBA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Faza 5: "Sadržaj pošiljke" — spisak preuzet sa Bex Express (bexexpress.rs/najava).
DO $$ BEGIN
  CREATE TYPE shipment_content AS ENUM (
    'AUTO_DELOVI_I_OPREMA', 'BEBI_OPREMA_I_DECIJE_STVARI', 'BELA_TEHNIKA',
    'DOKUMENT', 'DVORISTE_I_BASTA', 'ELEKTRONIKA_I_KOMPONENTE', 'GALANTERIJA',
    'GARDEROBA', 'GRADJEVINSKA_I_ELEKTRO_OPREMA_I_MATERIJAL', 'IGRACKE_I_IGRE',
    'KNJIGE', 'KOMPJUTERI', 'KOZMETIKA_I_OPREMA', 'KUCNI_APARATI',
    'LOV_I_RIBOLOV', 'MOBILNI_TELEFONI', 'MUZICKI_INSTRUMENTI', 'NAMESTAJ',
    'OBUCA', 'POLJOPRIVREDA_I_OPREMA', 'SPORTSKA_OPREMA', 'CASOPIS',
    'SKOLSKI_PRIBOR_I_KANCELARIJSKA_OPREMA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Faza 5: "Posebna kategorija tereta" (opciono, dodatno pored "tip") — spisak
-- preuzet sa Bex Express "Tip pošiljke" dropdown-a, bez stavke "Standardna".
DO $$ BEGIN
  CREATE TYPE special_cargo_type AS ENUM (
    'BACVA_209L', 'KURIRSKA_LISTA_DOSTAVA', 'KURIR_DAN', 'BICIKL',
    'EURO_PALETA_CELA', 'TELEVIZOR_DO_55_INCA', 'GUMA_PUTNICKA',
    'GUMA_POLUTERETNA', 'GUMA_TERETNA', 'MENJAC_MANJI', 'MENJAC_AUTOMATSKI',
    'MOTOR_AUTO', 'TRAKTORSKA_GUMA', 'TRAKTORSKA_GUMA_SA_FELNOM',
    'GUMA_PUTNICKA_SA_FELNOM', 'GUMA_POLUTERETNA_SA_FELNOM',
    'GUMA_TERETNA_SA_FELNOM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          role NOT NULL,
  ime           TEXT NOT NULL,
  telefon       TEXT,
  uslovi_prihvaceni_at TIMESTAMPTZ,
  reset_token             UUID,
  reset_token_expires_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dodato posle prvog izdanja; ALTER (pored kolone gore) da bi stiglo i na
-- baze koje već imaju tabelu users.
ALTER TABLE users ADD COLUMN IF NOT EXISTS uslovi_prihvaceni_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  naziv      TEXT NOT NULL,
  pib        TEXT,
  adresa     TEXT,
  ocena_prosek NUMERIC(3, 2),
  broj_ocena   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS ocena_prosek NUMERIC(3, 2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS broj_ocena INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS couriers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  naziv             TEXT NOT NULL,
  telefon           TEXT NOT NULL,
  email             TEXT,
  pib               TEXT,
  tip_vozila        vehicle_type,
  nosivost_kg       NUMERIC(10, 2),
  cena_po_km        NUMERIC(10, 2),
  cena_po_kg        NUMERIC(10, 2),
  minimalna_cena    NUMERIC(10, 2),
  dnevni_kapacitet  INTEGER NOT NULL DEFAULT 0,
  status            courier_status NOT NULL DEFAULT 'NA_POTVRDI',
  dostupan          BOOLEAN NOT NULL DEFAULT true,
  verifikovan       BOOLEAN NOT NULL DEFAULT false,
  izvor_kontakta    TEXT,
  ocena_prosek      NUMERIC(3, 2),
  broj_ocena        INTEGER NOT NULL DEFAULT 0,
  aktivacioni_token UUID NOT NULL DEFAULT gen_random_uuid(),
  payment_customer_token TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dodato posle prvog izdanja; ALTER (pored kolone gore) da bi stiglo i na
-- baze koje već imaju tabelu couriers. Kolona se zvala payu_customer_token
-- dok je provajder za naplatu bio predviđen kao PayU; posle se ispostavilo
-- da PayU ne pokriva Srbiju, pa je preimenovana pre nego što je ijedan red
-- ikad upisan u nju.
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS payment_customer_token TEXT;
ALTER TABLE couriers DROP COLUMN IF EXISTS payu_customer_token;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS dostupan BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS verifikovan BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS courier_zones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  zone       zone NOT NULL,
  UNIQUE (courier_id, zone)
);

CREATE TABLE IF NOT EXISTS shipments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  zona_preuzimanja    zone NOT NULL,
  zona_isporuke       zone NOT NULL,
  adresa_preuzimanja  TEXT NOT NULL,
  adresa_isporuke     TEXT NOT NULL,
  posiljalac_ime      TEXT,
  posiljalac_telefon  TEXT,
  primalac_ime        TEXT,
  primalac_telefon    TEXT,
  tip                 shipment_type NOT NULL,
  hitno               BOOLEAN NOT NULL DEFAULT false,
  nestandardna        BOOLEAN NOT NULL DEFAULT false,
  zeljeni_termin      termin_type NOT NULL DEFAULT 'ODMAH',
  termin_detalji      TEXT,
  napomena            TEXT,
  deklarisana_vrednost NUMERIC(10, 2),
  status              shipment_status NOT NULL DEFAULT 'OTVORENA',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sender/receiver contact fields added post-launch (Faza 3) — ADD COLUMN
-- IF NOT EXISTS so this stays safe to re-run against a database where the
-- table above already existed without these columns.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS posiljalac_ime TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS posiljalac_telefon TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS primalac_ime TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS primalac_telefon TEXT;

-- Added after the initial release; ALTER (not just the column above) so it
-- also lands on databases that already have a shipments table.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS deklarisana_vrednost NUMERIC(10, 2);

-- Faza 5: nullable at the DB level (postojeće pošiljke nemaju vrednost) —
-- "Sadržaj pošiljke" je obavezno polje samo na nivou forme/server akcije za
-- NOVE pošiljke, ne kao NOT NULL ovde (izbegava migraciju postojećih redova).
-- "Posebna kategorija tereta" je uvek opciono.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS sadrzaj_posiljke shipment_content;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS posebna_kategorija_tereta special_cargo_type;

-- Prava udaljenost/ruta (umesto ručne tabele zona) — koordinate obe adrese
-- (dobijene geokodiranjem konačnog teksta adrese pri kreiranju pošiljke) i
-- stvarna vozna udaljenost preko Mapbox Directions API-ja. Sve nullable:
-- geokodiranje/ruting je best-effort mrežni poziv koji NIKAD ne sme da
-- blokira kreiranje pošiljke — kad ne uspe (adresa nije prepoznata, mreža,
-- itd.), kolone ostaju NULL i cena/ETA padaju nazad na procenu po zonama
-- (vidi src/lib/pricing.ts).
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS preuzimanje_lat DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS preuzimanje_lon DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS isporuka_lat DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS isporuka_lon DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS udaljenost_km NUMERIC(6, 2);

-- Faza 8: pravo polje datum+vreme za termin "Zakazano" (ranije je
-- termin_detalji bio jedino slobodan tekst za sve termine osim "Odmah").
-- Nullable, koristi se samo kad je zeljeni_termin = 'ZAKAZANO' — za
-- "Danas do" ostaje termin_detalji kao slobodan tekst (nije menjano).
-- termin_detalji se i dalje popunjava (formatiranim tekstom) i za
-- "Zakazano", da bi svi postojeći prikazi ostali nepromenjeni.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS zakazano_datum_vreme TIMESTAMPTZ;
-- fotografija_url je bila neiskorišćena kolona (nikad povezana ni sa jednim
-- ekranom) — foto-dokaz o isporuci sada čuva zasebna tabela ispod, po istom
-- obrascu kao opsti_uslovi_dokumenti (da SELECT * na shipments ne vuče BYTEA).
ALTER TABLE shipments DROP COLUMN IF EXISTS fotografija_url;

CREATE TABLE IF NOT EXISTS shipment_fotografije (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id  UUID UNIQUE NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  sadrzaj      BYTEA NOT NULL,
  content_type TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  naziv      TEXT NOT NULL,
  adresa     TEXT NOT NULL,
  zona       zone NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Faza 8: tip (za koga važi adresa) + poštanski broj. Podrazumevano 'OBA'
-- za tip, da postojeće sačuvane adrese (pre ove izmene) ostanu vidljive u
-- oba dropdown-a (pošiljaoca i primaoca) kao i do sada, bez migracije.
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS tip address_type NOT NULL DEFAULT 'OBA';
ALTER TABLE saved_addresses ADD COLUMN IF NOT EXISTS postanski_broj TEXT;

CREATE TABLE IF NOT EXISTS offers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id           UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  courier_id            UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  cena                  NUMERIC(10, 2) NOT NULL,
  procenjeno_vreme_min  INTEGER NOT NULL,
  napomena              TEXT,
  tip                   offer_type NOT NULL,
  status                offer_status NOT NULL DEFAULT 'POSLATA',
  rok_isteka            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, courier_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id       UUID UNIQUE NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  offer_id          UUID UNIQUE NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  courier_id        UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  cena              NUMERIC(10, 2) NOT NULL,
  provizija         NUMERIC(10, 2),
  status            order_status NOT NULL DEFAULT 'PREUZETO',
  otkazano_razlog   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dodato posle prvog izdanja; ALTER (pored kolone gore) da bi stiglo i na
-- baze koje već imaju tabelu orders.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS otkazano_razlog TEXT;

-- Faza 9: timestamp za svaku promenu statusa porudžbine. "Ponuda
-- prihvaćena" je već pokriveno postojećom created_at kolonom (porudžbina
-- se pravi u tom trenutku) — ove dve kolone pokrivaju preostala dva
-- koraka. Nullable: postojeće porudžbine (pre ove izmene) nemaju ove
-- podatke i ostaju NULL.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preuzeto_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS isporuceno_at TIMESTAMPTZ;

-- Faza 9: pojednostavljenje statusa porudžbine na "Primio ponudu" /
-- "Preuzeo ponudu" / "Isporučio" (korisnikova odluka, 2026-09-10) — stariji
-- NA_ISPORUCI status se spaja sa U_TRANZITU pod istim novim nazivom
-- "Preuzeo ponudu". Enum vrednost 'NA_ISPORUCI' namerno OSTAJE u tipu
-- order_status (Postgres ne dozvoljava lako brisanje enum vrednosti), ali
-- se od ove faze više nikad ne dodeljuje novim prelazima — vidi NEXT_STATUS
-- u src/lib/queries/orders.ts. Ovaj UPDATE je bezbedno ponovo pokretati
-- (posle prve primene nema više redova sa NA_ISPORUCI, pa ne radi ništa).
UPDATE orders SET status = 'U_TRANZITU' WHERE status = 'NA_ISPORUCI';

CREATE TABLE IF NOT EXISTS ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  smer       rating_direction NOT NULL DEFAULT 'KLIJENT_KA_DOSTAVLJACU',
  ocena      SMALLINT NOT NULL CHECK (ocena BETWEEN 1 AND 5),
  komentar   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dodato posle prvog izdanja da bi ocenjivanje bilo obostrano (dostavljač
-- takođe ocenjuje klijenta), ne samo klijent -> dostavljač kao ranije.
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS smer rating_direction NOT NULL DEFAULT 'KLIJENT_KA_DOSTAVLJACU';
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_order_id_key;
DO $$ BEGIN
  ALTER TABLE ratings ADD CONSTRAINT ratings_order_id_smer_key UNIQUE (order_id, smer);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS commission_settings (
  id         SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  procenat   NUMERIC(5, 2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO commission_settings (id, procenat)
VALUES (1, 10.00)
ON CONFLICT (id) DO NOTHING;

-- Mesečna faktura provizije po dostavljaču (KAN-12 nastavak): operater
-- generiše po jednu fakturu po dostavljaču za svaki kalendarski mesec u
-- kom je dostavljač imao isporučene porudžbine. Naplata (servis za
-- naplatu, kartica na dosijeu iz couriers.payment_customer_token) je
-- posebna, kasnija faza — ova tabela samo prati iznos i status po periodu.
CREATE TABLE IF NOT EXISTS commission_invoices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id         UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  period_start       DATE NOT NULL,
  period_end         DATE NOT NULL,
  iznos              NUMERIC(10, 2) NOT NULL,
  status             invoice_status NOT NULL DEFAULT 'NEPLACENO',
  naplata_referenca  TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  placeno_at         TIMESTAMPTZ,
  UNIQUE (courier_id, period_start)
);

-- Opšti uslovi korišćenja kao PDF. Svaki upload operatera dodaje novi red
-- (istorija se čuva); "važeći" dokument je uvek onaj sa najnovijim
-- created_at. Fajl se čuva direktno u bazi (bytea) — nema potrebe za
-- posebnim cloud storage nalogom za ovako mali, retko menjan fajl.
CREATE TABLE IF NOT EXISTS opsti_uslovi_dokumenti (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naziv_fajla TEXT NOT NULL,
  sadrzaj     BYTEA NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipments_client ON shipments(client_id);
CREATE INDEX IF NOT EXISTS idx_offers_shipment ON offers(shipment_id);
CREATE INDEX IF NOT EXISTS idx_offers_courier ON offers(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_zones_courier ON courier_zones(courier_id);
CREATE INDEX IF NOT EXISTS idx_commission_invoices_courier ON commission_invoices(courier_id);
