import type { Page } from "../../App"
import type { Appointment } from "../../types/booking"
import { googleCalendarUrl } from "../../lib/calendar"
import { durationLabel, formatAppointmentDate, formatAppointmentTime } from "../../lib/time"
import {
  CANCELLATION_POLICY,
  SALON_ADDRESS,
  SALON_DIRECTIONS_URL,
  SALON_PHONE_LINK,
} from "../../config/salon"

interface Props {
  appointment: Appointment
  managementToken: string
  navigate: (page: Page) => void
  openManagement: (token: string) => void
}

export default function StepConfirm({ appointment, managementToken, navigate, openManagement }: Props) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-cream flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="max-w-xl w-full text-center">
          <div className="mx-auto mb-7 w-16 h-16 flex items-center justify-center bg-bronze/10">
            <svg className="w-8 h-8 text-bronze" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="inline-flex items-center gap-2 bg-cream-dark px-4 py-2 mb-6">
            <span className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">Booking Reference</span>
            <span className="text-[13px] font-medium text-charcoal">{appointment.bookingReference}</span>
          </div>

          <h1 className="font-serif text-[36px] lg:text-[44px] text-charcoal mb-4 leading-tight">
            You&apos;re Booked!
          </h1>
          <p className="text-[14px] text-charcoal-mid leading-relaxed mb-8 max-w-sm mx-auto">
            Your appointment has been successfully scheduled. We look forward to seeing you.
          </p>

          <div className="bg-cream-dark p-6 text-left mb-6 space-y-3">
            {[
              { label: "Service", value: appointment.service.name },
              appointment.addons.length > 0
                ? { label: "Add-ons", value: appointment.addons.map((addon) => addon.name).join(", ") }
                : null,
              { label: "Stylist", value: appointment.stylist.name },
              { label: "Date", value: formatAppointmentDate(appointment.startAt) },
              { label: "Time", value: formatAppointmentTime(appointment.startAt) },
              { label: "Duration", value: durationLabel(appointment.durationMinutes) },
              {
                label: "Customer",
                value: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
              },
              { label: "Phone", value: appointment.customer.phone },
              { label: "Email", value: appointment.customer.email },
              { label: "Location", value: SALON_ADDRESS },
            ]
              .filter(Boolean)
              .map((row) => (
                <div key={row!.label} className="flex justify-between gap-4">
                  <span className="text-[11px] tracking-[0.12em] uppercase text-warm-gray font-medium shrink-0">
                    {row!.label}
                  </span>
                  <span className="text-[13px] text-charcoal font-medium text-right">{row!.value}</span>
                </div>
              ))}
          </div>

          <p className="text-[12px] text-warm-gray leading-relaxed mb-6">
            <span className="font-medium text-charcoal">Cancellation policy:</span>{" "}
            {CANCELLATION_POLICY}
          </p>

          <button
            onClick={() => openManagement(managementToken)}
            className="w-full bg-charcoal text-cream text-[13px] font-medium py-3.5 hover:bg-bronze transition-all duration-200 tracking-wide mb-3"
          >
            Manage Appointment
          </button>

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <a
              href={googleCalendarUrl(appointment)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-warm-line text-charcoal text-[13px] font-medium py-2.5 hover:border-charcoal transition-all duration-200 tracking-wide text-center"
            >
              Add to Calendar
            </a>
            <a
              href={SALON_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-warm-line text-charcoal text-[13px] font-medium py-2.5 hover:border-charcoal transition-all duration-200 tracking-wide text-center"
            >
              Get Directions
            </a>
            <a
              href={SALON_PHONE_LINK}
              className="flex-1 border border-warm-line text-charcoal text-[13px] font-medium py-2.5 hover:border-charcoal transition-all duration-200 tracking-wide text-center"
            >
              Call Salon
            </a>
          </div>

          <button
            onClick={() => navigate("home")}
            className="mt-5 text-[12px] text-warm-gray hover:text-charcoal transition-colors underline underline-offset-2"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  )
}
