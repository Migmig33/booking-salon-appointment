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
- The latest source changes were pushed to GitHub `main` on 2026-09-14.
- A production-mode worker smoke test completed successfully with an empty queue.
- Vercel production service resumed and the direct booking routes return HTTP 200.
- The production frontend now includes the browser-safe Supabase configuration.
- The hosted booking API returns 17 active services.
- Protected owner/manager dashboard deployed at `/admin/login`.
- Admin roles, staff-only RPCs, audit logs, notifications, and the `checked_in` status deployed in migrations `202609140002` and `202609140003`.
- Public access to admin RPCs returns HTTP 401 while customer service and availability queries remain operational.

No secret values belong in this file, GitHub, Vercel client variables, or `VITE_*` variables.

## Remaining

Before public launch, finish the items below. Do not run `supabase db reset` against the hosted project.

### 1. Create the first owner account

1. In Supabase Dashboard, open **Authentication → Users** and manually add the owner with a confirmed email and a strong password shared through a secure channel.
2. Use the SQL statement in the README under **Owner and manager dashboard** to add that Auth user to `public.admin_users` with role `owner`.
3. Sign in at `https://tjhairsalon.vercel.app/admin/login` and verify the dashboard loads.

There is intentionally no public admin signup flow.

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
