import type { BookingData, Page } from "../../App"
import {
  DEMO_NOTICE,
  SALON_EMAIL_DISPLAY,
  SALON_LOCATION,
  SALON_LOCALE,
  SALON_NAME,
} from "../../config/salon"

interface Props {
  booking: BookingData
  bookingRef: string
  navigate: (p: Page) => void
}

function formatDateRelative(dateStr: string | null) {
  if (!dateStr) return "Date unavailable"
  const appt = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((appt.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff <= 7) {
    return appt.toLocaleDateString(SALON_LOCALE, { weekday: "long" })
  }
  return appt.toLocaleDateString(SALON_LOCALE, {
    month: "long",
    day: "numeric",
  })
}

function EmailReminder({
  booking,
  bookingRef,
}: {
  booking: BookingData
  bookingRef: string
}) {
  const stylistLabel =
    booking.stylist === "any"
      ? "any available stylist"
      : booking.stylist
        ? booking.stylist.name
        : "your stylist"
  const dayLabel = formatDateRelative(booking.date)
  const time = booking.time ?? "Time unavailable"
  const service = booking.service?.name ?? "Your service"

  return (
    <div className="bg-white border border-warm-line shadow-sm max-w-[480px] mx-auto overflow-hidden">
      {/* Email header */}
      <div className="bg-charcoal px-7 py-5">
        <p className="font-serif text-[15px] text-cream tracking-wide">
          {SALON_NAME}
        </p>
        <p className="text-[10px] text-cream/50 tracking-[0.15em] uppercase mt-0.5">
          {SALON_LOCATION}
        </p>
      </div>

      {/* Body */}
      <div className="px-7 py-7">
        <p className="text-[12px] text-warm-gray tracking-[0.12em] uppercase font-medium mb-4">
          Appointment Reminder
        </p>

        <p className="text-[15px] text-charcoal leading-relaxed mb-6">
          Your appointment is coming up.
        </p>

        {/* Appointment block */}
        <div className="bg-cream-dark px-5 py-4 mb-6 border-l-2 border-bronze">
          <p className="font-serif text-[17px] text-charcoal mb-0.5">
            {service}
            {booking.stylist &&
              booking.stylist !== "any" &&
              ` with ${stylistLabel}`}
          </p>
          <p className="text-[14px] text-charcoal-mid">
            {dayLabel} at {time}
          </p>
          {bookingRef && (
            <p className="text-[11px] text-warm-gray mt-2">{bookingRef}</p>
          )}
        </div>

        <p className="text-[12px] text-warm-gray leading-relaxed mb-6">
          {SALON_LOCATION}
          <br />
          {SALON_EMAIL_DISPLAY}
        </p>

        {/* CTA buttons */}
        <div className="space-y-2">
          <div className="bg-charcoal text-center py-2.5">
            <span className="text-[12px] font-medium text-cream tracking-wide">
              View Appointment
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-warm-line text-center py-2.5">
              <span className="text-[12px] font-medium text-charcoal tracking-wide">
                Reschedule
              </span>
            </div>
            <div className="border border-warm-line text-center py-2.5">
              <span className="text-[12px] font-medium text-charcoal tracking-wide">
                Cancel
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-cream-dark px-7 py-4 border-t border-warm-line">
        <p className="text-[10px] text-warm-gray leading-relaxed">
          You are receiving this reminder because you booked a sample
          appointment at {SALON_NAME}. If you did not make this booking, please
          contact the salon.
        </p>
      </div>
    </div>
  )
}

function SmsReminder({ booking }: { booking: BookingData }) {
  const service = booking.service?.name ?? "Your service"
  const stylistLabel =
    booking.stylist && booking.stylist !== "any"
      ? ` with ${booking.stylist.name}`
      : ""
  const dayLabel = formatDateRelative(booking.date)
  const time = booking.time ?? "Time unavailable"

  return (
    <div className="max-w-[320px] mx-auto">
      {/* Phone frame */}
      <div className="bg-[#1C1C1E] rounded-[36px] p-3 shadow-2xl">
        <div className="bg-[#1C1C1E] rounded-[28px] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1">
            <span className="text-white text-[11px] font-semibold">9:41</span>
            <div className="flex gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M1.5 8.5a13 13 0 0121 0M5.5 12a9.9 9.9 0 0113 0M9.5 15.5a6.8 6.8 0 015 0M12 19.5h.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <svg
                className="w-3.5 h-3.5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2 6h4v12H2zM7 9h4v9H7zM12 5h4v13h-4zM17 2h4v16h-4z" />
              </svg>
            </div>
          </div>

          {/* Messages header */}
          <div className="bg-[#2C2C2E] text-center py-2 px-4 mb-1">
            <p className="text-white/60 text-[10px]">
              {SALON_NAME} · {SALON_EMAIL_DISPLAY}
            </p>
          </div>

          {/* Chat bubbles */}
          <div className="px-4 py-4 space-y-2 bg-black min-h-[260px]">
            {/* Salon message */}
            <div className="flex justify-start">
              <div className="bg-[#3A3A3C] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[86%]">
                <p className="text-white text-[12px] leading-relaxed font-medium mb-0.5">
                  {SALON_NAME}
                </p>
                <p className="text-white/90 text-[12px] leading-relaxed">
                  Hi! Your appointment is coming up.
                </p>
                <p className="text-white text-[13px] font-medium mt-1">
                  {service}
                  {stylistLabel}
                </p>
                <p className="text-white/80 text-[12px]">
                  {dayLabel} at {time}
                </p>
                <p className="text-white/50 text-[10px] mt-2">
                  {SALON_LOCATION}
                </p>
                {/* Mini actions */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {["View", "Reschedule", "Cancel"].map((action) => (
                    <span
                      key={action}
                      className="bg-[#5A5A5E] text-white text-[10px] font-medium px-2.5 py-1 rounded-full"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-white/30 text-[9px] text-center">
              Reply STOP to unsubscribe
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReminderPreview({
  booking,
  bookingRef,
  navigate,
}: Props) {
  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="border-b border-warm-line bg-cream">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
          <button
            onClick={() => navigate("manage")}
            className="flex items-center gap-1.5 text-[12px] text-warm-gray hover:text-charcoal transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Appointment
          </button>
          <span className="text-[11px] tracking-[0.15em] uppercase text-warm-gray font-medium">
            Reminder Design · {DEMO_NOTICE}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
        <div className="mb-10">
          <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
            Customer Reminder
          </span>
          <h1 className="font-serif text-[30px] lg:text-[38px] text-charcoal mt-2 mb-3">
            Appointment Reminder Design
          </h1>
          <p className="text-[14px] text-charcoal-mid leading-relaxed max-w-xl">
            This is the customer-facing reminder that will be sent before
            upcoming appointments via email or SMS. The content is dynamically
            populated from the booking details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Email reminder */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <svg
                className="w-4 h-4 text-bronze"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-[13px] font-medium text-charcoal tracking-wide">
                Email Reminder
              </h2>
              <span className="text-[10px] tracking-wide text-warm-gray bg-taupe px-2 py-0.5">
                Design Preview
              </span>
            </div>
            <EmailReminder booking={booking} bookingRef={bookingRef} />
          </div>

          {/* SMS reminder */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <svg
                className="w-4 h-4 text-bronze"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h2 className="text-[13px] font-medium text-charcoal tracking-wide">
                SMS / Text Reminder
              </h2>
              <span className="text-[10px] tracking-wide text-warm-gray bg-taupe px-2 py-0.5">
                Design Preview
              </span>
            </div>
            <SmsReminder booking={booking} />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-14 border-t border-warm-line pt-8 max-w-xl">
          <h3 className="text-[13px] font-medium text-charcoal mb-3">
            Implementation Notes
          </h3>
          <ul className="space-y-2 text-[12px] text-warm-gray leading-relaxed">
            <li className="flex gap-2">
              <span className="text-bronze shrink-0">—</span>
              Reminders are sent automatically before the appointment (e.g., 24
              hours, 1 hour in advance).
            </li>
            <li className="flex gap-2">
              <span className="text-bronze shrink-0">—</span>
              All action links (View, Reschedule, Cancel) route to the
              customer-facing Manage Appointment page using its secure
              management token.
            </li>
            <li className="flex gap-2">
              <span className="text-bronze shrink-0">—</span>
              No customer account or password required — the booking reference
              link authenticates the customer.
            </li>
            <li className="flex gap-2">
              <span className="text-bronze shrink-0">—</span>
              Email and SMS delivery will be configured when the backend is
              integrated.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
