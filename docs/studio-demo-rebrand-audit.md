# Studio Demo Salon rebrand audit

Audit date: September 14, 2026

## Selected demo installation

- Business name: Studio Demo Salon
- Business type: Hair & Beauty Salon
- Location: Metro Manila, Philippines
- Timezone: `Asia/Manila`
- Locale: `en-PH`
- Currency: PHP / ₱
- Disclosure: Live Demo — Sample business information
- Contact: `studio-demo@example.com` (reserved sample address)

Studio Demo Salon is fictional. The source does not define a street address, physical branch, or dialable business phone number.

## Audited and converted

- Public navigation, homepage, services, booking, confirmation, booking lookup, management, reminder preview, footer, and legal pages
- Protected admin login, shell, timezone labels, and settings defaults
- Browser configuration, metadata, Figma Make metadata, filenames, and design brief
- Supabase project configuration, schema defaults, booking-reference generation, all scheduling timezone literals, reminder enqueueing, demo seed data, and the forward conversion migration
- Transactional email subjects, HTML/plain-text bodies, sender fallback, contact actions, timezone formatting, demo disclosure, and documented environment values
- README, deployment handoff, business rules, and mock-data documentation
- Hosted-project identifiers, deployment URLs, embedded browser credentials, old contact information, and former-client-specific staff/review claims

## Data and deployment boundary

The tracked source contains no hosted Supabase URL or publishable key. The ignored local `.env.local` still points at a pre-demo hosted project so the source conversion does not silently destroy or migrate external data. Replace it with a dedicated demo project before sharing a live preview. Apply `202609140004_studio_demo_installation.sql` to convert an existing demo-safe database, or create a fresh demo database from all migrations and `supabase/seed.sql`.

Do not reuse or copy customer, appointment, administrator, secret, sender, or licensed-asset data from any client installation.

## Verification

- Former identity/address/phone/domain/project-name search: no tracked-source matches
- TypeScript: `tsc --noEmit` passes
- Production bundle: `vite build` passes
- Metadata: demo title, description, and `noindex, nofollow` output confirmed
- Live preview HTTP check: unavailable because the documented development server was not listening on the supplied/default port during verification
