/*
# Scope MargemOS data to signed-in accounts

1. Summary
MargemOS now requires sign-in. Every channel, product, price, sale and tax setting belongs to the account that created it. Each new account automatically receives the four default sales channels and the default tax rate.

2. Modified tables
- `channels`, `products`, `product_prices`, `sales`, `settings`: new `user_id` column that defaults to the signed-in user and references the account (deleted together with the account).
- `settings`: the single shared row is replaced by one row per account. The id column now uses a sequence, and the "only id = 1" rule is removed.
- Sample rows created before this change have no owner, so no account can see them. They are kept, not deleted.

3. Security
- Public (anon) access is revoked from every MargemOS table.
- Each table has four policies (select, insert, update, delete) that only allow the owner's rows.
- Product prices and sales can only point to products and channels owned by the same account.
- New function `handle_new_user` runs when an account is created. It is executed by the database only, not by browsers.

4. Important notes
- Email confirmation is not changed by this migration.
- The migration is safe to run again.
*/

ALTER TABLE channels ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE product_prices ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS channels_user_idx ON channels (user_id);
CREATE INDEX IF NOT EXISTS products_user_idx ON products (user_id);
CREATE INDEX IF NOT EXISTS product_prices_user_idx ON product_prices (user_id);
CREATE INDEX IF NOT EXISTS sales_user_idx ON sales (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS settings_user_key ON settings (user_id);

CREATE SEQUENCE IF NOT EXISTS settings_id_seq START 2;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_id_check;
ALTER TABLE settings ALTER COLUMN id SET DEFAULT nextval('settings_id_seq');

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'anon\_%' LOOP
    EXECUTE format('DROP POLICY %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

REVOKE ALL ON channels, products, product_prices, sales, settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON channels, products, product_prices, sales, settings TO authenticated;

DROP POLICY IF EXISTS "select_own_channels" ON channels;
CREATE POLICY "select_own_channels" ON channels FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_channels" ON channels;
CREATE POLICY "insert_own_channels" ON channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_channels" ON channels;
CREATE POLICY "update_own_channels" ON channels FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_channels" ON channels;
CREATE POLICY "delete_own_channels" ON channels FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_product_prices" ON product_prices;
CREATE POLICY "select_own_product_prices" ON product_prices FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_product_prices" ON product_prices;
CREATE POLICY "insert_own_product_prices" ON product_prices FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM channels c WHERE c.id = channel_id AND c.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_product_prices" ON product_prices;
CREATE POLICY "update_own_product_prices" ON product_prices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM channels c WHERE c.id = channel_id AND c.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_product_prices" ON product_prices;
CREATE POLICY "delete_own_product_prices" ON product_prices FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_sales" ON sales;
CREATE POLICY "select_own_sales" ON sales FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sales" ON sales;
CREATE POLICY "insert_own_sales" ON sales FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM channels c WHERE c.id = channel_id AND c.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_sales" ON sales;
CREATE POLICY "update_own_sales" ON sales FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sales" ON sales;
CREATE POLICY "delete_own_sales" ON sales FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.channels (user_id, name, color, commission_pct, fixed_fee) VALUES
    (NEW.id, 'Mercado Livre', '#3730a3', 13.00, 6.00),
    (NEW.id, 'Shopee', '#38bdf8', 14.00, 4.00),
    (NEW.id, 'Amazon', '#14b8a6', 15.00, 0),
    (NEW.id, 'Site próprio', '#94a3b8', 4.50, 0.80);

  INSERT INTO public.settings (user_id, tax_pct) VALUES (NEW.id, 6)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
