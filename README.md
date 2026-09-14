# White-label salon booking platform

> **Product direction:** This repository is the shared foundation for separately deployed, configuration-driven salon installations. The selected installation is the fictional **Studio Demo Salon** package for Metro Manila. Read [USER_BUSINESS_RULES.md](./USER_BUSINESS_RULES.md) before changing architecture, branding, client data, deployment strategy, or legal content.

The public experience is marked **Live Demo — Sample business information**. It must use a dedicated non-production Supabase project containing fictional records only and must never point at a client installation.

The existing Figma Make React/Vite interface is connected to Supabase/PostgreSQL for customer booking and appointment management. The database is the source of truth for services, add-ons, stylists, availability, blocked time, appointment conflicts, customers, and appointment status.

## Local Supabase setup

1. Install the Supabase CLI and Docker, then run `supabase start`.
2. Run `supabase db reset` to apply `supabase/migrations` and the development-only `supabase/seed.sql` data.
3. Copy `.env.example` to `.env.local` and fill in the local or hosted project URL and public anon key.
4. Restart Vite after changing environment variables.

For a hosted project, link a dedicated demo project and run `supabase db push`, then seed only that non-production environment. The PHP catalog, fictional stylist, and Monday-Saturday availability are sample data for demonstrating the booking flow.

## Security and scheduling

- Appointment times are stored as `timestamptz`; recurring demo hours are interpreted in `Asia/Manila` and displayed as Philippine Time.
- PostgreSQL calculates slots from authoritative service/add-on duration, working hours, blocked time, and active appointments.
- A GiST exclusion constraint prevents overlapping active appointments for a stylist even when simultaneous requests race.
- Public table access is revoked. Customer reads and mutations use narrowly scoped security-definer database functions.
- Management URLs use a random 256-bit token. Only its SHA-256 representation is stored.
- Booking recovery verifies reference plus email/phone, rate-limits attempts, and rotates the management token.
- No payment details are collected.

SPA hosting must rewrite `/book`, `/find-booking`, and `/manage-booking/*` requests to `index.html`.

## Owner and manager dashboard

The protected salon dashboard is available at `/admin/login`. It uses the same `appointments`, `customers`, `services`, `stylists`, `availability`, and `blocked_times` records as the customer booking flow. Staff mutations are validated by security-definer PostgreSQL functions, retain appointment history, and write audit records.

Admin signup is intentionally not exposed. To create the first owner:

1. In Supabase Dashboard, open **Authentication → Users** and manually add the owner with a confirmed email and a strong password shared through a secure channel.
2. In SQL Editor, assign that Auth user to the owner role:

   ```sql
   insert into public.admin_users (user_id, role, display_name)
   select id, 'owner', 'Salon Owner'
   from auth.users
   where email = 'owner@example.com';
   ```

Replace the example email and display name before running the statement. Manager accounts are added the same way with role `manager`. Never add public signup to the admin login screen.

The dashboard polls operational data every 30 seconds. Realtime subscriptions can be added later without changing the shared appointment model.

## Customer email notifications

Booking confirmation, reschedule, cancellation, and next-day reminder emails are implemented by the `booking-email-worker` Supabase Edge Function. Brevo is the default provider, with Resend available as an alternative. Database triggers add committed appointment events to `email_deliveries`; the worker claims and sends them with retries. Provider failures do not roll back appointments.

The reusable HTML/plain-text templates are in `supabase/functions/_shared/email-templates.ts`. Each email receives a fresh 256-bit management token; only its SHA-256 hash is kept as appointment authorization. The private outbox removes the plaintext token after successful or simulated delivery.

### Configure and deploy

1. Create a Brevo account, verify a sender email, and create a Brevo API key under Transactional → SMTP & API. A custom domain is recommended but is not required for the free sender-email setup.
2. Copy `supabase/functions/email.env.example` to `supabase/functions/.env.email` (it is ignored by Git), then fill in the `BUSINESS_*`, `PUBLIC_SITE_URL`, `BREVO_API_KEY`, `EMAIL_FROM_NAME`, and `EMAIL_FROM_ADDRESS` values for the selected installation.
3. Link and deploy the Supabase project:

   ```sh
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   supabase secrets set --env-file supabase/functions/.env.email
   supabase functions deploy booking-email-worker --no-verify-jwt
   ```

4. In Supabase Dashboard → Integrations → Cron, schedule the `booking-email-worker` Edge Function at least every five minutes. The scheduled invocation should use a Supabase secret API key. Each run also safely enqueues tomorrow's reminders in `Asia/Manila` before processing the outbox.

Never put `BREVO_API_KEY`, `RESEND_API_KEY`, or a Supabase secret/service-role key in `.env.local`, `VITE_*` variables, frontend source, or a public hosting provider's client environment.

### Safe modes

- `EMAIL_MODE=log` is the default. It renders notifications, records them as simulated, and sends no email.
- `EMAIL_MODE=test` sends every queued notification only to `EMAIL_TEST_RECIPIENT` and prefixes the subject with `[TEST]`.
- `EMAIL_MODE=production` sends to the email stored with the appointment.

The customer application makes a best-effort worker call immediately after a successful booking action; the scheduled worker is the reliable fallback. Inspect `email_deliveries` and `email_notification_errors` from the protected Supabase dashboard for delivery status and enqueue failures.
