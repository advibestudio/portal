-- ============================================================================
--  MIGRATION 2 — countries, manual orders, "just started" pop-ups
--  Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
--  Use it if you ALREADY ran the original schema.sql. (If you are setting up a
--  brand-new project, just run the updated schema.sql instead — no need for this.)
--  Safe to run more than once. Your existing leads are kept (they become Nigeria / NGN).
-- ============================================================================

alter table public.leads add column if not exists country     text    default 'NG';
alter table public.leads add column if not exists currency    text    default 'NGN';
alter table public.leads add column if not exists source      text    not null default 'website';
alter table public.leads add column if not exists show_public boolean not null default false;

-- lets YOU add an order by hand in the admin (the database numbers it for you)
alter table public.leads alter column ref set default ('AV-' || nextval('public.lead_ref_seq'));

create index if not exists leads_public_idx on public.leads (created_at desc) where show_public;

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
    'website',
    coalesce((p->>'showPublic')::boolean, false)
  )
  returning ref into new_ref;

  return new_ref;
end;
$$;

revoke all on function public.submit_lead(jsonb) from public;
grant execute on function public.submit_lead(jsonb) to anon, authenticated;

-- ---------- the "just started" pop-ups: ONLY first name + country, ONLY people who agreed ----------
create or replace function public.recent_orders(lim int default 10, hours int default 72)
returns table (first_name text, country text, created_at timestamptz)
language sql security definer stable set search_path = public as $$
  select left(split_part(trim(l.name), ' ', 1), 24) as first_name, l.country, l.created_at
  from public.leads l
  where l.show_public
    and l.source = 'website'
    and l.created_at > now() - make_interval(hours => least(greatest(coalesce(hours, 72), 1), 720))
    and length(trim(l.name)) >= 2
  order by l.created_at desc
  limit least(greatest(coalesce(lim, 10), 1), 20);
$$;

revoke all on function public.recent_orders(int, int) from public;
grant execute on function public.recent_orders(int, int) to anon, authenticated;
