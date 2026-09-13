# User Business Rules: White-Label Salon Booking Platform

## Why this product exists

This repository is the reusable foundation for selling customized salon booking websites. TJ Hair Salon is the current installation and first working configuration; it is not intended to be a permanent product-wide brand.

If TJ Hair Salon does not purchase the system, the application can be rebranded for another prospective client without rebuilding the booking engine or management dashboard. Client-owned customer data, private content, credentials, and licensed assets must never be reused for another client.

Every agent or developer working in this repository must preserve this product direction.

## Current business model

Use **managed white-label installations**.

- Maintain one shared core application.
- Configure and build a separate installation for each client.
- Give each client a separate deployment, domain, database, authentication users, email identity, and environment secrets.
- Apply improvements and security fixes to the shared core so they can be released to every installation.
- Do not implement a shared multi-tenant production runtime unless the user explicitly changes this business decision.

This approach is intended to provide strong client isolation and easier early-stage sales while avoiding the operational and security complexity of a full SaaS platform.

## Reusable core versus client configuration

The reusable core includes:

- Customer service discovery and appointment booking.
- Secure customer booking lookup, rescheduling, and cancellation.
- PostgreSQL/Supabase scheduling and overlap prevention.
- Owner and manager authentication and authorization.
- Admin dashboard, calendar, appointments, customers, services, stylists, availability, blocked time, settings, notifications, and audit history.
- Transactional appointment email infrastructure.
- Responsive behavior, accessibility foundations, validation, and security controls.

Client-specific configuration includes:

- Business name, logo, location, phone, public email, timezone, and domain.
- Colors, typography, imagery, visual assets, and approved design variations.
- Homepage, about, contact, service, and other marketing content.
- Services, categories, add-ons, prices, durations, stylists, and profile images.
- Business hours, booking window, lead time, closures, and cancellation policy.
- Privacy Policy, Booking Terms, provider disclosures, and policy effective dates.
- Email sender name, sender address, provider account, and templates.
- Supabase project, Vercel project, environment variables, administrator accounts, and any future integrations.

New client-specific values should be introduced through configuration, database settings, theme tokens, or content records. Avoid adding new business names, contact details, colors, policies, or catalog values directly inside reusable components.

## Installation and data-isolation rules

Each paying client should receive an isolated installation:

```text
Shared application core
        ↓
Client configuration and approved content
        ↓
Client-specific Vercel deployment and domain
        ↓
Client-specific Supabase project and email provider
```

Within one client installation, the customer website and admin dashboard must use the same PostgreSQL/Supabase appointment records. There must be exactly one appointment source of truth per installation.

Across different clients:

- Never share appointment or customer tables.
- Never point two unrelated salons at the same production database unless a future, explicitly approved multi-tenant architecture provides proven tenant isolation.
- Never copy production customer records into another client, demo, local environment, or sales presentation.
- Never expose Supabase service-role/secret keys, email-provider keys, or administrator credentials in client-side code.
- Use fictional records in demos and development seeds.

## Source-control and customization rules

- Do not maintain a permanently diverging Git branch for every client.
- Keep reusable behavior in the shared core and express ordinary client differences as configuration or feature flags.
- A special client request should become a reusable, optional capability when practical instead of a private rewrite of core components.
- Database migrations must remain centralized, versioned, backward-conscious, and safe to apply to every supported installation.
- Preserve client-specific assets and configuration when updating the shared core.
- Track which application and database version each deployed client is running as the number of installations grows.

The preferred future structure is configuration-driven, for example:

```text
clients/
  demo/
    business configuration
    theme tokens
    approved content and assets
    catalog seed
  tj-hair-salon/
    business configuration
    theme tokens
    approved content and assets
    catalog seed
```

This directory is a target architecture, not proof that the current repository has already completed the conversion.

## Client onboarding checklist

Before calling an installation production-ready:

1. Create or select the client configuration.
2. Replace all prior-client branding, contact information, content, images, and metadata.
3. Create a separate Supabase project and apply the shared migrations.
4. Load only client-approved services, durations, prices, stylists, hours, and policies.
5. Create the initial confirmed owner account manually and disable public Auth signup.
6. Create a separate Vercel project/domain and configure only public browser-safe values in `VITE_*` variables.
7. Configure and verify the client's transactional email sender and protected worker secrets.
8. Have the client review and approve the Privacy Policy, Booking Terms, cancellation policy, contact details, and effective dates.
9. Test booking, conflicts, confirmations, lookup, rescheduling, cancellation, admin actions, blocked time, mobile layouts, and email delivery against that client's database.
10. Remove development records and confirm that no previous client's data or secrets are present.

## Legal-content rule

The included Privacy Policy and Booking Terms are implementation drafts based on the application's current behavior. They are not a substitute for legal advice and must not be represented as universally compliant boilerplate.

For every client, verify and update:

- Legal/business name and contact channels.
- Data actually collected and how it is used.
- Hosting, database, email, analytics, advertising, map, font, and other providers actually used.
- Retention and deletion practices.
- Marketing, cookie, tracking, and communication practices.
- Cancellation, late-arrival, no-show, pricing, payment, and refund rules.
- Applicable jurisdiction and client-approved effective date.

The displayed policy must remain truthful to the deployed configuration. Do not promise deletion schedules, privacy controls, security properties, or data uses that the system does not actually implement.

## Product boundaries

Unless the user explicitly changes scope:

- Do not add payment processing, deposits, credit cards, refunds, or cancellation charges.
- Do not rebuild the public site while working on the admin system.
- Do not create separate customer and admin appointment databases.
- Do not expose internal notes, customer histories, no-show information, block reasons, audit records, or staff data publicly.
- Do not let design customization weaken scheduling validation, authentication, authorization, RLS, audit history, or data isolation.
- Do not turn this into a public self-service SaaS signup product.

## Current installation and known productization gaps

The repository currently runs as the TJ Hair Salon installation. The booking system and protected admin dashboard are functional, but the white-label conversion is not finished.

Known follow-up work includes:

- Consolidate remaining TJ-specific text, contact information, metadata, and imagery into one selected client configuration.
- Move theme choices into a client-selectable token layer while preserving accessible contrast.
- Create client-specific catalog/availability seed packages rather than one generic seed.
- Automate new installation provisioning, validation, migration, and deployment as sales grow.
- Add CAPTCHA and server-side throttling to anonymous appointment creation.
- Disable Supabase public Auth signup for every production installation and add explicit confirmed-email checks for staff access.
- Replace all placeholder services, prices, descriptions, availability, and images with client-approved information.

Until those items are completed, agents must not describe the repository as already being a fully automated white-label platform. It is a working client installation being productized into that platform.

## Decision test for future work

Before implementing a change, ask:

1. Is this reusable product behavior or a single client's configuration?
2. Could it expose or mix data between installations?
3. Can the request be implemented with configuration or a feature flag instead of a client-specific fork?
4. Will the customer and admin interfaces continue to use the same authoritative records?
5. Can the change be safely upgraded across existing client installations?
6. Does any policy wording need to change so it remains truthful?

If a request would change the installation-per-client strategy, create a shared multi-tenant database, or materially weaken isolation, stop and obtain explicit user approval before proceeding.
