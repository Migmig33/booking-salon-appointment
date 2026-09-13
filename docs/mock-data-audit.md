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

## Intentionally retained presentation content

`HomePage.tsx` still contains the Figma-generated gallery images, marketing service-preview cards, and testimonial-theme cards. These are presentation/marketing content, not a second booking dataset, and remain in place to preserve the approved design. They can move to a future CMS without changing booking authority.

The salon contact/location strings used by customer actions are centralized in `src/config/salon.ts`. Seed durations, availability, and service descriptions are explicitly development-only and must be verified before production use.
