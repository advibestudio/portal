-- ============================================================================
--  MIGRATION 3 — free strategy-session requests
--  Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
--  Needed ONLY if you already ran schema.sql / migration-2 before. (New project? Just run the
--  updated schema.sql — it already includes this.) Safe to run more than once.
--  It lets the website's new "free strategy session" form save its requests as their own
--  kind of lead (source = "strategy"). Nothing else changes.
-- ============================================================================

-- ---------- the ONLY door visitors can use to create a lead (now country-aware) ----------
create or replace function public.submit_lead(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  new_ref       text;
  real_price    numeric;
  real_currency text;
  cc            text;
begin
  if coalesce(length(trim(p->>'name')), 0) < 2
     or coalesce(length(regexp_replace(coalesce(p->>'whatsapp',''), '\D', '', 'g')), 0) < 7 then
    raise exception 'invalid lead';
  end if;

  cc := upper(left(coalesce(nullif(p->>'countryCode',''), 'NG'), 3));

  -- Look the price up from the website content for THAT country, so nobody can tamper with it from their browser.
  select (c->'prices'->>(p->>'offerId'))::numeric, c->>'currency'
    into real_price, real_currency
  from public.site_content sc, jsonb_array_elements(coalesce(sc.content->'countries', '[]'::jsonb)) c
  where upper(c->>'code') = cc
  limit 1;

  -- Older saved content (before countries existed) only has the single Nigerian price.
  if real_price is null and cc = 'NG' then
    select (o->>'price')::numeric into real_price
    from public.site_content sc, jsonb_array_elements(coalesce(sc.content->'offers', '[]'::jsonb)) o
    where o->>'id' = p->>'offerId'
    limit 1;
  end if;

  insert into public.leads
    (ref, name, business, whatsapp, email, offer_id, offer_name, price, industry, product, event, notes, utm_source,
     country, currency, source, show_public)
  values (
    'AV-' || nextval('public.lead_ref_seq'),
    left(trim(p->>'name'), 120),
    left(p->>'business', 160),
    left(p->>'whatsapp', 40),
    left(p->>'email', 160),
    left(p->>'offerId', 60),
    left(p->>'offerName', 120),
    coalesce(real_price, nullif(p->>'price','')::numeric, 0),
    left(p->>'industry', 80),
    left(p->>'product', 300),
    left(p->>'event', 120),
    left(p->>'notes', 2000),
    left(p->>'utmSource', 80),
    cc,
    left(coalesce(real_currency, nullif(p->>'currency',''), 'NGN'), 8),
    -- website visitors can only create a normal website order or a strategy-session request
    case when p->>'source' = 'strategy' then 'strategy' else 'website' end,
    coalesce((p->>'showPublic')::boolean, false)
  )
  returning ref into new_ref;

  return new_ref;
end;
$$;

revoke all on function public.submit_lead(jsonb) from public;
grant execute on function public.submit_lead(jsonb) to anon, authenticated;

