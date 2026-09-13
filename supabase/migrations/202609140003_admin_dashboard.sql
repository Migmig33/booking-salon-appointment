create type public.admin_role as enum ('owner', 'manager');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.salon_settings (
  id smallint primary key default 1 check (id = 1),
  salon_name text not null default 'TJ Hair Salon',
  phone text not null default '(708) 808-9910',
  address text not null default '47-42 Bell Blvd, Bayside, NY 11361',
  booking_timezone text not null default 'America/New_York',
  booking_window_days integer not null default 60 check (booking_window_days between 1 and 365),
  minimum_lead_minutes integer not null default 0 check (minimum_lead_minutes between 0 and 10080),
  cancellation_notice_hours integer not null default 24 check (cancellation_notice_hours between 0 and 168),
  updated_at timestamptz not null default now()
);

insert into public.salon_settings (id) values (1);

create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.admin_notifications (
  id bigint generated always as identity primary key,
  appointment_id uuid references public.appointments(id) on delete cascade,
  event_type text not null check (event_type in ('new_booking', 'rescheduled', 'cancelled')),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.blocked_times alter column stylist_id drop not null;

alter table public.appointments drop constraint appointments_no_stylist_overlap;
alter table public.appointments
  add constraint appointments_no_stylist_overlap
  exclude using gist (
    stylist_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  )
  where (status in ('confirmed', 'checked_in', 'rescheduled'));

create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index admin_notifications_created_idx on public.admin_notifications (created_at desc);
create index customers_name_idx on public.customers (lower(last_name), lower(first_name));
create index customers_email_idx on public.customers (lower(email));

create trigger admin_users_set_updated_at before update on public.admin_users
for each row execute function public.set_updated_at();
create trigger salon_settings_set_updated_at before update on public.salon_settings
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.salon_settings enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_notifications enable row level security;

revoke all on table public.admin_users, public.salon_settings,
  public.admin_audit_logs, public.admin_notifications from anon, authenticated;

create or replace function public.admin_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select au.role::text
  from public.admin_users au
  where au.user_id = auth.uid() and au.active;
$$;

create or replace function public.admin_assert_staff(p_owner_only boolean default false)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select public.admin_current_role() into v_role;
  if v_role is null then raise exception 'ADMIN_ACCESS_DENIED'; end if;
  if p_owner_only and v_role <> 'owner' then raise exception 'OWNER_ACCESS_REQUIRED'; end if;
  return v_role;
end;
$$;

create or replace function public.admin_record_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;

revoke all on function public.admin_current_role() from public, anon, authenticated;
revoke all on function public.admin_assert_staff(boolean) from public, anon, authenticated;
revoke all on function public.admin_record_audit(text, text, uuid, jsonb) from public, anon, authenticated;

create or replace function public.admin_get_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_result jsonb;
begin
  v_role := public.admin_assert_staff(false);
  select jsonb_build_object(
    'user_id', au.user_id,
    'display_name', au.display_name,
    'role', au.role::text,
    'email', u.email
  ) into v_result
  from public.admin_users au
  join auth.users u on u.id = au.user_id
  where au.user_id = auth.uid() and au.active;
  return v_result;
end;
$$;

create or replace function public.admin_appointment_json(p_appointment_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', ap.id,
    'booking_reference', ap.booking_reference,
    'start_at', ap.start_at,
    'end_at', ap.end_at,
    'status', ap.status::text,
    'customer_notes', ap.customer_notes,
    'created_at', ap.created_at,
    'updated_at', ap.updated_at,
    'duration_minutes', extract(epoch from (ap.end_at - ap.start_at))::integer / 60,
    'customer', jsonb_build_object(
      'id', c.id,
      'first_name', c.first_name,
      'last_name', c.last_name,
      'phone', c.phone,
      'email', c.email
    ),
    'service', jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'category', s.category,
      'description', s.description,
      'duration_minutes', s.duration_minutes,
      'price_display', s.price_display,
      'active', s.active
    ),
    'stylist', jsonb_build_object(
      'id', st.id,
      'name', st.name,
      'image_url', st.image_url,
      'active', st.active
    ),
    'addons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ad.id,
        'name', ad.name,
        'duration_minutes', ad.duration_minutes,
        'price_display', ad.price_display
      ) order by ad.name)
      from public.appointment_addons aa
      join public.addons ad on ad.id = aa.addon_id
      where aa.appointment_id = ap.id
    ), '[]'::jsonb)
  )
  from public.appointments ap
  join public.customers c on c.id = ap.customer_id
  join public.services s on s.id = ap.service_id
  join public.stylists st on st.id = ap.stylist_id
  where ap.id = p_appointment_id;
