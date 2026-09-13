# TJ Hair Salon — Remaining Deployment Tasks

This file is a handoff checklist for completing the Supabase/Brevo booking-email deployment.

## Completed

- Customer booking data layer and PostgreSQL migrations created.
- Transactional email outbox, retries, and error logging created.
- Reusable booking, reschedule, cancellation, and reminder templates created.
- Supabase Edge Function supports Brevo by default, with Resend as an alternative.
- Vercel SPA rewrites added for `/book`, `/find-booking`, and `/manage-booking/*`.
- Supabase CLI installed as a project development dependency.
- Supabase CLI authenticated and linked to project `jwqdomybmrnfokdngtka`.
- Required Brevo/email secret names configured in Supabase.
- `EMAIL_MODE=production` configured in Supabase.
- Hosted migrations `202609130001` and `202609130002` verified as applied on 2026-09-14.
- `booking-email-worker` deployed to project `jwqdomybmrnfokdngtka` on 2026-09-14.
- The production Vite build passes.

No secret values belong in this file, GitHub, Vercel client variables, or `VITE_*` variables.

## Remaining

Before public launch, finish the items below. Do not run `supabase db reset` against the hosted project.

### 1. Publish and verify the latest website code

- Push the current source changes to the connected GitHub repository.
- Confirm Vercel completes a new production deployment.
- Confirm these URLs load directly in a new/incognito browser tab:
  - `https://tjhairsalon.vercel.app/book`
  - `https://tjhairsalon.vercel.app/find-booking`
  - A valid `/manage-booking/<token>` URL after making a booking

### 2. Test real email delivery

1. Confirm the Brevo sender email is verified.
2. Book an appointment at `https://tjhairsalon.vercel.app/book` using an email address you can check.
3. Confirm receipt of **Your TJ Hair Salon Appointment is Confirmed**.
4. Open **Manage Appointment** in another browser/incognito window.
5. Reschedule and confirm the update email arrives.
6. Cancel and confirm the cancellation email arrives.

If delivery fails, inspect:

- Supabase Table Editor → `email_deliveries`
- Supabase Table Editor → `email_notification_errors`
- Supabase Edge Functions → `booking-email-worker` → Logs
- Brevo → Transactional → Logs

Delivery statuses:

- `queued`: waiting for the worker or a retry
- `processing`: currently claimed by the worker
- `sent`: accepted by Brevo
- `failed`: retry limit reached; inspect `last_error`

### 3. Configure reminder/retry scheduling

In Supabase Dashboard:

1. Open **Integrations → Cron**.
2. Create a job named `booking-email-worker`.
3. Use schedule `*/5 * * * *`.
4. Select the `booking-email-worker` Supabase Edge Function.
5. Use `POST` and authenticate with a newly rotated Supabase secret key.
6. Save and enable the job.

The worker queues next-day reminders using `America/New_York` and also retries pending email deliveries.

## Security follow-up before public launch

- Rotate the Supabase secret key that was previously shared in chat.
- Never expose the replacement Supabase secret or Brevo API key in frontend code.
- Add CAPTCHA and server-side rate limiting to anonymous booking creation to reduce booking/email abuse.
- Consider changing the email worker to secret-only authentication once Cron is active.
- Replace all development seed services, availability, descriptions, and placeholder pricing with salon-approved information before treating the site as production.
