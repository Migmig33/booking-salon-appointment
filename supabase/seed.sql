-- Development-only seed data. Names, durations, prices, and working hours below
-- are placeholders for testing and are not verified TJ Hair Salon business data.

insert into public.services (id, name, slug, category, description, duration_minutes, price, price_display, active)
values
  ('10000000-0000-0000-0000-000000000001', 'Women''s Haircut', 'womens-cut', 'cuts', 'Personalized cut shaped around your face, hair texture, and lifestyle - finished with a blowout.', 60, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000002', 'Men''s Haircut', 'mens-cut', 'cuts', 'Clean, precision cuts from classic to contemporary - shaped with care and attention.', 45, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000003', 'Wash & Blow Dry', 'wash-blowdry', 'styling', 'Full shampoo, conditioning treatment, and a smooth professional blowout finish.', 45, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000004', 'Hair Styling', 'styling', 'styling', 'Event-ready styling for testing the booking experience.', 60, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000005', 'Root Touch-Up', 'root-touchup', 'color', 'Development service record for a color refresh appointment.', 90, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000006', 'Single Process Color', 'single-process', 'color', 'Development service record for an all-over color appointment.', 120, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000007', 'Full Color', 'full-color', 'color', 'Development service record for a full color appointment.', 180, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000008', 'Highlights', 'highlights', 'color', 'Development service record for a highlights appointment.', 180, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000009', 'Balayage / Ombre', 'balayage', 'balayage', 'Development service record for a hand-painted color appointment.', 240, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000010', 'Bleach & Color', 'bleach-color', 'color', 'Development service record for a lightening and color appointment.', 240, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000011', 'Perm', 'perm', 'perms', 'Development service record for a perm appointment.', 180, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000012', 'Specialty Perm', 'specialty-perm', 'perms', 'Development service record for a specialty perm appointment.', 240, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000013', 'Straightening', 'straightening', 'perms', 'Development service record for a straightening appointment.', 180, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000014', 'Keratin Treatment', 'keratin', 'treatments', 'Development service record for a smoothing treatment appointment.', 180, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000015', 'Deep Conditioning', 'deep-conditioning', 'treatments', 'Development service record for a conditioning appointment.', 45, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000016', 'Hair Treatment', 'hair-treatment', 'treatments', 'Development service record for a hair treatment appointment.', 45, null, 'Development placeholder - price confirmed by salon', true),
  ('10000000-0000-0000-0000-000000000017', 'Hair Extensions Consultation', 'extensions-consult', 'treatments', 'Development service record for an extensions consultation.', 30, null, 'Development placeholder - price confirmed by salon', true)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, category = excluded.category,
  description = excluded.description, duration_minutes = excluded.duration_minutes,
  price = excluded.price, price_display = excluded.price_display, active = excluded.active;

insert into public.addons (id, name, slug, description, duration_minutes, price, price_display, active)
values
  ('20000000-0000-0000-0000-000000000001', 'Hair Treatment', 'addon-treatment', 'Development add-on record for restorative care.', 30, null, 'Development placeholder - price confirmed by salon', true),
  ('20000000-0000-0000-0000-000000000002', 'Deep Conditioning', 'addon-deep-conditioning', 'Development add-on record for additional conditioning.', 30, null, 'Development placeholder - price confirmed by salon', true),
  ('20000000-0000-0000-0000-000000000003', 'Gloss / Toner', 'addon-gloss', 'Development add-on record for gloss or toner.', 30, null, 'Development placeholder - price confirmed by salon', true),
  ('20000000-0000-0000-0000-000000000004', 'Blowout', 'addon-blowout', 'Development add-on record for a finishing blowout.', 45, null, 'Development placeholder - price confirmed by salon', true),
  ('20000000-0000-0000-0000-000000000005', 'Repair Treatment', 'addon-repair', 'Development add-on record for targeted repair care.', 30, null, 'Development placeholder - price confirmed by salon', true)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, description = excluded.description,
  duration_minutes = excluded.duration_minutes, price = excluded.price,
  price_display = excluded.price_display, active = excluded.active;

insert into public.stylists (id, name, bio, image_url, active)
values (
  '30000000-0000-0000-0000-000000000001',
  'Owen',
  'Customers frequently praise Owen for his attention to detail, precise cuts, color work, and ability to deliver the styles they show him.',
  'https://images.unsplash.com/photo-1626383137804-ff908d2753a2?w=400&h=400&fit=crop&auto=format',
  true
)
on conflict (id) do update set
  name = excluded.name, bio = excluded.bio, image_url = excluded.image_url, active = excluded.active;

insert into public.stylist_services (stylist_id, service_id)
select '30000000-0000-0000-0000-000000000001'::uuid, id from public.services
on conflict do nothing;

insert into public.service_addons (service_id, addon_id)
select s.id, a.id from public.services s cross join public.addons a
on conflict do nothing;

delete from public.availability
where stylist_id = '30000000-0000-0000-0000-000000000001';

-- Monday-Saturday, 9 AM-6 PM, strictly for local development testing.
insert into public.availability (stylist_id, day_of_week, start_time, end_time)
select
  '30000000-0000-0000-0000-000000000001'::uuid,
  day_number,
  '09:00'::time,
  '18:00'::time
from generate_series(1, 6) as day_number;
