/*
# Create MargemOS core schema (single-tenant, no sign-in)

1. New Tables
- `channels`: sales channels (Mercado Livre, Shopee, Amazon, Site próprio) with commission % and fixed fee per sale.
- `products`: SKUs with name and unit cost.
- `product_prices`: sale price and shipping cost of each product on each channel.
- `sales`: sales records with a snapshot of the fees applied at the time of sale, so historical profit never changes when rates change.
- `settings`: single-row table holding the global sales tax rate (imposto sobre vendas).

2. Security
- RLS enabled on every table.
- anon + authenticated get the verbs the app uses. No sign-in exists, so the anon key must read and write.
- Policies are intentionally public because the data is a single-tenant shared workspace.

3. Notes
- Money values use numeric(12,2); percentages are stored as plain percent numbers (e.g. 16.5 means 16.5%).
- Seed data is inserted separately by the app setup and is not part of this migration.
*/

CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#4f46e5',
  commission_pct numeric(6,2) NOT NULL DEFAULT 0 CHECK (commission_pct >= 0 AND commission_pct < 100),
  fixed_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_prices (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  shipping numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  PRIMARY KEY (product_id, channel_id)
);

CREATE INDEX IF NOT EXISTS product_prices_channel_idx ON product_prices (channel_id);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost numeric(12,2) NOT NULL CHECK (unit_cost >= 0),
  unit_shipping numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_shipping >= 0),
  commission_pct numeric(6,2) NOT NULL CHECK (commission_pct >= 0),
  fixed_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  tax_pct numeric(6,2) NOT NULL CHECK (tax_pct >= 0),
  sold_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_sold_at_idx ON sales (sold_at);
CREATE INDEX IF NOT EXISTS sales_channel_idx ON sales (channel_id);
CREATE INDEX IF NOT EXISTS sales_product_idx ON sales (product_id);

CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tax_pct numeric(6,2) NOT NULL DEFAULT 6 CHECK (tax_pct >= 0 AND tax_pct < 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (id, tax_pct) VALUES (1, 6) ON CONFLICT (id) DO NOTHING;

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON channels TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_prices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_channels" ON channels;
CREATE POLICY "anon_select_channels" ON channels FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_channels" ON channels;
CREATE POLICY "anon_insert_channels" ON channels FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_channels" ON channels;
CREATE POLICY "anon_update_channels" ON channels FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_channels" ON channels;
CREATE POLICY "anon_delete_channels" ON channels FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_product_prices" ON product_prices;
CREATE POLICY "anon_select_product_prices" ON product_prices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_product_prices" ON product_prices;
CREATE POLICY "anon_insert_product_prices" ON product_prices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_product_prices" ON product_prices;
CREATE POLICY "anon_update_product_prices" ON product_prices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_product_prices" ON product_prices;
CREATE POLICY "anon_delete_product_prices" ON product_prices FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_sales" ON sales;
CREATE POLICY "anon_select_sales" ON sales FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sales" ON sales;
CREATE POLICY "anon_insert_sales" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sales" ON sales;
CREATE POLICY "anon_update_sales" ON sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sales" ON sales;
CREATE POLICY "anon_delete_sales" ON sales FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE TO anon, authenticated USING (true);
