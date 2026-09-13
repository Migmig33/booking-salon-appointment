-- Customer self-service cancellation closes 24 hours before the appointment.
-- Salon staff can still handle exceptional cases through protected admin tools.
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
  if v_appointment.start_at < now() + interval '24 hours' then
    raise exception 'CANCELLATION_WINDOW_CLOSED';
  end if;

  update public.appointments set status = 'cancelled' where id = v_appointment.id;
  insert into public.appointment_history (appointment_id, event_type, previous_status, new_status)
  values (v_appointment.id, 'cancelled', v_appointment.status, 'cancelled');
  return public.booking_appointment_json(v_appointment.id);
end;
$$;

revoke all on function public.booking_cancel_appointment(text) from public;
grant execute on function public.booking_cancel_appointment(text) to anon, authenticated;
