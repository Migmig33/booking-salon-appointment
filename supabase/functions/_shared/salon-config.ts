function environment(name: string, fallback: string) {
  return Deno.env.get(name)?.trim() || fallback
}

export const SALON_NAME = environment("BUSINESS_NAME", "Studio Demo Salon")
export const SALON_ADDRESS = environment(
  "BUSINESS_ADDRESS",
  "Metro Manila, Philippines",
)
export const SALON_CONTACT_EMAIL = environment(
  "BUSINESS_CONTACT_EMAIL",
  "studio-demo@example.com",
)
export const SALON_CONTACT_URL = `mailto:${SALON_CONTACT_EMAIL}`
export const DIRECTIONS_URL = environment(
  "BUSINESS_DIRECTIONS_URL",
  "https://maps.google.com/?q=Metro+Manila,+Philippines",
)
export const TIME_ZONE = environment("BUSINESS_TIME_ZONE", "Asia/Manila")
export const TIME_ZONE_LABEL = environment(
  "BUSINESS_TIME_ZONE_LABEL",
  "Philippine Time (Asia/Manila)",
)
export const LOCALE = environment("BUSINESS_LOCALE", "en-PH")
export const DEMO_NOTICE = environment(
  "BUSINESS_DEMO_NOTICE",
  "Live Demo — Sample business information",
)
export const CANCELLATION_POLICY = environment(
  "BUSINESS_CANCELLATION_POLICY",
  "Appointments may only be cancelled at least 24 hours before the scheduled start time.",
)
