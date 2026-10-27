-- ============================================================================
--  ADVIBE STUDIOS — MIGRATION 4: TRAINING COHORTS & SEAT ENGINE
--  Run in Supabase -> SQL Editor -> New query -> paste -> Run.
--  Provides transactional seat management, anti-double-submission registration,
--  safe RPCs for public signup, and admin-only Mark-Paid / Next-Cohort operations.
-- ============================================================================

-- ---------- 1. COHORTS TABLE ----------
create table if not exists public.cohorts (
  id                   text primary key,                       -- e.g. 'cohort-1'
  number               int not null default 1,
  name                 text not null,
  slug                 text unique not null,
  status               text not null default 'open' 
                       check (status in ('draft', 'upcoming', 'open', 'almost_full', 'full', 'paused', 'ended', 'archived')),
  capacity             int not null default 100,
  almost_full_at       int not null default 90,
  minimum_to_run       int not null default 10,               -- internal only, never exposed to public
  price_table          jsonb not null default '{"NG":{"founding":19997,"regular":29997},"GH":{"founding":350,"regular":500},"KE":{"founding":7500,"regular":11000},"US":{"founding":49,"regular":79},"UK":{"founding":39,"regular":59}}'::jsonb,
  future_price_table   jsonb not null default '{"NG":{"founding":29997,"regular":39997},"GH":{"founding":500,"regular":650},"KE":{"founding":11000,"regular":14000},"US":{"founding":79,"regular":99},"UK":{"founding":59,"regular":79}}'::jsonb,
  enrollment_opens_at  timestamptz,
  enrollment_closes_at timestamptz default '2026-11-15T23:59:59+01:00',
  starts_at            timestamptz default '2026-11-24T19:00:00+01:00',
  ends_at              timestamptz default '2026-12-05T21:30:00+01:00',
  schedule_days        text default 'Tue, Thu (7:00–9:30 PM WAT) & Sat (3:00–5:30 PM WAT)',
  sessions             jsonb not null default '[]'::jsonb,
  payment_url          text,
  registration_url     text,
  refund_text          text default 'Refunds are available before the cohort begins. Once the first session starts, all payments are non-refundable. If AdVibe Studios cancels the cohort, enrolled students receive a full refund.',
  created_from         text,
  archived_at          timestamptz,
  created_at           timestamptz not null default now()
);

-- Seed initial Cohort 1 if none exists
insert into public.cohorts (
  id, number, name, slug, status, capacity, almost_full_at, minimum_to_run,
  enrollment_closes_at, starts_at, ends_at, schedule_days, payment_url
) values (
  'cohort-1', 1, 'The AdVibe AI Cinematography Intensive — Founding Cohort',
  'founding-cohort', 'open', 100, 90, 10,
  '2026-11-15T23:59:59+01:00', '2026-11-24T19:00:00+01:00', '2026-12-05T21:30:00+01:00',
  'Tue, Thu (7:00–9:30 PM WAT) & Sat (3:00–5:30 PM WAT)', 'https://selfany.com/pay/advibe-cohort-1'
) on conflict (id) do nothing;

-- ---------- 2. REGISTRATIONS TABLE ----------
create sequence if not exists public.reg_ref_seq start 1001;

create table if not exists public.registrations (
  id                     uuid primary key default gen_random_uuid(),
  cohort_id              text not null references public.cohorts(id) on delete cascade,
  ref                    text unique not null default ('AV-TR-' || nextval('public.reg_ref_seq')),
  audience               text not null check (audience in ('business', 'creator')),
  name                   text not null,
  whatsapp               text not null,
  email                  text not null,
  country                text not null default 'NG',
  business_or_type       text,
  experience_level       text default 'beginner',
  goal                   text,
  consent_public_display boolean not null default false,
  consent_contact        boolean not null default true,
  stage                  text not null default 'registered' 
                         check (stage in ('lead', 'registered', 'payment_started', 'payment_confirmed', 'cohort_member', 'refunded', 'cancelled')),
  payment_reference      text,
  amount                 numeric not null default 19997,
  currency               text not null default 'NGN',
  marked_paid_by         text,
  marked_paid_at         timestamptz,
  utm                    jsonb not null default '{}'::jsonb,
  source_route           text default '#/training',
  idempotency_key        text unique,
  notes                  text,
  created_at             timestamptz not null default now()
);

-- Index for live seat count calculation
create index if not exists idx_reg_cohort_paid on public.registrations (cohort_id, stage) 
where stage in ('payment_confirmed', 'cohort_member');

