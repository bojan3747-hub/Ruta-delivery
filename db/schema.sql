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
  tip                 shipment_type NOT NULL,
  hitno               BOOLEAN NOT NULL DEFAULT false,
  nestandardna        BOOLEAN NOT NULL DEFAULT false,
  zeljeni_termin      termin_type NOT NULL DEFAULT 'ODMAH',
  termin_detalji      TEXT,
  napomena            TEXT,
  fotografija_url     TEXT,
  deklarisana_vrednost NUMERIC(10, 2),
  status              shipment_status NOT NULL DEFAULT 'OTVORENA',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added after the initial release; ALTER (not just the column above) so it
-- also lands on databases that already have a shipments table.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS deklarisana_vrednost NUMERIC(10, 2);

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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
