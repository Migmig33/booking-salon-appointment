-- Transactional email outbox. Appointment writes commit independently from
-- provider delivery; failed sends stay available for retry and diagnostics.

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null check (event_type in ('booking', 'reschedule', 'cancellation', 'reminder')),
  event_key text not null unique,
  recipient_email text not null,
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed', 'simulated')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  provider_message_id text,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_notification_errors (
  id bigint generated always as identity primary key,
  appointment_id uuid references public.appointments(id) on delete set null,
  event_type text,
  error_message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists email_deliveries_queue_idx
  on public.email_deliveries (available_at, created_at)
  where status = 'queued';
create index if not exists email_deliveries_appointment_idx
  on public.email_deliveries (appointment_id, created_at desc);

drop trigger if exists email_deliveries_set_updated_at on public.email_deliveries;
create trigger email_deliveries_set_updated_at before update on public.email_deliveries
for each row execute function public.set_updated_at();

alter table public.email_deliveries enable row level security;
alter table public.email_notification_errors enable row level security;

revoke all on table public.email_deliveries, public.email_notification_errors
from anon, authenticated;

create or replace function public.email_queue_appointment_event(
  p_appointment_id uuid,
  p_event_type text,
  p_event_key text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_payload jsonb;
  v_token text;
  v_recipient text;
  v_expires_at timestamptz;
begin
  if p_event_type not in ('booking', 'reschedule', 'cancellation', 'reminder') then
    raise exception 'INVALID_EMAIL_EVENT_TYPE';
  end if;

  -- The unique event key makes scheduled reminders and database retries idempotent.
  if exists (select 1 from public.email_deliveries where event_key = p_event_key) then
    return;
  end if;

  v_payload := public.booking_appointment_json(p_appointment_id);
  if v_payload is null then
    raise exception 'APPOINTMENT_NOT_FOUND';
  end if;

  v_recipient := lower(trim(v_payload #>> '{customer,email}'));
  if v_recipient is null or v_recipient = '' then
    raise exception 'APPOINTMENT_EMAIL_MISSING';
  end if;

  -- Only the hash is retained as booking authorization. The plaintext token is
  -- private outbox data and is removed after a successful/simulated delivery.
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := greatest(
    (v_payload->>'end_at')::timestamptz + interval '90 days',
    now() + interval '30 days'
  );

  insert into public.appointment_management_links (
    appointment_id,
    token_hash,
    purpose,
    expires_at
  ) values (
    p_appointment_id,
    digest(v_token, 'sha256'),
    'email',
    v_expires_at
  );

  insert into public.email_deliveries (
    appointment_id,
    event_type,
    event_key,
    recipient_email,
    payload
  ) values (
    p_appointment_id,
    p_event_type,
    p_event_key,
    v_recipient,
    v_payload || jsonb_build_object('management_token', v_token)
  );
end;
$$;

revoke all on function public.email_queue_appointment_event(uuid, text, text)
from public, anon, authenticated;

create or replace function public.email_queue_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_event_type text;
  v_event_key text;
begin
  if tg_op = 'INSERT' then
    v_event_type := 'booking';
    v_event_key := 'booking:' || new.id::text;
  elsif new.status = 'cancelled' and old.status is distinct from new.status then
    v_event_type := 'cancellation';
    v_event_key := 'cancellation:' || new.id::text;
  elsif (
    new.start_at is distinct from old.start_at
    or new.end_at is distinct from old.end_at
    or (new.status = 'rescheduled' and old.status is distinct from new.status)
  ) then
    v_event_type := 'reschedule';
    v_event_key := 'reschedule:' || new.id::text || ':' || gen_random_uuid()::text;
  else
    return null;
  end if;

  perform public.email_queue_appointment_event(new.id, v_event_type, v_event_key);
  return null;
exception
  when others then
    -- Notification failures must never roll back a valid booking mutation.
    begin
      insert into public.email_notification_errors (
        appointment_id,
        event_type,
        error_message,
        context
      ) values (
        new.id,
        v_event_type,
        left(sqlerrm, 1000),
        jsonb_build_object('operation', tg_op)
      );
    exception when others then
      raise warning 'Unable to log appointment email enqueue failure: %', sqlerrm;
    end;
    return null;
end;
$$;

revoke all on function public.email_queue_appointment_change()
from public, anon, authenticated;

drop trigger if exists appointments_queue_email on public.appointments;
create constraint trigger appointments_queue_email
after insert or update on public.appointments
deferrable initially deferred
for each row execute function public.email_queue_appointment_change();

create or replace function public.email_enqueue_due_reminders(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_appointment record;
  v_count integer := 0;
begin
  for v_appointment in
    select ap.id, (ap.start_at at time zone 'America/New_York')::date as local_date
    from public.appointments ap
    where ap.status in ('confirmed', 'rescheduled')
      and ap.start_at > p_now
      and (ap.start_at at time zone 'America/New_York')::date
        = (p_now at time zone 'America/New_York')::date + 1
  loop
    perform public.email_queue_appointment_event(
      v_appointment.id,
      'reminder',
      'reminder:' || v_appointment.id::text || ':' || v_appointment.local_date::text
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.email_enqueue_due_reminders(timestamptz)
from public, anon, authenticated;
grant execute on function public.email_enqueue_due_reminders(timestamptz) to service_role;

create or replace function public.email_claim_deliveries(p_limit integer default 10)
returns table (
  id uuid,
  event_type text,
  event_key text,
  recipient_email text,
  payload jsonb,
  attempts integer
)
language sql
security definer
set search_path = public
as $$
  with candidates as (
    select delivery.id
    from public.email_deliveries delivery
    where (
      delivery.status = 'queued'
      and delivery.available_at <= now()
    ) or (
      delivery.status = 'processing'
      and delivery.locked_at < now() - interval '10 minutes'
    )
    order by delivery.created_at
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    for update skip locked
  ), claimed as (
    update public.email_deliveries delivery
    set status = 'processing',
        attempts = delivery.attempts + 1,
        locked_at = now(),
        last_error = null
    from candidates
    where delivery.id = candidates.id
    returning delivery.id,
              delivery.event_type,
              delivery.event_key,
              delivery.recipient_email,
              delivery.payload,
              delivery.attempts
  )
  select * from claimed;
$$;

revoke all on function public.email_claim_deliveries(integer)
from public, anon, authenticated;
grant execute on function public.email_claim_deliveries(integer) to service_role;

create or replace function public.email_finish_delivery(
  p_delivery_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error text default null,
  p_retry_seconds integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('queued', 'sent', 'failed', 'simulated') then
    raise exception 'INVALID_EMAIL_DELIVERY_STATUS';
  end if;

  update public.email_deliveries
  set status = p_status,
      provider_message_id = nullif(trim(coalesce(p_provider_message_id, '')), ''),
      last_error = case when p_error is null then null else left(p_error, 1000) end,
      available_at = case
        when p_status = 'queued' then now() + make_interval(secs => greatest(coalesce(p_retry_seconds, 60), 1))
        else available_at
      end,
      locked_at = null,
      sent_at = case when p_status in ('sent', 'simulated') then now() else sent_at end,
      payload = case
        when p_status in ('sent', 'simulated') then payload - 'management_token'
        else payload
      end
  where id = p_delivery_id;
end;
$$;

revoke all on function public.email_finish_delivery(uuid, text, text, text, integer)
from public, anon, authenticated;
grant execute on function public.email_finish_delivery(uuid, text, text, text, integer) to service_role;
