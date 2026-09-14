# Figma mock-data audit

## Migrated to Supabase

| Previous source | UI consumers | Database replacement |
| --- | --- | --- |
| `src/data/services.ts` service array | Services page, booking service step, summaries | `services`; `booking_list_services()` |
| `src/data/services.ts` add-on array | Booking service step, summaries | `addons`, `service_addons`; `booking_list_addons()` |
| `StepStylist.tsx` stylist array | Booking stylist step, summaries | `stylists`, `stylist_services`; `booking_list_stylists()` |
| `StepDateTime.tsx` fixed slots/unavailable arrays | Booking date/time step | `availability`, `blocked_times`, `appointments`; `booking_available_slots()` |
| `ManageAppointment.tsx` fixed slots and local cancellation/reschedule state | Manage appointment views | Token-authorized database functions for load, reschedule slots, reschedule, and cancellation |
| `BookingLayout.tsx` random browser booking reference | Confirmation and management | Cryptographically protected database booking creation and unique database-generated reference |

The obsolete `src/data/services.ts` module and all production booking time arrays were removed after the database-backed consumers were in place.

## Demo presentation content

`HomePage.tsx` contains stock gallery images, marketing service-preview cards, and explicitly illustrative feedback cards. They are demo presentation content, not a second booking dataset or claims about a real salon. They can move to a future CMS without changing booking authority.

The demo identity, location, locale, timezone, currency, contact address, and disclosure used by customer actions are centralized in `src/config/salon.ts`. The PHP catalog, fictional stylist, availability, descriptions, and prices in `supabase/seed.sql` are explicitly demo-only and must be replaced with client-approved data before production use.