-- Index for consented live toasts
create index if not exists idx_reg_public_toasts on public.registrations (created_at desc) 
where consent_public_display = true and stage in ('payment_confirmed', 'cohort_member');

-- ---------- 3. TRAINING RESOURCES TABLE ----------
create table if not exists public.training_resources (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  path_or_url   text not null,
  published     boolean not null default false,
  requires_paid boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- 4. ROW LEVEL SECURITY POLICIES ----------
alter table public.cohorts            enable row level security;
alter table public.registrations      enable row level security;
alter table public.training_resources enable row level security;

-- Cohorts policies: Public can read active/upcoming/open/paused/ended cohorts
drop policy if exists "public reads visible cohorts" on public.cohorts;
create policy "public reads visible cohorts" on public.cohorts
  for select to anon, authenticated
  using (status != 'archived' and status != 'draft');

drop policy if exists "staff manage cohorts" on public.cohorts;
create policy "staff manage cohorts" on public.cohorts
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Registrations policies: Only staff can read or update directly
drop policy if exists "staff manage registrations" on public.registrations;
create policy "staff manage registrations" on public.registrations
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Resources policies
drop policy if exists "public reads free published resources" on public.training_resources;
create policy "public reads free published resources" on public.training_resources
  for select to anon, authenticated
  using (published = true and requires_paid = false);

drop policy if exists "staff manage training resources" on public.training_resources;
create policy "staff manage training resources" on public.training_resources
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());


-- ---------- 5. PUBLIC RPCS FOR CLIENT APPLICATION ----------

-- RPC: get_cohort_public (server authoritative seat count & state)
create or replace function public.get_cohort_public(p_slug text default 'founding-cohort')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_paid int;
  v_state text;
  v_remaining int;
begin
  select * into c from public.cohorts 
  where (slug = p_slug or id = p_slug) and status != 'archived'
  limit 1;

  if not found then
    select * into c from public.cohorts where status != 'archived' order by created_at desc limit 1;
  end if;

  if not found then
    return null;
  end if;

  -- Count confirmed paid seats only
  select count(*) into v_paid 
  from public.registrations 
  where cohort_id = c.id and stage in ('payment_confirmed', 'cohort_member');

  -- Calculate server-authoritative state
  if c.status = 'paused' then
    v_state := 'PAUSED';
  elsif c.status = 'ended' or (c.enrollment_closes_at is not null and now() > c.enrollment_closes_at) then
    v_state := 'ENDED';
  elsif v_paid >= c.capacity or c.status = 'full' then
    v_state := 'FULL';
  elsif v_paid >= (c.capacity - 10) then
    v_state := 'FINAL_SEATS';
  elsif v_paid >= c.almost_full_at or c.status = 'almost_full' then
    v_state := 'ALMOST_FULL';
  elsif c.status = 'upcoming' then
    v_state := 'UPCOMING';
  else
    v_state := 'OPEN';
  end if;

  v_remaining := greatest(0, c.capacity - v_paid);

  return jsonb_build_object(
    'id', c.id,
    'number', c.number,
    'name', c.name,
    'slug', c.slug,
    'state', v_state,
    'paid', v_paid,
    'capacity', c.capacity,
    'almost_full_at', c.almost_full_at,
    'remaining', v_remaining,
    'prices', c.price_table,
    'future_prices', c.future_price_table,
    'enrollment_closes_at', c.enrollment_closes_at,
    'starts_at', c.starts_at,
    'ends_at', c.ends_at,
    'schedule_days', c.schedule_days,
    'sessions', c.sessions,
    'payment_url', c.payment_url,
    'refund_text', c.refund_text
  );
end;
$$;
grant execute on function public.get_cohort_public(text) to anon, authenticated;

