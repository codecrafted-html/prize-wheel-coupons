CREATE OR REPLACE FUNCTION public.generate_coupon_code(_prize public.spin_prize)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  prefix text;
  candidate text;
  exists_already boolean;
BEGIN
  IF _prize IN ('no_win', 'try_again') THEN RETURN NULL; END IF;
  prefix := CASE _prize
    WHEN 'ice_cream' THEN 'ICE'
    WHEN 'soda' THEN 'SODA'
    WHEN 'bowl' THEN 'BOWL'
    WHEN 'discount_50' THEN 'D50'
    WHEN 'side_dish' THEN 'SIDE'
    ELSE 'PL'
  END;
  LOOP
    candidate := 'PL-' || prefix || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    SELECT EXISTS (SELECT 1 FROM public.spin_links WHERE coupon_code = candidate) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN candidate;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.generate_coupon_code(public.spin_prize) FROM PUBLIC, anon, authenticated;

UPDATE public.spin_links SET coupon_code = public.generate_coupon_code(prize) WHERE coupon_code IS NULL AND prize NOT IN ('no_win','try_again');
CREATE UNIQUE INDEX IF NOT EXISTS spin_links_coupon_code_key ON public.spin_links (coupon_code);

CREATE OR REPLACE FUNCTION public.assign_coupon_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.coupon_code IS NULL THEN
    NEW.coupon_code := public.generate_coupon_code(NEW.prize);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.assign_coupon_code() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS spin_links_assign_coupon ON public.spin_links;
CREATE TRIGGER spin_links_assign_coupon
BEFORE INSERT ON public.spin_links
FOR EACH ROW EXECUTE FUNCTION public.assign_coupon_code();

CREATE OR REPLACE FUNCTION public.claim_prize(_slug text, _email text)
RETURNS TABLE(prize spin_prize, coupon_code text, already_claimed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.spin_links%ROWTYPE;
  v_code text;
BEGIN
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  SELECT * INTO v_row FROM public.spin_links WHERE slug = _slug FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'link_not_found'; END IF;
  IF v_row.claimed THEN
    RETURN QUERY SELECT v_row.prize, v_row.coupon_code, true;
    RETURN;
  END IF;
  v_code := COALESCE(v_row.coupon_code, public.generate_coupon_code(v_row.prize));
  UPDATE public.spin_links
     SET claimed = true, email = lower(_email), coupon_code = v_code, claimed_at = now()
   WHERE id = v_row.id;
  RETURN QUERY SELECT v_row.prize, v_code, false;
END;
$$;