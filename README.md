# TJ Hair Salon customer booking app

The existing Figma Make React/Vite interface is connected to Supabase/PostgreSQL for customer booking and appointment management. The database is the source of truth for services, add-ons, stylists, availability, blocked time, appointment conflicts, customers, and appointment status.

## Local Supabase setup

1. Install the Supabase CLI and Docker, then run `supabase start`.
2. Run `supabase db reset` to apply `supabase/migrations` and the development-only `supabase/seed.sql` data.
3. Copy `.env.example` to `.env.local` and fill in the local or hosted project URL and public anon key.
4. Restart Vite after changing environment variables.

For a hosted project, link the project and run `supabase db push`, then seed only a non-production environment. The seed catalog, durations, and Monday-Saturday availability are placeholders and are not verified TJ Hair Salon business data.

## Security and scheduling

- Appointment times are stored as `timestamptz`; recurring hours are interpreted in `America/New_York` and displayed in that timezone.
- PostgreSQL calculates slots from authoritative service/add-on duration, working hours, blocked time, and active appointments.
- A GiST exclusion constraint prevents overlapping active appointments for a stylist even when simultaneous requests race.
- Public table access is revoked. Customer reads and mutations use narrowly scoped security-definer database functions.
- Management URLs use a random 256-bit token. Only its SHA-256 representation is stored.
- Booking recovery verifies reference plus email/phone, rate-limits attempts, and rotates the management token.
- No payment details are collected.

SPA hosting must rewrite `/book`, `/find-booking`, and `/manage-booking/*` requests to `index.html`.

## Customer email notifications

Booking confirmation, reschedule, cancellation, and next-day reminder emails are implemented by the `booking-email-worker` Supabase Edge Function using Resend. Database triggers add committed appointment events to `email_deliveries`; the worker claims and sends them with retries. Provider failures do not roll back appointments.

The reusable HTML/plain-text templates are in `supabase/functions/_shared/email-templates.ts`. Each email receives a fresh 256-bit management token; only its SHA-256 hash is kept as appointment authorization. The private outbox removes the plaintext token after successful or simulated delivery.

### Configure and deploy

1. Create a Resend account, verify the sending domain, and create a Resend API key.
2. Copy `supabase/functions/email.env.example` to `supabase/functions/.env.email` (it is ignored by Git), then fill in `PUBLIC_SITE_URL`, `EMAIL_FROM`, and the Resend values.
3. Link and deploy the Supabase project:

   ```sh
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   supabase secrets set --env-file supabase/functions/.env.email
   supabase functions deploy booking-email-worker --no-verify-jwt
   ```

4. In Supabase Dashboard → Integrations → Cron, schedule the `booking-email-worker` Edge Function at least every five minutes. The scheduled invocation should use a Supabase secret API key. Each run also safely enqueues tomorrow's reminders in `America/New_York` before processing the outbox.

Never put `RESEND_API_KEY` or a Supabase secret/service-role key in `.env.local`, `VITE_*` variables, frontend source, or a public hosting provider's client environment.

### Safe modes

- `EMAIL_MODE=log` is the default. It renders notifications, records them as simulated, and sends no email.
- `EMAIL_MODE=test` sends every queued notification only to `EMAIL_TEST_RECIPIENT` and prefixes the subject with `[TEST]`.
- `EMAIL_MODE=production` sends to the email stored with the appointment.

The customer application makes a best-effort worker call immediately after a successful booking action; the scheduled worker is the reliable fallback. Inspect `email_deliveries` and `email_notification_errors` from the protected Supabase dashboard for delivery status and enqueue failures.
