/*
# Pending status, activation date and monthly usage milestones

1. Modified Tables
- `profiles`:
  - `status` now accepts `pendente`, `ativo` and `bloqueado`. New accounts start as `pendente`. Accounts previously marked `teste` become `pendente`.
  - New column `activated_at`: the moment the account was last turned `ativo`. It is cleared when the account is blocked or set back to pending, so the count restarts on every new activation.

2. Modified Functions
- `account_is_active()`: only `ativo` accounts can read or change business data. Pending and blocked accounts are denied.
- `admin_set_account_status(target, new_status)`: accepts the three new statuses and records `activated_at` when an account becomes `ativo`.
- `admin_list_accounts()`: also returns `activated_at` and `months_active`, the number of full 30-day periods an active account has completed.
- `handle_new_user()`: new sign-ups get a `pendente` profile.

3. Security
- Row level security policies are unchanged, except that they now require `ativo` instead of "not blocked".
- Only the platform administrator can change statuses or read the account list.

4. Important Notes
- No account, channel, product, price or sale data is removed.
- Admin functions are recreated because their returned columns change.
*/

UPDATE profiles SET status = 'pendente' WHERE status = 'teste';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('pendente', 'ativo', 'bloqueado'));
ALTER TABLE profiles ALTER COLUMN status SET DEFAULT 'pendente';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activated_at timestamptz;

UPDATE profiles SET activated_at = now() WHERE status = 'ativo' AND activated_at IS NULL;

CREATE OR REPLACE FUNCTION public.account_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT p.status = 'ativo' FROM public.profiles p WHERE p.user_id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(target uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF new_status NOT IN ('pendente', 'ativo', 'bloqueado') THEN
    RAISE EXCEPTION 'invalid status' USING ERRCODE = '22023';
  END IF;

  IF target = auth.uid() THEN
    RAISE EXCEPTION 'cannot change own status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET
    status = new_status,
    activated_at = CASE
      WHEN new_status <> 'ativo' THEN NULL
      WHEN public.profiles.status = 'ativo' THEN public.profiles.activated_at
      ELSE now()
    END,
    updated_at = now()
  WHERE user_id = target;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'account not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_list_accounts();

CREATE FUNCTION public.admin_list_accounts()
RETURNS TABLE (user_id uuid, email text, status text, created_at timestamptz, activated_at timestamptz, months_active integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.status,
    p.created_at,
    p.activated_at,
    CASE
      WHEN p.status = 'ativo' AND p.activated_at IS NOT NULL
        THEN floor(extract(epoch FROM (now() - p.activated_at)) / 2592000)::integer
      ELSE NULL
    END
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_accounts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_accounts() TO authenticated;

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

INSERT INTO public.profiles (user_id, status) VALUES (NEW.id, 'pendente')
ON CONFLICT (user_id) DO NOTHING;

RETURN NEW;
END;
$function$;
