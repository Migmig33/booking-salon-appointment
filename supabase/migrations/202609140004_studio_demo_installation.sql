-- Convert an existing installation to the fictional Studio Demo Salon package
-- without rebuilding booking, authentication, appointment, or audit tables.

alter table public.salon_settings
  alter column salon_name set default 'Studio Demo Salon',
  alter column phone set default 'Demo contact unavailable',
  alter column address set default 'Metro Manila, Philippines',
  alter column booking_timezone set default 'Asia/Manila';

update public.salon_settings
set salon_name = 'Studio Demo Salon',
    phone = 'Demo contact unavailable',
    address = 'Metro Manila, Philippines',
    booking_timezone = 'Asia/Manila'
where id = 1;

-- Functions from already-applied installations contain the former fixed
-- timezone and booking-reference prefix inside their stored definitions. This
-- narrow replacement keeps signatures, grants, security mode, and behavior
-- intact while updating only installation-specific literals.
do $migration$
declare
  v_definition text;
begin
  for v_definition in
    select pg_get_functiondef(p.oid)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(array[
        'booking_calculate_slots',
        'booking_create_appointment',
        'booking_reschedule_appointment',
        'email_enqueue_due_reminders',
        'admin_dashboard',
        'admin_reschedule_appointment',
        'admin_create_appointment',
        'admin_update_settings'
      ])
  loop
    v_definition := replace(
      v_definition,
      'America' || chr(47) || 'New' || chr(95) || 'York',
      'Asia/Manila'
    );
    v_definition := replace(v_definition, chr(84) || chr(74) || '-', 'SDS-');
    execute v_definition;
  end loop;
end
$migration$;

-- Rotate legacy-prefixed references on any fictional appointments already in a
-- demo-safe database. Production client records must never be migrated into the
-- demo installation.
do $migration$
declare
  v_appointment_id uuid;
  v_reference text;
begin
  for v_appointment_id in
    select id
    from public.appointments
    where booking_reference like chr(84) || chr(74) || '-%'
  loop
    loop
      v_reference := 'SDS-' || lpad(
        (floor(random() * 100000))::integer::text,
        5,
        '0'
      );
      exit when not exists (
        select 1
        from public.appointments
        where booking_reference = v_reference
      );
    end loop;

    update public.appointments
    set booking_reference = v_reference
    where id = v_appointment_id;
  end loop;
end
$migration$;

update public.services as service
set name = demo.name,
    description = demo.description,
    duration_minutes = demo.duration_minutes,
    price = demo.price,
    price_display = demo.price_display
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'Ladies'' Haircut', 'Consultation, precision haircut, and basic blow-dry finish.', 60, 650::numeric, '₱650'),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'Gentlemen''s Haircut', 'Classic or contemporary cut finished and styled to preference.', 45, 450::numeric, '₱450'),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'Shampoo & Blow Dry', 'Shampoo, conditioning, and a smooth professional blow-dry finish.', 45, 500::numeric, '₱500'),
  ('10000000-0000-0000-0000-000000000004'::uuid, 'Event Hair Styling', 'Illustrative event-ready styling service for the demo booking flow.', 60, 800::numeric, 'From ₱800'),
  ('10000000-0000-0000-0000-000000000005'::uuid, 'Root Retouch', 'Color application focused on new growth, with a basic finish.', 90, 1800::numeric, 'From ₱1,800'),
  ('10000000-0000-0000-0000-000000000006'::uuid, 'Single Process Color', 'One all-over color application selected after consultation.', 120, 2500::numeric, 'From ₱2,500'),
  ('10000000-0000-0000-0000-000000000007'::uuid, 'Full Hair Color', 'Full-length color service with consultation and basic finish.', 180, 3500::numeric, 'From ₱3,500'),
  ('10000000-0000-0000-0000-000000000008'::uuid, 'Highlights', 'Dimensional highlights placed to suit the selected look.', 180, 3500::numeric, 'From ₱3,500'),
  ('10000000-0000-0000-0000-000000000009'::uuid, 'Balayage / Ombré', 'Hand-painted lightening for a soft, dimensional result.', 240, 4500::numeric, 'From ₱4,500'),
  ('10000000-0000-0000-0000-000000000010'::uuid, 'Bleach & Color', 'Lightening and color service planned during consultation.', 240, 4500::numeric, 'From ₱4,500'),
  ('10000000-0000-0000-0000-000000000011'::uuid, 'Cold Perm', 'Classic perm service for curls or added texture.', 180, 2500::numeric, 'From ₱2,500'),
  ('10000000-0000-0000-0000-000000000012'::uuid, 'Digital Perm', 'Heat-assisted perm service for soft, defined waves.', 240, 4000::numeric, 'From ₱4,000'),
  ('10000000-0000-0000-0000-000000000013'::uuid, 'Hair Rebonding', 'Long-lasting straightening service, subject to hair assessment.', 180, 3500::numeric, 'From ₱3,500'),
  ('10000000-0000-0000-0000-000000000014'::uuid, 'Keratin Smoothing', 'Smoothing treatment designed to reduce frizz and improve manageability.', 180, 3000::numeric, 'From ₱3,000'),
  ('10000000-0000-0000-0000-000000000015'::uuid, 'Deep Conditioning', 'Moisture-focused conditioning service with a basic finish.', 45, 800::numeric, '₱800'),
  ('10000000-0000-0000-0000-000000000016'::uuid, 'Scalp & Hair Treatment', 'Care treatment selected after a simple scalp and hair consultation.', 45, 900::numeric, 'From ₱900'),
  ('10000000-0000-0000-0000-000000000017'::uuid, 'Extensions Consultation', 'Sample consultation to discuss extension method, shade, and maintenance.', 30, 0::numeric, 'Complimentary consultation')
) as demo(id, name, description, duration_minutes, price, price_display)
where service.id = demo.id;

update public.addons as addon
set name = demo.name,
    description = demo.description,
    duration_minutes = demo.duration_minutes,
    price = demo.price,
    price_display = demo.price_display
from (values
  ('20000000-0000-0000-0000-000000000001'::uuid, 'Hair Spa', 'Moisture and care add-on for eligible services.', 30, 700::numeric, '+₱700'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'Deep Conditioning', 'Additional conditioning for dry or processed hair.', 30, 500::numeric, '+₱500'),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'Gloss / Toner', 'Toner or gloss add-on for eligible color services.', 30, 800::numeric, '+₱800'),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'Blow-Dry Finish', 'Polished blow-dry finish added to an eligible service.', 45, 450::numeric, '+₱450'),
  ('20000000-0000-0000-0000-000000000005'::uuid, 'Bond Repair', 'Targeted bond-care add-on for eligible color services.', 30, 1000::numeric, '+₱1,000')
) as demo(id, name, description, duration_minutes, price, price_display)
where addon.id = demo.id;

update public.stylists
set name = 'Mika Santos',
    bio = 'Fictional demo stylist offering haircuts, color, styling, and treatments across the sample service menu.'
where id = '30000000-0000-0000-0000-000000000001';

update public.availability
set start_time = '10:00'::time,
    end_time = '19:00'::time
where stylist_id = '30000000-0000-0000-0000-000000000001'
  and day_of_week between 1 and 6;
