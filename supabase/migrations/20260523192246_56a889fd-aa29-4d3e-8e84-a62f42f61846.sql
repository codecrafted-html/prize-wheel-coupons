
-- Prize enum
CREATE TYPE public.spin_prize AS ENUM ('ice_cream','soda','bowl','discount_50');

CREATE TABLE public.spin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  prize public.spin_prize NOT NULL,
  claimed boolean NOT NULL DEFAULT false,
  email text,
  coupon_code text,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_spin_links_slug ON public.spin_links(slug);

ALTER TABLE public.spin_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read a link by slug (campaign is public)
CREATE POLICY "Public can read spin links"
  ON public.spin_links FOR SELECT
  TO anon, authenticated
  USING (true);

-- No direct insert/update from clients — only via the claim_prize function

-- Claim function (security definer) — assigns coupon and email atomically
CREATE OR REPLACE FUNCTION public.claim_prize(_slug text, _email text)
RETURNS TABLE(prize public.spin_prize, coupon_code text, already_claimed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.spin_links%ROWTYPE;
  v_code text;
  v_prefix text;
BEGIN
  -- Basic email sanity check
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;

  SELECT * INTO v_row FROM public.spin_links WHERE slug = _slug FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'link_not_found';
  END IF;

  IF v_row.claimed THEN
    RETURN QUERY SELECT v_row.prize, v_row.coupon_code, true;
    RETURN;
  END IF;

  v_prefix := CASE v_row.prize
    WHEN 'ice_cream' THEN 'ICE'
    WHEN 'soda' THEN 'SODA'
    WHEN 'bowl' THEN 'BOWL'
    WHEN 'discount_50' THEN 'PL50'
  END;

  v_code := v_prefix || '-' || upper(substring(replace(gen_random_uuid()::text,'-',''), 1, 8));

  UPDATE public.spin_links
     SET claimed = true,
         email = lower(_email),
         coupon_code = v_code,
         claimed_at = now()
   WHERE id = v_row.id;

  RETURN QUERY SELECT v_row.prize, v_code, false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_prize(text, text) TO anon, authenticated;

-- Seed 200 unique links with a mix of prizes
INSERT INTO public.spin_links (slug, prize)
SELECT
  lower(substring(replace(gen_random_uuid()::text,'-',''), 1, 10)),
  CASE
    WHEN g <= 40 THEN 'ice_cream'::public.spin_prize
    WHEN g <= 80 THEN 'soda'::public.spin_prize
    WHEN g <= 110 THEN 'bowl'::public.spin_prize
    ELSE 'discount_50'::public.spin_prize
  END
FROM generate_series(1, 200) g;
