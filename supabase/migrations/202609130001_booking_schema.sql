create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  create type public.appointment_status as enum (
    'confirmed',
    'rescheduled',
    'cancelled',
    'completed',
    'no_show'
  );
exception
  when duplicate_object or duplicate_table then null;
end $$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) check (price is null or price >= 0),
  price_display text not null default 'Price confirmed by salon',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) check (price is null or price >= 0),
  price_display text not null default 'Price confirmed by salon',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_addons (
  service_id uuid not null references public.services(id) on delete cascade,
  addon_id uuid not null references public.addons(id) on delete cascade,
  primary key (service_id, addon_id)
);

create table if not exists public.stylists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text not null default '',
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stylist_services (
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (stylist_id, service_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

create table if not exists public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.stylists(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_id uuid not null references public.customers(id),
  stylist_id uuid not null references public.stylists(id),
  service_id uuid not null references public.services(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.appointment_status not null default 'confirmed',
  customer_notes text,
  management_token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at)
);

-- Secondary management links let confirmations and reminders contain a secure,
-- cross-device URL without storing the plaintext token on the appointment.
create table if not exists public.appointment_management_links (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  token_hash bytea not null unique,
  purpose text not null check (purpose in ('email', 'recovery')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.appointments
    add constraint appointments_no_stylist_overlap
    exclude using gist (
      stylist_id with =,
      tstzrange(start_at, end_at, '[)') with &&
    )
    where (status in ('confirmed', 'rescheduled'));
exception
  when duplicate_object or duplicate_table then null;
end $$;

create table if not exists public.appointment_addons (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  addon_id uuid not null references public.addons(id),
  primary key (appointment_id, addon_id)
);

create table if not exists public.appointment_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null,
  previous_start_at timestamptz,
  previous_end_at timestamptz,
  new_start_at timestamptz,
  new_end_at timestamptz,
  previous_status public.appointment_status,
  new_status public.appointment_status,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_lookup_attempts (
  id bigint generated always as identity primary key,
  request_key text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists appointments_stylist_time_idx
  on public.appointments (stylist_id, start_at, end_at);
create index if not exists appointment_management_links_appointment_idx
  on public.appointment_management_links (appointment_id);
create index if not exists blocked_times_stylist_time_idx
  on public.blocked_times (stylist_id, start_at, end_at);
create index if not exists availability_stylist_day_idx
  on public.availability (stylist_id, day_of_week) where active;
create index if not exists booking_lookup_attempts_key_time_idx
  on public.booking_lookup_attempts (request_key, attempted_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services
for each row execute function public.set_updated_at();
drop trigger if exists addons_set_updated_at on public.addons;
create trigger addons_set_updated_at before update on public.addons
for each row execute function public.set_updated_at();
drop trigger if exists stylists_set_updated_at on public.stylists;
create trigger stylists_set_updated_at before update on public.stylists
for each row execute function public.set_updated_at();
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
drop trigger if exists availability_set_updated_at on public.availability;
create trigger availability_set_updated_at before update on public.availability
for each row execute function public.set_updated_at();
drop trigger if exists blocked_times_set_updated_at on public.blocked_times;
create trigger blocked_times_set_updated_at before update on public.blocked_times
for each row execute function public.set_updated_at();
drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.services enable row level security;
alter table public.addons enable row level security;
alter table public.service_addons enable row level security;
alter table public.stylists enable row level security;
alter table public.stylist_services enable row level security;
alter table public.customers enable row level security;
alter table public.availability enable row level security;
alter table public.blocked_times enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_management_links enable row level security;
alter table public.appointment_addons enable row level security;
alter table public.appointment_history enable row level security;
alter table public.booking_lookup_attempts enable row level security;

revoke all on table
  public.services,
  public.addons,
  public.service_addons,
  public.stylists,
  public.stylist_services,
  public.customers,
  public.availability,
  public.blocked_times,
  public.appointments,
  public.appointment_management_links,
  public.appointment_addons,
  public.appointment_history,
  public.booking_lookup_attempts
from anon, authenticated;

create or replace function public.booking_list_services()
returns table (
  id uuid,
  name text,
  slug text,
  category text,
  description text,
  duration_minutes integer,
  price_display text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.slug, s.category, s.description, s.duration_minutes, s.price_display
  from public.services s
  where s.active
  order by s.category, s.name;
$$;

create or replace function public.booking_list_addons(p_service_id uuid)
returns table (
  id uuid,
  name text,
  slug text,
  description text,
  duration_minutes integer,
  price_display text
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.name, a.slug, a.description, a.duration_minutes, a.price_display
  from public.addons a
  join public.service_addons sa on sa.addon_id = a.id
  join public.services s on s.id = sa.service_id
  where sa.service_id = p_service_id and a.active and s.active
  order by a.name;
$$;

create or replace function public.booking_list_stylists(p_service_id uuid)
returns table (id uuid, name text, bio text, image_url text)
language sql
stable
security definer
set search_path = public
as $$
  select st.id, st.name, st.bio, st.image_url
  from public.stylists st
  join public.stylist_services ss on ss.stylist_id = st.id
  join public.services s on s.id = ss.service_id
  where ss.service_id = p_service_id and st.active and s.active
  order by st.name;
$$;

create or replace function public.booking_calculate_slots(
  p_service_id uuid,
  p_addon_ids uuid[],
  p_stylist_id uuid,
  p_date date,
  p_exclude_appointment_id uuid default null
)
returns table (start_at timestamptz, end_at timestamptz, stylist_id uuid, stylist_name text)
language sql
stable
security definer
set search_path = public
as $$
  with selected_service as (
    select s.duration_minutes
    from public.services s
    where s.id = p_service_id and s.active
  ),
  requested_addons as (
    select coalesce(sum(a.duration_minutes), 0)::integer as duration_minutes
    from public.addons a
    join public.service_addons sa on sa.addon_id = a.id and sa.service_id = p_service_id
    where a.id = any(coalesce(p_addon_ids, '{}'::uuid[])) and a.active
  ),
  duration as (
    select (s.duration_minutes + a.duration_minutes)::integer as minutes
    from selected_service s cross join requested_addons a
  ),
  candidates as (
    select
      (slot.local_start at time zone 'America/New_York') as candidate_start,
      (slot.local_start at time zone 'America/New_York') + make_interval(mins => d.minutes) as candidate_end,
      st.id as candidate_stylist_id,
      st.name as candidate_stylist_name
    from duration d
    join public.stylist_services ss on ss.service_id = p_service_id
    join public.stylists st on st.id = ss.stylist_id and st.active
    join public.availability av on av.stylist_id = st.id
      and av.active
      and av.day_of_week = extract(dow from p_date)::smallint
    cross join lateral generate_series(
      p_date + av.start_time,
      p_date + av.end_time - make_interval(mins => d.minutes),
      interval '30 minutes'
    ) as slot(local_start)
    where (p_stylist_id is null or st.id = p_stylist_id)
  ),
  open_slots as (
    select c.*
    from candidates c
    where c.candidate_start > now()
      and not exists (
        select 1 from public.blocked_times bt
        where bt.stylist_id = c.candidate_stylist_id
          and bt.start_at < c.candidate_end
          and bt.end_at > c.candidate_start
      )
      and not exists (
        select 1 from public.appointments ap
        where ap.stylist_id = c.candidate_stylist_id
          and ap.status in ('confirmed', 'rescheduled')
          and ap.id is distinct from p_exclude_appointment_id
          and ap.start_at < c.candidate_end
          and ap.end_at > c.candidate_start
      )
  ),
  ranked as (
    select o.*, row_number() over (
      partition by o.candidate_start order by o.candidate_stylist_name, o.candidate_stylist_id
    ) as slot_rank
    from open_slots o
  )
  select r.candidate_start, r.candidate_end, r.candidate_stylist_id, r.candidate_stylist_name
  from ranked r
  where r.slot_rank = 1
  order by r.candidate_start;
$$;

revoke all on function public.booking_calculate_slots(uuid, uuid[], uuid, date, uuid) from public, anon, authenticated;

create or replace function public.booking_available_slots(
  p_service_id uuid,
  p_addon_ids uuid[] default '{}'::uuid[],
  p_stylist_id uuid default null,
  p_date date default current_date
)
returns table (start_at timestamptz, end_at timestamptz, stylist_id uuid, stylist_name text)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.booking_calculate_slots(
    p_service_id,
    coalesce(p_addon_ids, '{}'::uuid[]),
    p_stylist_id,
    p_date,
    null
  );
$$;

create or replace function public.booking_appointment_json(p_appointment_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'booking_reference', ap.booking_reference,
    'start_at', ap.start_at,
    'end_at', ap.end_at,
    'status', ap.status::text,
    'duration_minutes', extract(epoch from (ap.end_at - ap.start_at))::integer / 60,
    'service', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'slug', s.slug,
      'category', s.category,
      'description', s.description,
      'duration_minutes', s.duration_minutes,
      'price_display', s.price_display
    ),
    'addons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ad.id,
        'name', ad.name,
        'slug', ad.slug,
        'description', ad.description,
        'duration_minutes', ad.duration_minutes,
        'price_display', ad.price_display
      ) order by ad.name)
      from public.appointment_addons aa
      join public.addons ad on ad.id = aa.addon_id
      where aa.appointment_id = ap.id
    ), '[]'::jsonb),
    'stylist', jsonb_build_object(
      'id', st.id,
      'name', st.name,
      'bio', st.bio,
      'image_url', st.image_url
    ),
    'customer', jsonb_build_object(
      'first_name', c.first_name,
      'last_name', c.last_name,
      'phone', c.phone,
      'email', c.email,
      'notes', ap.customer_notes
    )
  )
  from public.appointments ap
  join public.services s on s.id = ap.service_id
  join public.stylists st on st.id = ap.stylist_id
  join public.customers c on c.id = ap.customer_id
  where ap.id = p_appointment_id;
$$;

revoke all on function public.booking_appointment_json(uuid) from public, anon, authenticated;

create or replace function public.booking_appointment_id_for_token(p_token text)
returns uuid
language sql
stable
security definer
set search_path = public, extensions
as $$
  select ap.id
  from public.appointments ap
  where length(coalesce(p_token, '')) = 64
    and (
      ap.management_token_hash = digest(p_token, 'sha256')
      or exists (
        select 1
        from public.appointment_management_links ml
        where ml.appointment_id = ap.id
          and ml.token_hash = digest(p_token, 'sha256')
          and (ml.expires_at is null or ml.expires_at > now())
      )
    )
  limit 1;
$$;

revoke all on function public.booking_appointment_id_for_token(text) from public, anon, authenticated;

create or replace function public.booking_create_appointment(
  p_service_id uuid,
  p_addon_ids uuid[],
  p_stylist_id uuid,
  p_start_at timestamptz,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_customer_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_customer_id uuid;
  v_appointment_id uuid;
  v_allocated_stylist_id uuid;
  v_end_at timestamptz;
  v_token text;
  v_reference text;
  v_addon_count integer;
begin
  if length(trim(coalesce(p_first_name, ''))) not between 1 and 80
    or length(trim(coalesce(p_last_name, ''))) not between 1 and 80
    or length(trim(coalesce(p_phone, ''))) not between 7 and 40
    or length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) not between 7 and 15
    or length(trim(coalesce(p_email, ''))) not between 5 and 254
    or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    or length(coalesce(p_customer_notes, '')) > 2000 then
    raise exception 'VALIDATION_FAILED';
  end if;

  select count(*) into v_addon_count
  from public.service_addons sa
  join public.addons ad on ad.id = sa.addon_id and ad.active
  where sa.service_id = p_service_id
    and sa.addon_id = any(coalesce(p_addon_ids, '{}'::uuid[]));

  if v_addon_count <> cardinality(coalesce(p_addon_ids, '{}'::uuid[])) then
    raise exception 'VALIDATION_FAILED';
  end if;

  select slots.stylist_id, slots.end_at
  into v_allocated_stylist_id, v_end_at
  from public.booking_calculate_slots(
    p_service_id,
    coalesce(p_addon_ids, '{}'::uuid[]),
    p_stylist_id,
    (p_start_at at time zone 'America/New_York')::date,
    null
  ) slots
  where slots.start_at = p_start_at
  limit 1;

  if v_allocated_stylist_id is null then
    raise exception 'SLOT_TAKEN';
  end if;

  insert into public.customers (first_name, last_name, phone, email)
  values (trim(p_first_name), trim(p_last_name), trim(p_phone), lower(trim(p_email)))
  returning id into v_customer_id;

  v_token := encode(gen_random_bytes(32), 'hex');
  loop
    v_reference := 'TJ-' || lpad((floor(random() * 100000))::integer::text, 5, '0');
    exit when not exists (
      select 1 from public.appointments where booking_reference = v_reference
    );
  end loop;

  begin
    insert into public.appointments (
      booking_reference,
      customer_id,
      stylist_id,
      service_id,
      start_at,
      end_at,
      status,
      customer_notes,
      management_token_hash
    ) values (
      v_reference,
      v_customer_id,
      v_allocated_stylist_id,
      p_service_id,
      p_start_at,
      v_end_at,
      'confirmed',
      nullif(trim(coalesce(p_customer_notes, '')), ''),
      digest(v_token, 'sha256')
    ) returning id into v_appointment_id;
  exception
    when exclusion_violation or unique_violation then
      raise exception 'SLOT_TAKEN';
  end;

  insert into public.appointment_addons (appointment_id, addon_id)
  select v_appointment_id, requested.addon_id
  from unnest(coalesce(p_addon_ids, '{}'::uuid[])) requested(addon_id);

  insert into public.appointment_history (appointment_id, event_type, new_start_at, new_end_at, new_status)
  values (v_appointment_id, 'created', p_start_at, v_end_at, 'confirmed');

  return jsonb_build_object(
    'management_token', v_token,
    'appointment', public.booking_appointment_json(v_appointment_id)
  );
end;
$$;

create or replace function public.booking_get_appointment(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if length(coalesce(p_token, '')) <> 64 then
    raise exception 'INVALID_MANAGEMENT_TOKEN';
  end if;
  v_id := public.booking_appointment_id_for_token(p_token);
  if v_id is null then
    raise exception 'INVALID_MANAGEMENT_TOKEN';
  end if;
  return public.booking_appointment_json(v_id);
end;
$$;

create or replace function public.booking_reschedule_slots(p_token text, p_date date)
returns table (start_at timestamptz, end_at timestamptz, stylist_id uuid, stylist_name text)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_appointment public.appointments%rowtype;
  v_addons uuid[];
begin
  select * into v_appointment
  from public.appointments
  where id = public.booking_appointment_id_for_token(p_token);
  if v_appointment.id is null then raise exception 'INVALID_MANAGEMENT_TOKEN'; end if;
  if v_appointment.status = 'cancelled' then raise exception 'ALREADY_CANCELLED'; end if;
  if v_appointment.status in ('completed', 'no_show') then raise exception 'INVALID_MANAGEMENT_TOKEN'; end if;

  select coalesce(array_agg(aa.addon_id), '{}'::uuid[]) into v_addons
  from public.appointment_addons aa where aa.appointment_id = v_appointment.id;

  return query
  select * from public.booking_calculate_slots(
    v_appointment.service_id,
    v_addons,
    v_appointment.stylist_id,
    p_date,
    v_appointment.id
  );
end;
$$;

create or replace function public.booking_reschedule_appointment(p_token text, p_start_at timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_appointment public.appointments%rowtype;
  v_addons uuid[];
  v_end_at timestamptz;
begin
  select * into v_appointment
  from public.appointments
  where id = public.booking_appointment_id_for_token(p_token)
  for update;
  if v_appointment.id is null then raise exception 'INVALID_MANAGEMENT_TOKEN'; end if;
  if v_appointment.status = 'cancelled' then raise exception 'ALREADY_CANCELLED'; end if;
  if v_appointment.status in ('completed', 'no_show') then raise exception 'INVALID_MANAGEMENT_TOKEN'; end if;

  select coalesce(array_agg(aa.addon_id), '{}'::uuid[]) into v_addons
  from public.appointment_addons aa where aa.appointment_id = v_appointment.id;

  select slots.end_at into v_end_at
  from public.booking_calculate_slots(
    v_appointment.service_id,
    v_addons,
    v_appointment.stylist_id,
    (p_start_at at time zone 'America/New_York')::date,
    v_appointment.id
  ) slots
  where slots.start_at = p_start_at;

  if v_end_at is null then raise exception 'SLOT_TAKEN'; end if;

  begin
    update public.appointments
    set start_at = p_start_at, end_at = v_end_at, status = 'rescheduled'
    where id = v_appointment.id;
  exception
    when exclusion_violation then raise exception 'SLOT_TAKEN';
  end;

  insert into public.appointment_history (
    appointment_id, event_type, previous_start_at, previous_end_at,
    new_start_at, new_end_at, previous_status, new_status
  ) values (
    v_appointment.id, 'rescheduled', v_appointment.start_at, v_appointment.end_at,
    p_start_at, v_end_at, v_appointment.status, 'rescheduled'
  );

  return public.booking_appointment_json(v_appointment.id);
end;
$$;

create or replace function public.booking_cancel_appointment(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_appointment public.appointments%rowtype;
begin
  select * into v_appointment
  from public.appointments
  where id = public.booking_appointment_id_for_token(p_token)
  for update;
  if v_appointment.id is null then raise exception 'INVALID_MANAGEMENT_TOKEN'; end if;
  if v_appointment.status = 'cancelled' then raise exception 'ALREADY_CANCELLED'; end if;
  if v_appointment.status in ('completed', 'no_show') then raise exception 'INVALID_MANAGEMENT_TOKEN'; end if;

  update public.appointments set status = 'cancelled' where id = v_appointment.id;
  insert into public.appointment_history (appointment_id, event_type, previous_status, new_status)
  values (v_appointment.id, 'cancelled', v_appointment.status, 'cancelled');
  return public.booking_appointment_json(v_appointment.id);
end;
$$;

create or replace function public.booking_find_appointment(p_booking_reference text, p_contact text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_headers jsonb;
  v_request_identity text;
  v_request_key text;
  v_appointment_id uuid;
  v_token text;
begin
  begin
    v_headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;
  v_request_identity := coalesce(v_headers->>'x-forwarded-for', v_headers->>'cf-connecting-ip', 'unknown');
  v_request_key := encode(digest(v_request_identity, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_request_key, 0));

  delete from public.booking_lookup_attempts where attempted_at < now() - interval '1 hour';
  if (select count(*) from public.booking_lookup_attempts
      where request_key = v_request_key and attempted_at > now() - interval '15 minutes') >= 5 then
    raise exception 'RATE_LIMITED';
  end if;
  insert into public.booking_lookup_attempts (request_key) values (v_request_key);

  if length(trim(coalesce(p_booking_reference, ''))) < 4
    or length(trim(coalesce(p_contact, ''))) < 3 then
    return null;
  end if;

  select ap.id into v_appointment_id
  from public.appointments ap
  join public.customers c on c.id = ap.customer_id
  where ap.booking_reference = upper(trim(coalesce(p_booking_reference, '')))
    and (
      lower(c.email) = lower(trim(coalesce(p_contact, '')))
      or regexp_replace(c.phone, '[^0-9]', '', 'g') = regexp_replace(coalesce(p_contact, ''), '[^0-9]', '', 'g')
    )
  limit 1;

  if v_appointment_id is null then return null; end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  update public.appointments
  set management_token_hash = digest(v_token, 'sha256')
  where id = v_appointment_id;
  return jsonb_build_object('management_token', v_token);
end;
$$;

grant execute on function public.booking_list_services() to anon, authenticated;
grant execute on function public.booking_list_addons(uuid) to anon, authenticated;
grant execute on function public.booking_list_stylists(uuid) to anon, authenticated;
grant execute on function public.booking_available_slots(uuid, uuid[], uuid, date) to anon, authenticated;
grant execute on function public.booking_create_appointment(uuid, uuid[], uuid, timestamptz, text, text, text, text, text) to anon, authenticated;
grant execute on function public.booking_get_appointment(text) to anon, authenticated;
grant execute on function public.booking_reschedule_slots(text, date) to anon, authenticated;
grant execute on function public.booking_reschedule_appointment(text, timestamptz) to anon, authenticated;
grant execute on function public.booking_cancel_appointment(text) to anon, authenticated;
grant execute on function public.booking_find_appointment(text, text) to anon, authenticated;
