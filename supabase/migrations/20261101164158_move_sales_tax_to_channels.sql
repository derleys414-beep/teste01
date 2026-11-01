/*
# Move sales tax from the account setting to each channel

1. Modified Tables
- `channels`: new column `tax_pct` (numeric, 0 to 100, default 6). It is the sales tax charged on every sale made through that channel.

2. Data Changes
- Existing channels of each account receive the tax value that the account currently has in its settings, so profit numbers do not change for past setups.
- The signup trigger now seeds the default channels with the 6% tax directly, and no longer creates a settings row.

3. Security
- No policy or grant changes. The existing owner-only policies on `channels` already cover the new column.

4. Important Notes
- The `settings` table is kept untouched and is no longer read by the app. Nothing is dropped, so no data is lost.
- Sales keep the tax they were recorded with, as before.
*/

ALTER TABLE channels ADD COLUMN IF NOT EXISTS tax_pct numeric(5,2) NOT NULL DEFAULT 6 CHECK (tax_pct >= 0 AND tax_pct <= 100);

UPDATE channels c
SET tax_pct = s.tax_pct
FROM settings s
WHERE s.user_id = c.user_id
  AND c.user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
INSERT INTO public.channels (user_id, name, color, commission_pct, fixed_fee, tax_pct) VALUES
(NEW.id, 'Mercado Livre', '#3730a3', 13.00, 6.00, 6),
(NEW.id, 'Shopee', '#38bdf8', 14.00, 4.00, 6),
(NEW.id, 'Amazon', '#14b8a6', 15.00, 0, 6),
(NEW.id, 'Site próprio', '#94a3b8', 4.50, 0.80, 6);

RETURN NEW;
END;
$function$;
