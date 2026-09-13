import type { BookingData, BookingStep } from "../../App"
import { durationLabel } from "../../lib/time"
import { CANCELLATION_POLICY } from "../../config/salon"

interface Props {
  booking: BookingData
  onConfirm: () => void
  onBack: () => void
  onEdit: (step: BookingStep) => void
  submitting: boolean
  error: string
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Not selected"
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: React.ReactNode
  onEdit?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-warm-line last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">
          {label}
        </p>
        <div className="text-[14px] text-charcoal font-medium">{value}</div>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="shrink-0 text-[11px] text-bronze hover:text-charcoal transition-colors underline underline-offset-2 mt-0.5"
        >
          Edit
        </button>
      )}
    </div>
  )
}

export default function StepReview({
  booking,
  onConfirm,
  onBack,
  onEdit,
  submitting,
  error,
}: Props) {
  const totalDuration =
    (booking.service?.durationMinutes ?? 0) +
    booking.addons.reduce((total, addon) => total + addon.durationMinutes, 0)
  const stylistLabel =
    booking.stylist === "any"
      ? "Any Available Stylist"
      : booking.stylist
        ? booking.stylist.name
        : "—"

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[12px] text-warm-gray hover:text-charcoal transition-colors mb-6"
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
        Back
      </button>

      <h1 className="font-serif text-[28px] lg:text-[34px] text-charcoal mb-2">
        Review Your Appointment
      </h1>
      <p className="text-[14px] text-warm-gray mb-8">
        Please review the details before confirming.
      </p>

      {/* Appointment card */}
      <div className="bg-cream-dark p-6 lg:p-8 mb-6">
        <ReviewRow
          label="Service"
          value={booking.service?.name ?? "—"}
          onEdit={() => onEdit("service")}
        />

        {booking.addons.length > 0 && (
          <ReviewRow
            label="Add-ons"
            value={booking.addons.map((a) => a.name).join(", ")}
            onEdit={() => onEdit("service")}
          />
        )}

        <ReviewRow
          label="Stylist"
          value={stylistLabel}
          onEdit={() => onEdit("stylist")}
        />

        <ReviewRow
          label="Date"
          value={formatDate(booking.date)}
          onEdit={() => onEdit("datetime")}
        />

        <ReviewRow
          label="Time"
          value={booking.time ?? "—"}
          onEdit={() => onEdit("datetime")}
        />

        {booking.service && (
          <ReviewRow
            label="Estimated Duration"
            value={<span>{durationLabel(totalDuration)}</span>}
          />
        )}

        <ReviewRow
          label="Price"
          value={
            <span className="text-[13px] font-normal text-warm-gray italic">
              Final pricing confirmed by salon
            </span>
          }
        />
      </div>

      {/* Customer details card */}
      <div className="bg-cream-dark p-6 lg:p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-[16px] text-charcoal">
            Your Information
          </h3>
          <button
            onClick={() => onEdit("details")}
            className="text-[11px] text-bronze hover:text-charcoal transition-colors underline underline-offset-2"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-[14px] text-charcoal font-medium">
            {booking.customer.firstName} {booking.customer.lastName}
          </p>
          <p className="text-[13px] text-charcoal-mid">
            {booking.customer.phone}
          </p>
          <p className="text-[13px] text-charcoal-mid">
            {booking.customer.email}
          </p>
          {booking.customer.notes && (
            <div className="mt-3 pt-3 border-t border-warm-line">
              <p className="text-[11px] tracking-[0.12em] uppercase text-warm-gray font-medium mb-1">
                Notes
              </p>
              <p className="text-[13px] text-charcoal-mid leading-relaxed">
                {booking.customer.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-warm-line bg-cream-dark px-4 py-3 mb-8">
        <p className="text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1">
          Cancellation Policy
        </p>
        <p className="text-[12px] text-warm-gray leading-relaxed">
          {CANCELLATION_POLICY} By confirming, you agree to this policy.
        </p>
      </div>

      <p className="text-[11px] text-warm-gray leading-relaxed mb-5">
        By selecting Confirm Appointment, you agree to the{" "}
        <a
          href="/booking-terms"
          target="_blank"
          rel="noreferrer"
          className="text-bronze underline underline-offset-2"
        >
          Booking Terms & Conditions
        </a>{" "}
        and acknowledge the{" "}
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noreferrer"
          className="text-bronze underline underline-offset-2"
        >
          Privacy Policy
        </a>
        .
      </p>

      {error && (
        <div
          role="alert"
          className="border border-bronze/30 bg-bronze/[0.05] px-4 py-3 text-[12px] text-charcoal-mid leading-relaxed mb-5"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 sm:flex-none bg-charcoal text-cream text-[13px] font-medium px-10 py-4 hover:bg-bronze transition-all duration-200 tracking-wide text-center"
        >
          {submitting ? "Confirming..." : "Confirm Appointment"}
        </button>
        <button
          onClick={onBack}
          className="border border-warm-line text-charcoal text-[13px] font-medium px-8 py-4 hover:border-charcoal transition-all duration-200 tracking-wide"
        >
          Back
        </button>
      </div>
    </div>
  )
}