$$;

revoke all on function public.admin_appointment_json(uuid) from public, anon, authenticated;

create or replace function public.admin_dashboard(p_date date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_date date := coalesce(p_date, (now() at time zone 'America/New_York')::date);
  v_start timestamptz := v_date::timestamp at time zone 'America/New_York';
  v_end timestamptz := (v_date + 1)::timestamp at time zone 'America/New_York';
begin
  perform public.admin_assert_staff(false);
  return jsonb_build_object(
    'date', v_date,
    'appointments_today', (select count(*) from public.appointments where start_at >= v_start and start_at < v_end and status <> 'cancelled'),
    'upcoming', (select count(*) from public.appointments where start_at >= now() and status in ('confirmed', 'checked_in', 'rescheduled')),
    'completed_today', (select count(*) from public.appointments where start_at >= v_start and start_at < v_end and status = 'completed'),
    'cancelled_today', (select count(*) from public.appointments where start_at >= v_start and start_at < v_end and status = 'cancelled'),
    'no_shows_today', (select count(*) from public.appointments where start_at >= v_start and start_at < v_end and status = 'no_show'),
    'appointments', coalesce((
      select jsonb_agg(public.admin_appointment_json(ap.id) order by ap.start_at)
      from public.appointments ap
      where ap.start_at >= v_start and ap.start_at < v_end
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_list_appointments(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_status text default null,
  p_query text default null,
  p_stylist_id uuid default null,
  p_service_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  return coalesce((
    select jsonb_agg(public.admin_appointment_json(ap.id) order by ap.start_at)
    from public.appointments ap
    join public.customers c on c.id = ap.customer_id
    where (p_start_at is null or ap.end_at > p_start_at)
      and (p_end_at is null or ap.start_at < p_end_at)
      and (p_status is null or p_status = '' or ap.status::text = p_status)
      and (p_stylist_id is null or ap.stylist_id = p_stylist_id)
      and (p_service_id is null or ap.service_id = p_service_id)
      and (
        nullif(trim(coalesce(p_query, '')), '') is null
        or ap.booking_reference ilike '%' || trim(p_query) || '%'
        or (c.first_name || ' ' || c.last_name) ilike '%' || trim(p_query) || '%'
        or c.phone ilike '%' || trim(p_query) || '%'
        or c.email ilike '%' || trim(p_query) || '%'
      )
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_get_appointment(p_appointment_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform public.admin_assert_staff(false);
  v_result := public.admin_appointment_json(p_appointment_id);
  if v_result is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  return v_result;
end;
$$;

create or replace function public.admin_update_appointment_status(
  p_appointment_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_new_status public.appointment_status;
begin
  perform public.admin_assert_staff(false);
  if p_status not in ('confirmed', 'checked_in', 'completed', 'cancelled', 'no_show') then
    raise exception 'INVALID_STATUS';
  end if;
  v_new_status := p_status::public.appointment_status;
  select * into v_appointment from public.appointments where id = p_appointment_id for update;
  if v_appointment.id is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  if v_appointment.status = v_new_status then return public.admin_appointment_json(v_appointment.id); end if;
  if v_appointment.status in ('completed', 'cancelled', 'no_show') then
    raise exception 'INVALID_STATUS_TRANSITION';
  end if;

  update public.appointments set status = v_new_status where id = v_appointment.id;
  insert into public.appointment_history (appointment_id, event_type, previous_status, new_status)
  values (v_appointment.id, 'admin_status_change', v_appointment.status, v_new_status);
  perform public.admin_record_audit(
    'appointment_status_changed', 'appointment', v_appointment.id,
    jsonb_build_object('booking_reference', v_appointment.booking_reference, 'from', v_appointment.status::text, 'to', p_status)
  );
  return public.admin_appointment_json(v_appointment.id);
end;
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
  with config as (
    select booking_timezone, booking_window_days, minimum_lead_minutes
    from public.salon_settings where id = 1
  ),
  selected_service as (
    select s.duration_minutes from public.services s where s.id = p_service_id and s.active
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
      (slot.local_start at time zone cfg.booking_timezone) as candidate_start,
      (slot.local_start at time zone cfg.booking_timezone) + make_interval(mins => d.minutes) as candidate_end,
      st.id as candidate_stylist_id,
      st.name as candidate_stylist_name
    from duration d cross join config cfg
    join public.stylist_services ss on ss.service_id = p_service_id
    join public.stylists st on st.id = ss.stylist_id and st.active
    join public.availability av on av.stylist_id = st.id
      and av.active and av.day_of_week = extract(dow from p_date)::smallint
    cross join lateral generate_series(
      p_date + av.start_time,
      p_date + av.end_time - make_interval(mins => d.minutes),
      interval '30 minutes'
    ) as slot(local_start)
    where (p_stylist_id is null or st.id = p_stylist_id)
      and p_date <= (now() at time zone cfg.booking_timezone)::date + cfg.booking_window_days
  ),
  open_slots as (
    select c.* from candidates c
    where c.candidate_start > now() + make_interval(mins => (select minimum_lead_minutes from config))
      and not exists (
        select 1 from public.blocked_times bt
        where (bt.stylist_id is null or bt.stylist_id = c.candidate_stylist_id)
          and bt.start_at < c.candidate_end and bt.end_at > c.candidate_start
      )
      and not exists (
        select 1 from public.appointments ap
        where ap.stylist_id = c.candidate_stylist_id
          and ap.status in ('confirmed', 'checked_in', 'rescheduled')
          and ap.id is distinct from p_exclude_appointment_id
          and ap.start_at < c.candidate_end and ap.end_at > c.candidate_start
      )
  ),
  ranked as (
    select o.*, row_number() over (
      partition by o.candidate_start order by o.candidate_stylist_name, o.candidate_stylist_id
    ) as slot_rank from open_slots o
  )
  select r.candidate_start, r.candidate_end, r.candidate_stylist_id, r.candidate_stylist_name
  from ranked r where r.slot_rank = 1 order by r.candidate_start;
$$;

revoke all on function public.booking_calculate_slots(uuid, uuid[], uuid, date, uuid) from public, anon, authenticated;

create or replace function public.admin_available_slots(
  p_service_id uuid,
  p_addon_ids uuid[],
  p_stylist_id uuid,
  p_date date,
  p_appointment_id uuid default null
)
returns table (start_at timestamptz, end_at timestamptz, stylist_id uuid, stylist_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  return query select * from public.booking_calculate_slots(
    p_service_id, coalesce(p_addon_ids, '{}'::uuid[]), p_stylist_id, p_date, p_appointment_id
  );
end;
$$;

create or replace function public.admin_reschedule_appointment(
  p_appointment_id uuid,
  p_start_at timestamptz,
  p_stylist_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment public.appointments%rowtype;
  v_addons uuid[];
  v_end_at timestamptz;
  v_new_stylist_id uuid;
begin
  perform public.admin_assert_staff(false);
  select * into v_appointment from public.appointments where id = p_appointment_id for update;
  if v_appointment.id is null then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  if v_appointment.status not in ('confirmed', 'rescheduled') then raise exception 'APPOINTMENT_NOT_RESCHEDULABLE'; end if;
  select coalesce(array_agg(addon_id), '{}'::uuid[]) into v_addons
  from public.appointment_addons where appointment_id = v_appointment.id;

  select slots.end_at, slots.stylist_id into v_end_at, v_new_stylist_id
  from public.booking_calculate_slots(
    v_appointment.service_id, v_addons, coalesce(p_stylist_id, v_appointment.stylist_id),
    (p_start_at at time zone 'America/New_York')::date, v_appointment.id
  ) slots where slots.start_at = p_start_at limit 1;
  if v_end_at is null then raise exception 'SLOT_TAKEN'; end if;

  begin
    update public.appointments
    set start_at = p_start_at, end_at = v_end_at, stylist_id = v_new_stylist_id, status = 'rescheduled'
    where id = v_appointment.id;
  exception when exclusion_violation then raise exception 'SLOT_TAKEN';
  end;
  insert into public.appointment_history (
    appointment_id, event_type, previous_start_at, previous_end_at, new_start_at, new_end_at, previous_status, new_status
  ) values (
    v_appointment.id, 'admin_rescheduled', v_appointment.start_at, v_appointment.end_at,
    p_start_at, v_end_at, v_appointment.status, 'rescheduled'
  );
  perform public.admin_record_audit(
    'appointment_rescheduled', 'appointment', v_appointment.id,
    jsonb_build_object('booking_reference', v_appointment.booking_reference, 'previous_start_at', v_appointment.start_at, 'new_start_at', p_start_at)
  );
  return public.admin_appointment_json(v_appointment.id);
end;
$$;

create or replace function public.admin_create_appointment(
  p_customer_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_service_id uuid,
  p_addon_ids uuid[],
  p_stylist_id uuid,
  p_start_at timestamptz,
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
  v_end_at timestamptz;
  v_allocated_stylist_id uuid;
  v_reference text;
  v_token text;
  v_addon_count integer;
begin
  perform public.admin_assert_staff(false);
  if p_customer_id is not null then
    select id into v_customer_id from public.customers where id = p_customer_id;
    if v_customer_id is null then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  else
    if length(trim(coalesce(p_first_name, ''))) not between 1 and 80
      or length(trim(coalesce(p_last_name, ''))) not between 1 and 80
      or length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) not between 7 and 15
      or trim(coalesce(p_email, '')) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
      raise exception 'VALIDATION_FAILED';
    end if;
    insert into public.customers (first_name, last_name, phone, email)
    values (trim(p_first_name), trim(p_last_name), trim(p_phone), lower(trim(p_email)))
    returning id into v_customer_id;
  end if;

  select count(*) into v_addon_count
  from public.service_addons sa join public.addons ad on ad.id = sa.addon_id and ad.active
  where sa.service_id = p_service_id and sa.addon_id = any(coalesce(p_addon_ids, '{}'::uuid[]));
  if v_addon_count <> cardinality(coalesce(p_addon_ids, '{}'::uuid[])) then raise exception 'VALIDATION_FAILED'; end if;

  select slots.stylist_id, slots.end_at into v_allocated_stylist_id, v_end_at
  from public.booking_calculate_slots(
    p_service_id, coalesce(p_addon_ids, '{}'::uuid[]), p_stylist_id,
    (p_start_at at time zone 'America/New_York')::date, null
  ) slots where slots.start_at = p_start_at limit 1;
  if v_allocated_stylist_id is null then raise exception 'SLOT_TAKEN'; end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  loop
    v_reference := 'TJ-' || lpad((floor(random() * 100000))::integer::text, 5, '0');
    exit when not exists (select 1 from public.appointments where booking_reference = v_reference);
  end loop;
  begin
    insert into public.appointments (
      booking_reference, customer_id, stylist_id, service_id, start_at, end_at,
      status, customer_notes, management_token_hash
    ) values (
      v_reference, v_customer_id, v_allocated_stylist_id, p_service_id, p_start_at, v_end_at,
      'confirmed', nullif(trim(coalesce(p_customer_notes, '')), ''), digest(v_token, 'sha256')
    ) returning id into v_appointment_id;
  exception when exclusion_violation or unique_violation then raise exception 'SLOT_TAKEN';
  end;

  insert into public.appointment_addons (appointment_id, addon_id)
  select v_appointment_id, addon_id from unnest(coalesce(p_addon_ids, '{}'::uuid[])) item(addon_id);
  insert into public.appointment_history (appointment_id, event_type, new_start_at, new_end_at, new_status)
  values (v_appointment_id, 'admin_created', p_start_at, v_end_at, 'confirmed');
  perform public.admin_record_audit(
    'appointment_created', 'appointment', v_appointment_id,
    jsonb_build_object('booking_reference', v_reference, 'source', 'admin')
  );
  return public.admin_appointment_json(v_appointment_id);
end;
$$;

create or replace function public.admin_list_customers(p_query text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'first_name', c.first_name,
      'last_name', c.last_name,
      'phone', c.phone,
      'email', c.email,
      'upcoming_appointment', (
        select min(ap.start_at) from public.appointments ap
        where ap.customer_id = c.id and ap.start_at >= now() and ap.status in ('confirmed', 'checked_in', 'rescheduled')
      ),
      'last_appointment', (
        select max(ap.start_at) from public.appointments ap
        where ap.customer_id = c.id and ap.start_at < now() and ap.status <> 'cancelled'
      ),
      'previous_appointments', (
        select count(*) from public.appointments ap
        where ap.customer_id = c.id and ap.start_at < now() and ap.status <> 'cancelled'
      ),
      'no_shows', (
        select count(*) from public.appointments ap where ap.customer_id = c.id and ap.status = 'no_show'
      )
    ) order by c.last_name, c.first_name)
    from public.customers c
    where nullif(trim(coalesce(p_query, '')), '') is null
      or (c.first_name || ' ' || c.last_name) ilike '%' || trim(p_query) || '%'
      or c.phone ilike '%' || trim(p_query) || '%'
      or c.email ilike '%' || trim(p_query) || '%'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_get_customer(p_customer_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform public.admin_assert_staff(false);
  select jsonb_build_object(
    'id', c.id,
    'first_name', c.first_name,
    'last_name', c.last_name,
    'phone', c.phone,
    'email', c.email,
    'created_at', c.created_at,
    'appointments', coalesce((
      select jsonb_agg(public.admin_appointment_json(ap.id) order by ap.start_at desc)
      from public.appointments ap where ap.customer_id = c.id
    ), '[]'::jsonb)
  ) into v_result from public.customers c where c.id = p_customer_id;
  if v_result is null then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  return v_result;
end;
$$;

create or replace function public.admin_update_customer(
  p_customer_id uuid, p_first_name text, p_last_name text, p_phone text, p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  if length(trim(coalesce(p_first_name, ''))) < 1 or length(trim(coalesce(p_last_name, ''))) < 1
    or length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) not between 7 and 15
    or trim(coalesce(p_email, '')) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'VALIDATION_FAILED';
  end if;
  update public.customers set first_name = trim(p_first_name), last_name = trim(p_last_name),
    phone = trim(p_phone), email = lower(trim(p_email)) where id = p_customer_id;
  if not found then raise exception 'CUSTOMER_NOT_FOUND'; end if;
  perform public.admin_record_audit('customer_updated', 'customer', p_customer_id, '{}'::jsonb);
  return public.admin_get_customer(p_customer_id);
end;
$$;

create or replace function public.admin_reference_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  return jsonb_build_object(
    'services', coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', s.name, 'slug', s.slug, 'category', s.category,
      'description', s.description, 'duration_minutes', s.duration_minutes,
      'price_display', s.price_display, 'active', s.active,
      'addon_ids', coalesce((select jsonb_agg(sa.addon_id) from public.service_addons sa where sa.service_id = s.id), '[]'::jsonb),
      'stylist_ids', coalesce((select jsonb_agg(ss.stylist_id) from public.stylist_services ss where ss.service_id = s.id), '[]'::jsonb)
    ) order by s.category, s.name) from public.services s), '[]'::jsonb),
    'addons', coalesce((select jsonb_agg(jsonb_build_object(
      'id', a.id, 'name', a.name, 'duration_minutes', a.duration_minutes,
      'price_display', a.price_display, 'active', a.active
    ) order by a.name) from public.addons a), '[]'::jsonb),
    'stylists', coalesce((select jsonb_agg(jsonb_build_object(
      'id', st.id, 'name', st.name, 'bio', st.bio, 'image_url', st.image_url,
      'active', st.active,
      'service_ids', coalesce((select jsonb_agg(ss.service_id) from public.stylist_services ss where ss.stylist_id = st.id), '[]'::jsonb)
    ) order by st.name) from public.stylists st), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_save_service(
  p_id uuid,
  p_name text,
  p_description text,
  p_duration_minutes integer,
  p_price_display text,
  p_category text,
  p_active boolean,
  p_addon_ids uuid[],
  p_stylist_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_slug text;
begin
  perform public.admin_assert_staff(true);
  if length(trim(coalesce(p_name, ''))) < 1 or p_duration_minutes <= 0 then raise exception 'VALIDATION_FAILED'; end if;
  v_slug := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if p_id is null then
    insert into public.services (id, name, slug, category, description, duration_minutes, price_display, active)
    values (v_id, trim(p_name), v_slug || '-' || substr(v_id::text, 1, 8), trim(p_category), coalesce(trim(p_description), ''), p_duration_minutes, trim(p_price_display), p_active);
  else
    update public.services set name = trim(p_name), category = trim(p_category), description = coalesce(trim(p_description), ''),
      duration_minutes = p_duration_minutes, price_display = trim(p_price_display), active = p_active where id = p_id;
    if not found then raise exception 'SERVICE_NOT_FOUND'; end if;
  end if;
  delete from public.service_addons where service_id = v_id;
  insert into public.service_addons (service_id, addon_id)
  select v_id, id from unnest(coalesce(p_addon_ids, '{}'::uuid[])) item(id);
  delete from public.stylist_services where service_id = v_id;
  insert into public.stylist_services (stylist_id, service_id)
  select id, v_id from unnest(coalesce(p_stylist_ids, '{}'::uuid[])) item(id);
  perform public.admin_record_audit('service_saved', 'service', v_id, jsonb_build_object('active', p_active));
  return v_id;
end;
$$;

create or replace function public.admin_save_stylist(
  p_id uuid,
  p_name text,
  p_bio text,
  p_image_url text,
  p_active boolean,
  p_service_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := coalesce(p_id, gen_random_uuid());
begin
  perform public.admin_assert_staff(true);
  if length(trim(coalesce(p_name, ''))) < 1 then raise exception 'VALIDATION_FAILED'; end if;
  if p_id is null then
    insert into public.stylists (id, name, bio, image_url, active)
    values (v_id, trim(p_name), coalesce(trim(p_bio), ''), nullif(trim(coalesce(p_image_url, '')), ''), p_active);
  else
    update public.stylists set name = trim(p_name), bio = coalesce(trim(p_bio), ''),
      image_url = nullif(trim(coalesce(p_image_url, '')), ''), active = p_active where id = p_id;
    if not found then raise exception 'STYLIST_NOT_FOUND'; end if;
  end if;
  delete from public.stylist_services where stylist_id = v_id;
  insert into public.stylist_services (stylist_id, service_id)
  select v_id, id from unnest(coalesce(p_service_ids, '{}'::uuid[])) item(id);
  perform public.admin_record_audit('stylist_saved', 'stylist', v_id, jsonb_build_object('active', p_active));
  return v_id;
end;
$$;

create or replace function public.admin_list_availability()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  return jsonb_build_object(
    'schedules', coalesce((select jsonb_agg(jsonb_build_object(
      'id', av.id, 'stylist_id', av.stylist_id, 'stylist_name', st.name,
      'day_of_week', av.day_of_week, 'start_time', av.start_time, 'end_time', av.end_time, 'active', av.active
    ) order by st.name, av.day_of_week, av.start_time)
    from public.availability av join public.stylists st on st.id = av.stylist_id), '[]'::jsonb),
    'blocked_times', coalesce((select jsonb_agg(jsonb_build_object(
      'id', bt.id, 'stylist_id', bt.stylist_id, 'stylist_name', coalesce(st.name, 'Entire salon'),
      'start_at', bt.start_at, 'end_at', bt.end_at, 'reason', bt.reason
    ) order by bt.start_at)
    from public.blocked_times bt left join public.stylists st on st.id = bt.stylist_id
    where bt.end_at > now() - interval '30 days'), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_save_availability(
  p_id uuid, p_stylist_id uuid, p_day_of_week smallint, p_start_time time, p_end_time time, p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid := coalesce(p_id, gen_random_uuid());
begin
  perform public.admin_assert_staff(false);
  if p_day_of_week not between 0 and 6 or p_start_time >= p_end_time then raise exception 'VALIDATION_FAILED'; end if;
  insert into public.availability (id, stylist_id, day_of_week, start_time, end_time, active)
  values (v_id, p_stylist_id, p_day_of_week, p_start_time, p_end_time, p_active)
  on conflict (id) do update set stylist_id = excluded.stylist_id, day_of_week = excluded.day_of_week,
    start_time = excluded.start_time, end_time = excluded.end_time, active = excluded.active;
  perform public.admin_record_audit('availability_saved', 'availability', v_id, jsonb_build_object('stylist_id', p_stylist_id));
  return v_id;
end;
$$;

create or replace function public.admin_delete_availability(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  delete from public.availability where id = p_id;
  perform public.admin_record_audit('availability_removed', 'availability', p_id, '{}'::jsonb);
end;
$$;

create or replace function public.admin_create_block(
  p_stylist_id uuid, p_start_at timestamptz, p_end_at timestamptz, p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  perform public.admin_assert_staff(false);
  if p_start_at >= p_end_at then raise exception 'VALIDATION_FAILED'; end if;
  insert into public.blocked_times (stylist_id, start_at, end_at, reason)
  values (p_stylist_id, p_start_at, p_end_at, nullif(trim(coalesce(p_reason, '')), '')) returning id into v_id;
  perform public.admin_record_audit('time_blocked', 'blocked_time', v_id,
    jsonb_build_object('stylist_id', p_stylist_id, 'start_at', p_start_at, 'end_at', p_end_at));
  return v_id;
end;
$$;

create or replace function public.admin_delete_block(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  delete from public.blocked_times where id = p_id;
  perform public.admin_record_audit('block_removed', 'blocked_time', p_id, '{}'::jsonb);
end;
$$;

create or replace function public.admin_get_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  return (select to_jsonb(s) from public.salon_settings s where id = 1);
end;
$$;

create or replace function public.admin_update_settings(
  p_salon_name text, p_phone text, p_address text, p_booking_timezone text,
  p_booking_window_days integer, p_minimum_lead_minutes integer, p_cancellation_notice_hours integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(true);
  if p_booking_timezone <> 'America/New_York' then raise exception 'UNSUPPORTED_TIMEZONE'; end if;
  if p_cancellation_notice_hours <> 24 then raise exception 'CANCELLATION_POLICY_FIXED'; end if;
  update public.salon_settings set salon_name = trim(p_salon_name), phone = trim(p_phone), address = trim(p_address),
    booking_timezone = p_booking_timezone, booking_window_days = p_booking_window_days,
    minimum_lead_minutes = p_minimum_lead_minutes, cancellation_notice_hours = p_cancellation_notice_hours
  where id = 1;
  perform public.admin_record_audit('settings_updated', 'settings', null, '{}'::jsonb);
  return public.admin_get_settings();
end;
$$;

create or replace function public.admin_list_notifications(p_limit integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_assert_staff(false);
  return coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc)
    from (select * from public.admin_notifications order by created_at desc limit least(greatest(p_limit, 1), 100)) n), '[]'::jsonb);
end;
$$;

create or replace function public.admin_queue_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event text;
  v_customer_name text;
  v_body text;
begin
  if tg_op = 'INSERT' then
    v_event := 'new_booking';
  elsif new.status = 'cancelled' and old.status is distinct from new.status then
    v_event := 'cancelled';
  elsif new.start_at is distinct from old.start_at or new.end_at is distinct from old.end_at then
    v_event := 'rescheduled';
  else
    return null;
  end if;
  select c.first_name || ' ' || c.last_name into v_customer_name from public.customers c where c.id = new.customer_id;
  v_body := v_customer_name || ' · ' || new.booking_reference;
  insert into public.admin_notifications (appointment_id, event_type, title, body)
  values (new.id, v_event, case v_event when 'new_booking' then 'New Booking' when 'cancelled' then 'Booking Cancelled' else 'Booking Rescheduled' end, v_body);
  return null;
exception when others then
  raise warning 'Unable to create admin notification: %', sqlerrm;
  return null;
end;
$$;

revoke all on function public.admin_queue_notification() from public, anon, authenticated;
create trigger appointments_admin_notification
after insert or update on public.appointments
for each row execute function public.admin_queue_notification();

revoke all on function public.admin_get_profile() from public, anon;
revoke all on function public.admin_dashboard(date) from public, anon;
revoke all on function public.admin_list_appointments(timestamptz, timestamptz, text, text, uuid, uuid) from public, anon;
revoke all on function public.admin_get_appointment(uuid) from public, anon;
revoke all on function public.admin_update_appointment_status(uuid, text) from public, anon;
revoke all on function public.admin_available_slots(uuid, uuid[], uuid, date, uuid) from public, anon;
revoke all on function public.admin_reschedule_appointment(uuid, timestamptz, uuid) from public, anon;
revoke all on function public.admin_create_appointment(uuid, text, text, text, text, uuid, uuid[], uuid, timestamptz, text) from public, anon;
revoke all on function public.admin_list_customers(text) from public, anon;
revoke all on function public.admin_get_customer(uuid) from public, anon;
revoke all on function public.admin_update_customer(uuid, text, text, text, text) from public, anon;
revoke all on function public.admin_reference_data() from public, anon;
revoke all on function public.admin_save_service(uuid, text, text, integer, text, text, boolean, uuid[], uuid[]) from public, anon;
revoke all on function public.admin_save_stylist(uuid, text, text, text, boolean, uuid[]) from public, anon;
revoke all on function public.admin_list_availability() from public, anon;
revoke all on function public.admin_save_availability(uuid, uuid, smallint, time, time, boolean) from public, anon;
revoke all on function public.admin_delete_availability(uuid) from public, anon;
revoke all on function public.admin_create_block(uuid, timestamptz, timestamptz, text) from public, anon;
revoke all on function public.admin_delete_block(uuid) from public, anon;
revoke all on function public.admin_get_settings() from public, anon;
revoke all on function public.admin_update_settings(text, text, text, text, integer, integer, integer) from public, anon;
revoke all on function public.admin_list_notifications(integer) from public, anon;

grant execute on function public.admin_get_profile() to authenticated;
grant execute on function public.admin_dashboard(date) to authenticated;
grant execute on function public.admin_list_appointments(timestamptz, timestamptz, text, text, uuid, uuid) to authenticated;
grant execute on function public.admin_get_appointment(uuid) to authenticated;
grant execute on function public.admin_update_appointment_status(uuid, text) to authenticated;
grant execute on function public.admin_available_slots(uuid, uuid[], uuid, date, uuid) to authenticated;
grant execute on function public.admin_reschedule_appointment(uuid, timestamptz, uuid) to authenticated;
grant execute on function public.admin_create_appointment(uuid, text, text, text, text, uuid, uuid[], uuid, timestamptz, text) to authenticated;
grant execute on function public.admin_list_customers(text) to authenticated;
grant execute on function public.admin_get_customer(uuid) to authenticated;
grant execute on function public.admin_update_customer(uuid, text, text, text, text) to authenticated;
grant execute on function public.admin_reference_data() to authenticated;
grant execute on function public.admin_save_service(uuid, text, text, integer, text, text, boolean, uuid[], uuid[]) to authenticated;
grant execute on function public.admin_save_stylist(uuid, text, text, text, boolean, uuid[]) to authenticated;
grant execute on function public.admin_list_availability() to authenticated;
grant execute on function public.admin_save_availability(uuid, uuid, smallint, time, time, boolean) to authenticated;
grant execute on function public.admin_delete_availability(uuid) to authenticated;
grant execute on function public.admin_create_block(uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.admin_delete_block(uuid) to authenticated;
grant execute on function public.admin_get_settings() to authenticated;
grant execute on function public.admin_update_settings(text, text, text, text, integer, integer, integer) to authenticated;
grant execute on function public.admin_list_notifications(integer) to authenticated;
