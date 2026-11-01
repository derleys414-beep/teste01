/*
# Block accounts with status 'bloqueado' from all business data

1. New Functions
- `account_is_active()`: returns true when the signed-in account exists and its status is not `bloqueado`. It returns false for anonymous visitors and for accounts without a profile.

2. Modified Tables (policies only)
- `channels`, `products`, `product_prices`, `sales`, `settings`: every read and write policy now also requires `account_is_active()`. The ownership checks stay exactly as they were.

3. Security
- Blocked accounts cannot read or change channels, products, prices, sales or settings, even when calling the data API directly.
- The profile status policy is unchanged, so a blocked user can still load their profile and see the blocked-account screen.
- No data is changed or removed.

4. Important Notes
- The function runs with the caller's own permissions. It only reads the caller's own profile row, which the profile policy already allows.
- Administrators keep access through their profile status, which is set to `ativo`.
*/

CREATE OR REPLACE FUNCTION public.account_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT p.status <> 'bloqueado' FROM public.profiles p WHERE p.user_id = auth.uid()),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.account_is_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.account_is_active() TO authenticated;

-- channels
DROP POLICY IF EXISTS "select_own_channels" ON channels;
CREATE POLICY "select_own_channels" ON channels FOR SELECT
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "insert_own_channels" ON channels;
CREATE POLICY "insert_own_channels" ON channels FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "update_own_channels" ON channels;
CREATE POLICY "update_own_channels" ON channels FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active())
  WITH CHECK (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "delete_own_channels" ON channels;
CREATE POLICY "delete_own_channels" ON channels FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

-- products
DROP POLICY IF EXISTS "select_own_products" ON products;
CREATE POLICY "select_own_products" ON products FOR SELECT
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "insert_own_products" ON products;
CREATE POLICY "insert_own_products" ON products FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "update_own_products" ON products;
CREATE POLICY "update_own_products" ON products FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active())
  WITH CHECK (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "delete_own_products" ON products;
CREATE POLICY "delete_own_products" ON products FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

-- product_prices
DROP POLICY IF EXISTS "select_own_product_prices" ON product_prices;
CREATE POLICY "select_own_product_prices" ON product_prices FOR SELECT
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "insert_own_product_prices" ON product_prices;
CREATE POLICY "insert_own_product_prices" ON product_prices FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND public.account_is_active()
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_prices.product_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM channels c WHERE c.id = product_prices.channel_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_product_prices" ON product_prices;
CREATE POLICY "update_own_product_prices" ON product_prices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active())
  WITH CHECK (
    auth.uid() = user_id AND public.account_is_active()
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_prices.product_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM channels c WHERE c.id = product_prices.channel_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_product_prices" ON product_prices;
CREATE POLICY "delete_own_product_prices" ON product_prices FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

-- sales
DROP POLICY IF EXISTS "select_own_sales" ON sales;
CREATE POLICY "select_own_sales" ON sales FOR SELECT
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "insert_own_sales" ON sales;
CREATE POLICY "insert_own_sales" ON sales FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id AND public.account_is_active()
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = sales.product_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM channels c WHERE c.id = sales.channel_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_sales" ON sales;
CREATE POLICY "update_own_sales" ON sales FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active())
  WITH CHECK (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "delete_own_sales" ON sales;
CREATE POLICY "delete_own_sales" ON sales FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

-- settings
DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active())
  WITH CHECK (auth.uid() = user_id AND public.account_is_active());

DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id AND public.account_is_active());
