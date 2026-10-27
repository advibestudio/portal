-- ============================================================================
--  ADVIBE STUDIO — DATABASE SETUP  (paste this whole file into Supabase)
--  Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
--  It is safe to run more than once.
--
--  What this creates:
--    profiles      who is on your team (owner / ops)        -> staff only
--    site_content  all the website text, prices, videos     -> anyone can READ, staff can EDIT
--    leads         orders (website + typed-in by staff)     -> visitors can only SUBMIT (via a function), staff can read/edit
--    projects      client work you're producing             -> staff only
--    audit_log     "who changed what"                       -> staff only
-- ============================================================================

-- ---------- tables ----------
create table if not exists public.profiles (
  id   uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('owner', 'ops'))
);

create table if not exists public.site_content (
  id         int primary key default 1 check (id = 1),   -- only ever one row
  content    jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

create sequence if not exists public.lead_ref_seq    start 1044;
create sequence if not exists public.project_ref_seq start 1026;

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  ref            text unique not null default ('AV-' || nextval('public.lead_ref_seq')),
  created_at     timestamptz not null default now(),
  name           text not null,
  business       text,
  whatsapp       text not null,
  email          text,
  offer_id       text,
  offer_name     text,
  price          numeric not null default 0,
  industry       text,
  product        text,
  event          text,
  notes          text,
  status         text not null default 'New'    check (status in ('New','Contacted','Qualified','Won','Lost')),
  payment_status text not null default 'Unpaid' check (payment_status in ('Unpaid','Deposit','Paid')),
  utm_source     text,
  country        text default 'NG',
  currency       text default 'NGN',
  source         text not null default 'website',
  show_public    boolean not null default false
);

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  ref           text unique not null default ('PRJ-' || nextval('public.project_ref_seq')),
  created_at    timestamptz not null default now(),
  client        text not null,
  contact       text,
  whatsapp      text,
  package_name  text,
  videos_total  int  not null default 1,
  videos_done   int  not null default 0,
  status        text not null default 'Briefing'
                check (status in ('Briefing','In production','Review','Revision','Delivered','Closed')),
  payment       text not null default 'Unpaid' check (payment in ('Unpaid','Deposit','Paid')),
  started_unpaid boolean not null default false,
  approved_by   text,
  deadline      date not null default (current_date + 7),
  assigned      text
);

create table if not exists public.audit_log (
  id        uuid primary key default gen_random_uuid(),
  at        timestamptz not null default now(),
  user_name text not null,
  action    text not null
);

-- ---------- helper: "is the person asking one of our team?" ----------
create or replace function public.is_staff()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- ---------- security rules (Row Level Security) ----------
alter table public.profiles     enable row level security;
alter table public.site_content enable row level security;
alter table public.leads        enable row level security;
alter table public.projects     enable row level security;
alter table public.audit_log    enable row level security;

drop policy if exists "read own profile"      on public.profiles;
drop policy if exists "public reads content"  on public.site_content;
drop policy if exists "staff insert content"  on public.site_content;
drop policy if exists "staff update content"  on public.site_content;
drop policy if exists "staff manage leads"    on public.leads;
drop policy if exists "staff manage projects" on public.projects;
drop policy if exists "staff read audit"      on public.audit_log;
drop policy if exists "staff write audit"     on public.audit_log;

create policy "read own profile"      on public.profiles     for select to authenticated using (id = auth.uid());
create policy "public reads content"  on public.site_content for select to anon, authenticated using (true);
create policy "staff insert content"  on public.site_content for insert to authenticated with check (public.is_staff());
create policy "staff update content"  on public.site_content for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage leads"    on public.leads        for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff manage projects" on public.projects     for all    to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "staff read audit"      on public.audit_log    for select to authenticated using (public.is_staff());
create policy "staff write audit"     on public.audit_log    for insert to authenticated with check (public.is_staff());
-- Note: there is deliberately NO policy letting the public read or write `leads`
-- directly. Visitors can only call submit_lead() below.

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

-- ============================================================================
--  AFTER running this: create your first admin login. See README.md, Part 4.
-- ============================================================================
