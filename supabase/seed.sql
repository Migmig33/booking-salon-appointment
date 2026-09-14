-- Development/demo-only seed data for Studio Demo Salon. Every record is
-- fictional and exists only to exercise the reusable booking experience.

insert into public.services (id, name, slug, category, description, duration_minutes, price, price_display, active)
values
  ('10000000-0000-0000-0000-000000000001', 'Ladies'' Haircut', 'womens-cut', 'cuts', 'Consultation, precision haircut, and basic blow-dry finish.', 60, 650, '₱650', true),
  ('10000000-0000-0000-0000-000000000002', 'Gentlemen''s Haircut', 'mens-cut', 'cuts', 'Classic or contemporary cut finished and styled to preference.', 45, 450, '₱450', true),
  ('10000000-0000-0000-0000-000000000003', 'Shampoo & Blow Dry', 'wash-blowdry', 'styling', 'Shampoo, conditioning, and a smooth professional blow-dry finish.', 45, 500, '₱500', true),
  ('10000000-0000-0000-0000-000000000004', 'Event Hair Styling', 'styling', 'styling', 'Illustrative event-ready styling service for the demo booking flow.', 60, 800, 'From ₱800', true),
  ('10000000-0000-0000-0000-000000000005', 'Root Retouch', 'root-touchup', 'color', 'Color application focused on new growth, with a basic finish.', 90, 1800, 'From ₱1,800', true),
  ('10000000-0000-0000-0000-000000000006', 'Single Process Color', 'single-process', 'color', 'One all-over color application selected after consultation.', 120, 2500, 'From ₱2,500', true),
  ('10000000-0000-0000-0000-000000000007', 'Full Hair Color', 'full-color', 'color', 'Full-length color service with consultation and basic finish.', 180, 3500, 'From ₱3,500', true),
  ('10000000-0000-0000-0000-000000000008', 'Highlights', 'highlights', 'color', 'Dimensional highlights placed to suit the selected look.', 180, 3500, 'From ₱3,500', true),
  ('10000000-0000-0000-0000-000000000009', 'Balayage / Ombré', 'balayage', 'balayage', 'Hand-painted lightening for a soft, dimensional result.', 240, 4500, 'From ₱4,500', true),
  ('10000000-0000-0000-0000-000000000010', 'Bleach & Color', 'bleach-color', 'color', 'Lightening and color service planned during consultation.', 240, 4500, 'From ₱4,500', true),
  ('10000000-0000-0000-0000-000000000011', 'Cold Perm', 'perm', 'perms', 'Classic perm service for curls or added texture.', 180, 2500, 'From ₱2,500', true),
  ('10000000-0000-0000-0000-000000000012', 'Digital Perm', 'specialty-perm', 'perms', 'Heat-assisted perm service for soft, defined waves.', 240, 4000, 'From ₱4,000', true),
  ('10000000-0000-0000-0000-000000000013', 'Hair Rebonding', 'straightening', 'perms', 'Long-lasting straightening service, subject to hair assessment.', 180, 3500, 'From ₱3,500', true),
  ('10000000-0000-0000-0000-000000000014', 'Keratin Smoothing', 'keratin', 'treatments', 'Smoothing treatment designed to reduce frizz and improve manageability.', 180, 3000, 'From ₱3,000', true),
  ('10000000-0000-0000-0000-000000000015', 'Deep Conditioning', 'deep-conditioning', 'treatments', 'Moisture-focused conditioning service with a basic finish.', 45, 800, '₱800', true),
  ('10000000-0000-0000-0000-000000000016', 'Scalp & Hair Treatment', 'hair-treatment', 'treatments', 'Care treatment selected after a simple scalp and hair consultation.', 45, 900, 'From ₱900', true),
  ('10000000-0000-0000-0000-000000000017', 'Extensions Consultation', 'extensions-consult', 'treatments', 'Sample consultation to discuss extension method, shade, and maintenance.', 30, 0, 'Complimentary consultation', true)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, category = excluded.category,
  description = excluded.description, duration_minutes = excluded.duration_minutes,
  price = excluded.price, price_display = excluded.price_display, active = excluded.active;

insert into public.addons (id, name, slug, description, duration_minutes, price, price_display, active)
values
  ('20000000-0000-0000-0000-000000000001', 'Hair Spa', 'addon-treatment', 'Moisture and care add-on for eligible services.', 30, 700, '+₱700', true),
  ('20000000-0000-0000-0000-000000000002', 'Deep Conditioning', 'addon-deep-conditioning', 'Additional conditioning for dry or processed hair.', 30, 500, '+₱500', true),
  ('20000000-0000-0000-0000-000000000003', 'Gloss / Toner', 'addon-gloss', 'Toner or gloss add-on for eligible color services.', 30, 800, '+₱800', true),
  ('20000000-0000-0000-0000-000000000004', 'Blow-Dry Finish', 'addon-blowout', 'Polished blow-dry finish added to an eligible service.', 45, 450, '+₱450', true),
  ('20000000-0000-0000-0000-000000000005', 'Bond Repair', 'addon-repair', 'Targeted bond-care add-on for eligible color services.', 30, 1000, '+₱1,000', true)
on conflict (id) do update set
  name = excluded.name, slug = excluded.slug, description = excluded.description,
  duration_minutes = excluded.duration_minutes, price = excluded.price,
  price_display = excluded.price_display, active = excluded.active;

insert into public.stylists (id, name, bio, image_url, active)
values (
  '30000000-0000-0000-0000-000000000001',
  'Mika Santos',
  'Fictional demo stylist offering haircuts, color, styling, and treatments across the sample service menu.',
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

-- Monday-Saturday, 10 AM-7 PM Philippine Time, strictly for demo testing.
insert into public.availability (stylist_id, day_of_week, start_time, end_time)
select
  '30000000-0000-0000-0000-000000000001'::uuid,
  day_number,
  '10:00'::time,
  '19:00'::time
from generate_series(1, 6) as day_number;
