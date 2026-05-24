DROP POLICY IF EXISTS "Public can read spin links" ON public.spin_links;

CREATE POLICY "No direct read access"
  ON public.spin_links FOR SELECT
  USING (false);

CREATE OR REPLACE FUNCTION public.get_spin_link(_slug text)
RETURNS TABLE(slug text, prize spin_prize, claimed boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT slug, prize, claimed FROM public.spin_links WHERE slug = _slug LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_spin_link(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_spin_link(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_spin_links(_passphrase text)
RETURNS TABLE(slug text, prize spin_prize, claimed boolean, email text, coupon_code text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF _passphrase IS NULL OR _passphrase <> 'PokeLoco2026!' THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT s.slug, s.prize, s.claimed, s.email, s.coupon_code, s.created_at
    FROM public.spin_links s ORDER BY s.created_at ASC LIMIT 500;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_spin_links(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_spin_links(text) TO anon, authenticated;