-- RPC: submit_registration
create or replace function public.submit_registration(
  payload jsonb,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cohort_id text;
  v_name text;
  v_whatsapp text;
  v_email text;
  v_country text;
  v_audience text;
  v_amount numeric;
  v_currency text;
  v_reg_id uuid;
  v_ref text;
  v_cap int;
  v_paid int;
  v_next_step text := 'pay';
begin
  -- Validate required fields
  v_name := trim(coalesce(payload->>'name', ''));
  v_whatsapp := regexp_replace(coalesce(payload->>'whatsapp', ''), '\D', '', 'g');
  v_email := lower(trim(coalesce(payload->>'email', '')));
  v_country := upper(left(coalesce(nullif(payload->>'country', ''), 'NG'), 3));
  v_audience := lower(coalesce(nullif(payload->>'audience', ''), 'business'));
  v_cohort_id := coalesce(nullif(payload->>'cohortId', ''), 'cohort-1');

  if length(v_name) < 2 or length(v_whatsapp) < 7 or length(v_email) < 5 then
    raise exception 'invalid registration parameters';
  end if;

  -- Idempotency check: if already submitted with this key, return existing record
  if p_idempotency_key is not null then
    select id, ref into v_reg_id, v_ref
    from public.registrations
    where idempotency_key = p_idempotency_key
    limit 1;

    if found then
      return jsonb_build_object(
        'success', true,
        'registration_id', v_reg_id,
        'ref', v_ref,
        'next_step', 'pay'
      );
    end if;
  end if;

  -- Server-side lookup of capacity and price for this country
  select capacity, 
         coalesce((price_table->v_country->>'founding')::numeric, 19997),
         case when v_country = 'GH' then 'GHS'
              when v_country = 'KE' then 'KES'
              when v_country = 'US' then 'USD'
              when v_country = 'UK' then 'GBP'
              else 'NGN' end
  into v_cap, v_amount, v_currency
  from public.cohorts
  where id = v_cohort_id;

  if not found then
    v_cap := 100;
    v_amount := 19997;
    v_currency := 'NGN';
  end if;

  -- Check live seat count
  select count(*) into v_paid
  from public.registrations
  where cohort_id = v_cohort_id and stage in ('payment_confirmed', 'cohort_member');

  if v_paid >= v_cap then
    v_next_step := 'waitlist';
  end if;

  -- Insert registration
  insert into public.registrations (
    cohort_id, audience, name, whatsapp, email, country,
    business_or_type, experience_level, goal,
    consent_public_display, consent_contact, stage,
    amount, currency, utm, source_route, idempotency_key, notes
  ) values (
    v_cohort_id,
    case when v_audience in ('business', 'creator') then v_audience else 'business' end,
    v_name,
    payload->>'whatsapp',
    v_email,
    v_country,
    payload->>'businessOrType',
    coalesce(payload->>'experienceLevel', 'beginner'),
    payload->>'goal',
    coalesce((payload->>'consentPublicDisplay')::boolean, false),
    coalesce((payload->>'consentContact')::boolean, true),
    'registered',
    v_amount,
    v_currency,
    coalesce(payload->'utm', '{}'::jsonb),
    coalesce(payload->>'sourceRoute', '#/training'),
    p_idempotency_key,
    payload->>'notes'
  )
  returning id, ref into v_reg_id, v_ref;

  return jsonb_build_object(
    'success', true,
    'registration_id', v_reg_id,
    'ref', v_ref,
    'amount', v_amount,
    'currency', v_currency,
    'next_step', v_next_step
  );
end;
$$;
grant execute on function public.submit_registration(jsonb, text) to anon, authenticated;

-- RPC: mark_payment_started
create or replace function public.mark_payment_started(p_reg_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.registrations
  set stage = 'payment_started'
  where id = p_reg_id and stage = 'registered';
  return found;
end;
$$;
grant execute on function public.mark_payment_started(uuid) to anon, authenticated;

-- ---------- 6. ADMIN-ONLY RPCS (AUTH PROTECTED) ----------

-- RPC: mark_paid (1-tap admin action with hard stop at capacity)
create or replace function public.mark_paid(
  p_reg_id uuid,
  p_marked_paid_by text default 'Staff',
  p_override_cap boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_cohort_id text;
  v_cap int;
  v_paid int;
  v_ref text;
  v_name text;
begin
  if not public.is_staff() then
    raise exception 'Access denied: staff role required';
  end if;

  select cohort_id, ref, name into v_cohort_id, v_ref, v_name
  from public.registrations
  where id = p_reg_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Registration not found');
  end if;

  select capacity into v_cap from public.cohorts where id = v_cohort_id;
  select count(*) into v_paid from public.registrations 
  where cohort_id = v_cohort_id and stage in ('payment_confirmed', 'cohort_member');

  -- Enforce hard cap unless admin specifically overrides
  if v_paid >= v_cap and not p_override_cap then
    return jsonb_build_object(
      'success', false, 
      'error', 'Capacity limit reached (' || v_paid || '/' || v_cap || '). Set override=true to force entry.'
    );
  end if;

  update public.registrations
  set stage = 'payment_confirmed',
      marked_paid_by = p_marked_paid_by,
      marked_paid_at = now()
  where id = p_reg_id;

  -- Audit log
  insert into public.audit_log (user_name, action)
  values (p_marked_paid_by, 'Marked registration ' || v_ref || ' (' || v_name || ') as PAID. Seats: ' || (v_paid + 1) || '/' || v_cap);

  return jsonb_build_object(
    'success', true,
    'ref', v_ref,
    'total_paid', v_paid + 1,
    'capacity', v_cap
  );
end;
$$;
grant execute on function public.mark_paid(uuid, text, boolean) to authenticated;

-- RPC: mark_refunded (releases seat count)
create or replace function public.mark_refunded(
  p_reg_id uuid,
  p_admin text default 'Staff'
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
  v_name text;
begin
  if not public.is_staff() then
    raise exception 'Access denied';
  end if;

  update public.registrations
  set stage = 'refunded'
  where id = p_reg_id
  returning ref, name into v_ref, v_name;

  if found then
    insert into public.audit_log (user_name, action)
    values (p_admin, 'Refunded registration ' || v_ref || ' (' || v_name || '). Seat released.');
    return jsonb_build_object('success', true);
  end if;

  return jsonb_build_object('success', false, 'error', 'Record not found');
end;
$$;
grant execute on function public.mark_refunded(uuid, text) to authenticated;

-- RPC: start_next_cohort
create or replace function public.start_next_cohort(
  p_source_id text,
  p_overrides jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  src record;
  v_next_num int;
  v_new_id text;
  v_new_slug text;
  v_admin text;
begin
  if not public.is_staff() then
    raise exception 'Access denied: staff only';
  end if;

  select * into src from public.cohorts where id = p_source_id;
  if not found then
    raise exception 'Source cohort not found';
  end if;

  select coalesce(max(number), 1) + 1 into v_next_num from public.cohorts;
  v_new_id := 'cohort-' || v_next_num;
  v_new_slug := 'cohort-' || v_next_num;
  v_admin := coalesce(p_overrides->>'adminName', 'Admin');

  -- Archive old cohort if requested
  if coalesce((p_overrides->>'archiveSource')::boolean, false) = true then
    update public.cohorts 
    set status = 'archived', archived_at = now() 
    where id = p_source_id;
  end if;

  -- Insert new cohort duplicating curriculum, setting future prices as founding prices
  insert into public.cohorts (
    id, number, name, slug, status, capacity, almost_full_at, minimum_to_run,
    price_table, future_price_table, enrollment_opens_at, enrollment_closes_at,
    starts_at, ends_at, schedule_days, sessions, payment_url, created_from
  ) values (
    v_new_id,
    v_next_num,
    coalesce(p_overrides->>'name', 'The AdVibe AI Cinematography Intensive — Cohort ' || v_next_num),
    v_new_slug,
    coalesce(p_overrides->>'status', 'open'),
    coalesce((p_overrides->>'capacity')::int, src.capacity),
    coalesce((p_overrides->>'almost_full_at')::int, src.almost_full_at),
    src.minimum_to_run,
    coalesce(p_overrides->'price_table', src.future_price_table),
    src.future_price_table,
    now(),
    (p_overrides->>'enrollment_closes_at')::timestamptz,
    (p_overrides->>'starts_at')::timestamptz,
    (p_overrides->>'ends_at')::timestamptz,
    coalesce(p_overrides->>'schedule_days', src.schedule_days),
    src.sessions,
    p_overrides->>'payment_url',
    p_source_id
  );

  insert into public.audit_log (user_name, action)
  values (v_admin, 'Launched Cohort ' || v_next_num || ' (' || v_new_id || ') from ' || p_source_id);

  return jsonb_build_object(
    'success', true,
    'new_cohort_id', v_new_id,
    'cohort_number', v_next_num
  );
end;
$$;
grant execute on function public.start_next_cohort(text, jsonb) to authenticated;

-- ---------- 7. RECENT TRAINING TOASTS (CONSENTED ONLY) ----------
create or replace function public.recent_training_enrollments(
  lim int default 8,
  hours int default 72
)
returns table (
  first_name text,
  country text,
  event_type text,
  created_at timestamptz
)
language sql security definer stable set search_path = public as $$
  select 
    left(split_part(trim(r.name), ' ', 1), 24) as first_name,
    r.country,
    'enrolled in the Founding Cohort' as event_type,
    r.created_at
  from public.registrations r
  where r.consent_public_display = true
    and r.stage in ('payment_confirmed', 'cohort_member')
    and r.created_at > now() - make_interval(hours => least(greatest(coalesce(hours, 72), 1), 720))
    and length(trim(r.name)) >= 2
  order by r.created_at desc
  limit least(greatest(coalesce(lim, 8), 1), 20);
$$;
grant execute on function public.recent_training_enrollments(int, int) to anon, authenticated;
