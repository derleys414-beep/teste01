/*
# Account status and platform admin functions

1. New Tables
- `profiles`: one row per account with its access status. `user_id` links to the sign-in account. `status` is one of `teste` (trial, default for new accounts), `ativo` (active) or `bloqueado` (blocked).

2. New Functions
- `is_platform_admin()`: returns true only for the account whose e-mail is derleys414@gmail.com.
- `admin_list_accounts()`: lists every account with its e-mail and status. Only the platform admin can run it.
- `admin_set_account_status(target, new_status)`: changes an account status to teste, ativo or bloqueado. Only the platform admin can run it, and the admin cannot change their own status.

3. Data Changes
- Every existing account receives a profile row. The admin account starts as `ativo`, the others as `teste`.
- The signup trigger now also creates the profile row for new accounts.

4. Security
- Row level security is enabled on `profiles`. Signed-in users can only read their own row. No client can insert, update or delete profile rows directly, so status changes only happen through the admin function.
- Admin functions check the admin e-mail on the server, before any data is read or changed. They are not callable by anonymous visitors.

5. Important Notes
- The existing channel and sales data is not touched.
- The sales tax setup from the previous change is kept as it is.
*/

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'teste' CHECK (status IN ('teste', 'ativo', 'bloqueado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

INSERT INTO profiles (user_id, status)
SELECT id, CASE WHEN lower(email) = 'derleys414@gmail.com' THEN 'ativo' ELSE 'teste' END
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT lower(u.email) = 'derleys414@gmail.com' FROM auth.users u WHERE u.id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_list_accounts()
RETURNS TABLE (user_id uuid, email text, status text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.user_id, u.email::text, p.status, p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
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

  IF new_status NOT IN ('teste', 'ativo', 'bloqueado') THEN
    RAISE EXCEPTION 'invalid status' USING ERRCODE = '22023';
  END IF;

  IF target = auth.uid() THEN
    RAISE EXCEPTION 'cannot change own status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles
  SET status = new_status, updated_at = now()
  WHERE user_id = target;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'account not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_accounts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_accounts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text) TO authenticated;

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

INSERT INTO public.profiles (user_id, status) VALUES (NEW.id, 'teste')
ON CONFLICT (user_id) DO NOTHING;

RETURN NEW;
END;
$function$;
