# Studio Demo Salon design brief

Create a polished customer-facing website and appointment-booking experience for **Studio Demo Salon**, a fictional **Hair & Beauty Salon** demonstration set in **Metro Manila, Philippines**.

## Required disclosure

Display **Live Demo — Sample business information** in a clear but visually subtle location. Do not represent the salon, location, staff, customer feedback, gallery photographs, contact details, prices, policies, or opening hours as belonging to a real operating business.

## Regional settings

- Timezone: `Asia/Manila`
- Display timezone: Philippine Time
- Locale: `en-PH`
- Currency: PHP / ₱
- Location label: Metro Manila, Philippines
- Demo contact: `studio-demo@example.com`

## Product boundary

Preserve the existing database-backed services, stylist selection, availability, booking, secure cross-device management, rescheduling, cancellation, authentication, confirmation, and email-notification behavior. Presentation content may be customized, but scheduling validation and secure access must remain unchanged.

## Content treatment

- Use fictional staff names and biographies.
- Mark review cards as illustrative sample feedback.
- Mark stock gallery imagery as demonstration content, not salon work.
- Use Philippine salon terminology and sample PHP pricing.
- Describe the location as a sample region only; do not invent a street address or physical branch.
- Use the reserved `example.com` email address instead of a dialable sample phone number.

The source of truth for browser presentation values is `src/config/salon.ts`. Edge-function email presentation values are configured through the `BUSINESS_*` variables documented in `supabase/functions/email.env.example`.
