# Studio Demo Salon — Deployment Checklist

This handoff applies only to the fictional, non-production Philippine demo installation.

## Source package completed

- Customer booking, secure lookup, rescheduling, cancellation, and confirmation remain connected to the shared PostgreSQL appointment model.
- Owner/manager dashboard, availability, catalog, customer records, notifications, and audit history remain intact.
- Public UI, metadata, email templates, database defaults, reference generation, and documentation use the Studio Demo Salon identity.
- Demo scheduling uses `Asia/Manila`; sample catalog prices use PHP / ₱.
- Stock gallery imagery, illustrative feedback, fictional staff, and sample business information are clearly disclosed.
- Browser source currently retains the existing browser-safe production Supabase URL and publishable key as a fallback because Vercel does not define the `VITE_SUPABASE_*` values. Environment variables override the fallback.

## Required before sharing a live URL

1. Create a dedicated non-production Supabase project for this demo. Never reuse a client project or copy client customer/appointment data.
2. Apply all migrations and load `supabase/seed.sql` into the demo project.
3. Point local and hosting `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values only at that demo project.
4. Create fictional demo staff accounts manually and keep public Auth signup disabled.
5. Configure a demo-only email sender and the `BUSINESS_*` values documented in `supabase/functions/email.env.example`.
6. Deploy `booking-email-worker`, schedule it at least every five minutes, and confirm reminders use `Asia/Manila`.
7. Test booking, concurrent conflict prevention, confirmation, lookup, cross-device management, rescheduling, cancellation, admin actions, and email delivery against fictional records.

## Production boundary

Studio Demo Salon is not an operating business. Its catalog, prices, stylist, availability, contact address, images, testimonials, policies, and location are samples and must be replaced with client-approved information in a separate installation before production use.

Never commit or expose a Supabase secret/service-role key, email-provider key, administrator credential, or customer data.
