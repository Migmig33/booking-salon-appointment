import { useEffect, useMemo, useState } from "react"
import type { Page } from "../../App"
import type { Appointment, AvailabilitySlot } from "../../types/booking"
import {
  BookingApiError,
  cancelAppointment,
  getAppointment,
  listRescheduleAvailability,
  rescheduleAppointment,
} from "../../lib/bookingApi"
import {
  dateKeyParts,
  durationLabel,
  formatAppointmentDate,
  formatAppointmentTime,
  getUpcomingSalonDates,
  salonDateKey,
} from "../../lib/time"
import { googleCalendarUrl } from "../../lib/calendar"
import {
  CANCELLATION_POLICY,
  SALON_ADDRESS,
  SALON_DIRECTIONS_URL,
  SALON_EMAIL_DISPLAY,
  SALON_EMAIL_LINK,
  SALON_NAME,
  SALON_TIME_ZONE_LABEL,
} from "../../config/salon"

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000

function canCancelAppointment(startAt: string) {
  return new Date(startAt).getTime() - Date.now() >= CANCELLATION_WINDOW_MS
}

type ManageView = "detail" | "reschedule" | "reschedule-confirm" | "cancel-confirm" | "cancelled" | "rescheduled"

interface Props {
  token: string
  initialAction: "reschedule" | "cancel" | null
  navigate: (page: Page) => void
  startBooking: () => void
  onAppointmentChange: (appointment: Appointment) => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5 border-b border-warm-line last:border-0">
      <span className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
        {label}
      </span>
      <span className="text-[14px] text-charcoal font-medium">{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const inactive =
    status === "cancelled" || status === "completed" || status === "no_show"
  const label =
    status === "no_show"
      ? "No show"
      : status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide px-3 py-1 ${
        inactive ? "bg-taupe text-warm-gray" : "bg-bronze/10 text-bronze"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          inactive ? "bg-warm-gray" : "bg-bronze"
        }`}
      />
      {label}
    </span>
  )
}

function LoadingState() {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 lg:gap-12"
      aria-label="Loading appointment"
    >
      <div className="space-y-4">
        <div className="h-8 w-48 bg-cream-dark animate-pulse" />
        <div className="h-80 bg-cream-dark animate-pulse" />
      </div>
      <div className="h-40 bg-cream-dark animate-pulse" />
    </div>
  )
}

export default function ManageAppointment({
  token,
  initialAction,
  navigate,
  startBooking,
  onAppointmentChange,
}: Props) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [actionError, setActionError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [view, setView] = useState<ManageView>("detail")
  const [newDate, setNewDate] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState<AvailabilitySlot | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState("")
  const dates = useMemo(() => getUpcomingSalonDates(14), [])

  const load = async () => {
    setLoading(true)
    setLoadError("")
    try {
      const result = await getAppointment(token)
      setAppointment(result)
      onAppointmentChange(result)
      const manageable =
        result.status === "confirmed" || result.status === "rescheduled"
      if (manageable && initialAction === "reschedule") setView("reschedule")
      if (manageable && initialAction === "cancel") setView("cancel-confirm")
    } catch (caught) {
      setLoadError(
        caught instanceof BookingApiError
          ? caught.message
          : "This appointment link is invalid or no longer available.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setLoadError("This appointment link is invalid or no longer available.")
      return
    }
    void load()
  }, [token, initialAction])

  useEffect(() => {
    if (!newDate || view !== "reschedule") return
    let active = true
    setSlotsLoading(true)
    setSlotsError("")
    listRescheduleAvailability(token, newDate)
      .then((result) => active && setSlots(result))
      .catch((caught) => {
        if (!active) return
        setSlots([])
        setSlotsError(
          caught instanceof BookingApiError
            ? caught.message
            : "Unable to load availability. Please try again.",
        )
      })
      .finally(() => active && setSlotsLoading(false))
    return () => {
      active = false
    }
  }, [newDate, token, view])

  const retrySlots = async () => {
    if (!newDate) return
    setSlotsLoading(true)
    setSlotsError("")
    try {
      setSlots(await listRescheduleAvailability(token, newDate))
    } catch (caught) {
      setSlotsError(
        caught instanceof BookingApiError
          ? caught.message
          : "Unable to load availability. Please try again.",
      )
    } finally {
      setSlotsLoading(false)
    }
  }

  const submitReschedule = async () => {
    if (!newSlot) return
    setActionLoading(true)
    setActionError("")
    try {
      const result = await rescheduleAppointment(token, newSlot.startAt)
      setAppointment(result)
      onAppointmentChange(result)
      setNewDate(null)
      setNewSlot(null)
      setView("rescheduled")
    } catch (caught) {
      setActionError(
        caught instanceof BookingApiError
          ? caught.message
          : "We couldn't reschedule your appointment. Your original time is still reserved.",
      )
    } finally {
      setActionLoading(false)
    }
  }

  const submitCancellation = async () => {
    if (appointment && !canCancelAppointment(appointment.startAt)) {
      setActionError(
        "Online cancellation closes 24 hours before your appointment. Please call the salon for assistance.",
      )
      return
    }
    setActionLoading(true)
    setActionError("")
    try {
      const result = await cancelAppointment(token)
      setAppointment(result)
      onAppointmentChange(result)
      setView("cancelled")
    } catch (caught) {
      setActionError(
        caught instanceof BookingApiError
          ? caught.message
          : "We couldn't cancel your appointment. Please try again.",
      )
    } finally {
      setActionLoading(false)
    }
  }

  const groups = [
    { label: "Morning", slots: slots.filter((slot) => slot.hour < 12) },
    {
      label: "Afternoon",
      slots: slots.filter((slot) => slot.hour >= 12 && slot.hour < 17),
    },
    { label: "Evening", slots: slots.filter((slot) => slot.hour >= 17) },
  ].filter((group) => group.slots.length > 0)

  const resetReschedule = () => {
    setNewDate(null)
    setNewSlot(null)
    setSlots([])
    setSlotsError("")
    setActionError("")
    setView("detail")
  }

  const renderError = (message: string) => (
    <div
      role="alert"
      className="border border-bronze/30 bg-bronze/[0.05] px-4 py-3 text-[12px] text-charcoal-mid leading-relaxed mb-5"
    >
      {message}
    </div>
  )

  const DetailView = () => {
    if (!appointment) return null
    const cancelled = appointment.status === "cancelled"
    const manageable =
      appointment.status === "confirmed" || appointment.status === "rescheduled"
    const cancellationAllowed = canCancelAppointment(appointment.startAt)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 lg:gap-12">
        <div>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-[12px] font-medium text-charcoal bg-cream-dark px-3 py-1.5">
              {appointment.bookingReference}
            </span>
            <StatusBadge status={appointment.status} />
          </div>

          <h2 className="font-serif text-[26px] lg:text-[32px] text-charcoal mb-1">
            Your Appointment
          </h2>
          <p className="text-[13px] text-warm-gray mb-7">
            {appointment.customer.firstName} {appointment.customer.lastName}{" "}
            &nbsp;&middot;&nbsp; {appointment.customer.email}
          </p>

          <div className="bg-cream-dark p-6 lg:p-7 mb-6">
            <DetailRow label="Service" value={appointment.service.name} />
            {appointment.addons.length > 0 && (
              <DetailRow
                label="Add-ons"
                value={appointment.addons.map((addon) => addon.name).join(", ")}
              />
            )}
            <DetailRow label="Stylist" value={appointment.stylist.name} />
            <DetailRow
              label="Date"
              value={formatAppointmentDate(appointment.startAt)}
            />
            <DetailRow
              label="Time"
              value={formatAppointmentTime(appointment.startAt)}
            />
            <DetailRow
              label="Estimated Duration"
              value={durationLabel(appointment.durationMinutes)}
            />
            <DetailRow
              label="Status"
              value={
                <span className={cancelled ? "text-warm-gray" : "text-bronze"}>
                  {appointment.status === "rescheduled"
                    ? "Rescheduled"
                    : appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1)}
                </span>
              }
            />
          </div>

          <div className="bg-cream-dark p-5 lg:p-6 flex items-start gap-3 mb-6">
            <svg
              className="w-4 h-4 text-bronze mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div>
              <p className="text-[13px] font-medium text-charcoal">
                {SALON_NAME}
              </p>
              <p className="text-[12px] text-warm-gray mt-0.5">
                {SALON_ADDRESS}
              </p>
              <a
                href={SALON_EMAIL_LINK}
                className="text-[12px] text-bronze hover:text-charcoal transition-colors mt-0.5 block"
              >
                {SALON_EMAIL_DISPLAY}
              </a>
            </div>
          </div>

          {manageable && (
            <div className="flex flex-col gap-3">
              <div className="border border-warm-line bg-cream-dark px-4 py-3">
                <p className="text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1">
                  Cancellation Policy
                </p>
                <p className="text-[12px] text-warm-gray leading-relaxed">
                  {CANCELLATION_POLICY}
                  {!cancellationAllowed && (
                    <>
                      {" "}
                      The online cancellation window for this appointment has
                      closed.
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setView("reschedule")}
                  className="flex-1 bg-charcoal text-cream text-[13px] font-medium py-3 hover:bg-bronze transition-all tracking-wide"
                >
                  Reschedule Appointment
                </button>
                <button
                  onClick={() => setView("cancel-confirm")}
                  disabled={!cancellationAllowed}
                  className="flex-1 border border-warm-line text-charcoal text-[13px] font-medium py-3 hover:border-charcoal transition-all tracking-wide disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-warm-line"
                >
                  {cancellationAllowed
                    ? "Cancel Appointment"
                    : "Cancellation Window Closed"}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={googleCalendarUrl(appointment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-warm-line text-charcoal text-[13px] font-medium py-3 hover:border-charcoal transition-all tracking-wide text-center"
                >
                  Add to Calendar
                </a>
                <a
                  href={SALON_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-warm-line text-charcoal text-[13px] font-medium py-3 hover:border-charcoal transition-all tracking-wide text-center"
                >
                  View Location
                </a>
                <a
                  href={SALON_EMAIL_LINK}
                  className="flex-1 border border-warm-line text-charcoal text-[13px] font-medium py-3 hover:border-charcoal transition-all tracking-wide text-center"
                >
                  Email Demo Contact
                </a>
              </div>
            </div>
          )}

          {!manageable && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={startBooking}
                className="bg-charcoal text-cream text-[13px] font-medium px-7 py-3 hover:bg-bronze transition-all tracking-wide"
              >
                Book Another Appointment
              </button>
              <a
                href={SALON_EMAIL_LINK}
                className="border border-warm-line text-charcoal text-[13px] font-medium px-7 py-3 hover:border-charcoal transition-all tracking-wide text-center"
              >
                Email Demo Contact
              </a>
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[100px] bg-cream-dark p-5 text-center">
            <div className="w-10 h-10 bg-taupe flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-5 h-5 text-warm-gray"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-[12px] text-warm-gray leading-relaxed">
              Appointment messages will include this secure management link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const RescheduleView = () => {
    if (!appointment) return null
    const currentDate = salonDateKey(appointment.startAt)
    return (
      <div>
        <button
          onClick={resetReschedule}
          className="flex items-center gap-1.5 text-[12px] text-warm-gray hover:text-charcoal transition-colors mb-6"
        >
          &larr; Back to Appointment
        </button>
        <h2 className="font-serif text-[26px] lg:text-[32px] text-charcoal mb-1">
          Reschedule Appointment
        </h2>
        <p className="text-[14px] text-warm-gray mb-7">
          Choose a new date and time. Your service, add-ons, and stylist stay
          the same.
        </p>

        <div className="bg-taupe px-5 py-4 mb-7 flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              Current Appointment
            </p>
            <p className="text-[14px] text-charcoal font-medium">
              {formatAppointmentDate(appointment.startAt)} &middot;{" "}
              {formatAppointmentTime(appointment.startAt)}
            </p>
          </div>
          <div className="text-warm-gray hidden sm:block">&rarr;</div>
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              New Appointment
            </p>
            <p className="text-[14px] text-charcoal font-medium">
              {newSlot
                ? `${formatAppointmentDate(newSlot.startAt)} · ${newSlot.label}`
                : "Select below"}
            </p>
          </div>
        </div>

        <p className="text-[11px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
          Select New Date
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-7">
          {dates.map((date) => {
            const parts = dateKeyParts(date)
            const current = currentDate === date
            const selected = newDate === date
            return (
              <button
                key={date}
                disabled={current}
                onClick={() => {
                  setNewDate(date)
                  setNewSlot(null)
                }}
                className={`shrink-0 w-[64px] h-[76px] flex flex-col items-center justify-center border-2 ${
                  selected
                    ? "border-charcoal bg-charcoal text-cream"
                    : current
                      ? "border-warm-line bg-taupe opacity-50 cursor-not-allowed"
                      : "border-warm-line hover:border-charcoal/40"
                }`}
              >
                <span
                  className={`text-[10px] uppercase ${
                    selected ? "text-cream/70" : "text-warm-gray"
                  }`}
                >
                  {parts.weekday}
                </span>
                <span className="text-[22px] font-serif leading-none">
                  {parts.day}
                </span>
                <span
                  className={`text-[10px] ${
                    selected ? "text-cream/70" : "text-warm-gray"
                  }`}
                >
                  {parts.month}
                </span>
              </button>
            )
          })}
        </div>

        {newDate && (
          <div className="mb-8">
            <p className="text-[11px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">
              Select New Time
            </p>
            <p className="text-[11px] text-warm-gray italic mb-4">
              All times are shown in {SALON_TIME_ZONE_LABEL}.
            </p>
            {slotsLoading && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 bg-cream-dark animate-pulse"
                  />
                ))}
              </div>
            )}
            {!slotsLoading && slotsError && (
              <div>
                {renderError(slotsError)}
                <button
                  onClick={() => void retrySlots()}
                  className="text-[12px] text-bronze underline"
                >
                  Try again
                </button>
              </div>
            )}
            {!slotsLoading && !slotsError && slots.length === 0 && (
              <div className="border-2 border-dashed border-warm-line p-7 text-[13px] text-warm-gray text-center">
                No times are available on this date.
              </div>
            )}
            {!slotsLoading &&
              !slotsError &&
              groups.map((group) => (
                <div key={group.label} className="mb-5">
                  <p className="text-[10px] tracking-wide uppercase text-warm-gray font-medium mb-2.5">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                    {group.slots.map((slot) => (
                      <button
                        key={slot.startAt}
                        onClick={() => setNewSlot(slot)}
                        className={`py-2.5 text-[12px] font-medium border-2 min-h-[48px] ${
                          newSlot?.startAt === slot.startAt
                            ? "border-charcoal bg-charcoal text-cream"
                            : "border-warm-line text-charcoal hover:border-charcoal/40"
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            disabled={!newSlot}
            onClick={() => setView("reschedule-confirm")}
            className={`px-8 py-3.5 text-[13px] font-medium tracking-wide ${
              newSlot
                ? "bg-charcoal text-cream hover:bg-bronze"
                : "bg-warm-line text-warm-gray cursor-not-allowed"
            }`}
          >
            Review Reschedule
          </button>
          <button
            onClick={resetReschedule}
            className="px-6 py-3.5 text-[13px] border border-warm-line text-charcoal hover:border-charcoal"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const RescheduleConfirmView = () => {
    if (!appointment || !newSlot) return null
    return (
      <div className="max-w-lg">
        <button
          onClick={() => {
            setActionError("")
            setView("reschedule")
          }}
          className="text-[12px] text-warm-gray hover:text-charcoal mb-6"
        >
          &larr; Back
        </button>
        <h2 className="font-serif text-[26px] lg:text-[32px] text-charcoal mb-2">
          Confirm Reschedule
        </h2>
        <p className="text-[14px] text-warm-gray mb-8">
          Please review your new appointment time before confirming.
        </p>
        <div className="space-y-3 mb-8">
          <div className="bg-taupe p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">
              Current Appointment
            </p>
            <p className="font-serif text-[18px] text-charcoal">
              {formatAppointmentDate(appointment.startAt)}
            </p>
            <p className="text-[15px] text-charcoal-mid">
              {formatAppointmentTime(appointment.startAt)}
            </p>
          </div>
          <div className="text-bronze text-center">&darr;</div>
          <div className="bg-cream-dark border-2 border-charcoal p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-bronze font-medium mb-2">
              New Appointment
            </p>
            <p className="font-serif text-[18px] text-charcoal">
              {formatAppointmentDate(newSlot.startAt)}
            </p>
            <p className="text-[15px] text-charcoal-mid">{newSlot.label}</p>
          </div>
        </div>
        <div className="bg-cream-dark p-4 text-[12px] text-charcoal-mid mb-6">
          Your {appointment.service.name} with {appointment.stylist.name}{" "}
          remains unchanged.
        </div>
        {actionError && renderError(actionError)}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            disabled={actionLoading}
            onClick={() => void submitReschedule()}
            className="bg-charcoal text-cream text-[13px] font-medium px-8 py-3.5 hover:bg-bronze"
          >
            {actionLoading ? "Rescheduling..." : "Confirm Reschedule"}
          </button>
          <button
            disabled={actionLoading}
            onClick={resetReschedule}
            className="border border-warm-line text-charcoal text-[13px] font-medium px-7 py-3.5 hover:border-charcoal"
          >
            Keep Current Appointment
          </button>
        </div>
      </div>
    )
  }

  const CancelConfirmView = () => {
    if (!appointment) return null
    const cancellationAllowed = canCancelAppointment(appointment.startAt)
    return (
      <div className="max-w-lg">
        <button
          onClick={() => {
            setActionError("")
            setView("detail")
          }}
          className="text-[12px] text-warm-gray hover:text-charcoal mb-6"
        >
          &larr; Back
        </button>
        <h2 className="font-serif text-[26px] lg:text-[32px] text-charcoal mb-2">
          Cancel Your Appointment?
        </h2>
        <p className="text-[14px] text-warm-gray mb-8 leading-relaxed">
          {CANCELLATION_POLICY}
        </p>
        <div className="bg-taupe p-6 mb-6 space-y-2.5">
          {[
            ["Service", appointment.service.name],
            ["Stylist", appointment.stylist.name],
            ["Date", formatAppointmentDate(appointment.startAt)],
            ["Time", formatAppointmentTime(appointment.startAt)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-[11px] uppercase text-warm-gray">
                {label}
              </span>
              <span className="text-[13px] text-charcoal font-medium text-right">
                {value}
              </span>
            </div>
          ))}
        </div>
        {!cancellationAllowed &&
          renderError(
            "The online cancellation window has closed. Please call the salon for assistance.",
          )}
        {actionError && renderError(actionError)}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            disabled={actionLoading || !cancellationAllowed}
            onClick={() => void submitCancellation()}
            className="border-2 border-charcoal/30 text-charcoal text-[13px] font-medium px-7 py-3.5 hover:bg-charcoal hover:text-cream disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-charcoal"
          >
            {actionLoading ? "Cancelling..." : "Yes, Cancel Appointment"}
          </button>
          <button
            disabled={actionLoading}
            onClick={() => setView("detail")}
            className="bg-charcoal text-cream text-[13px] font-medium px-7 py-3.5 hover:bg-bronze"
          >
            Keep My Appointment
          </button>
        </div>
      </div>
    )
  }

  const SuccessView = ({ cancelled }: { cancelled: boolean }) => {
    if (!appointment) return null
    return (
      <div className="max-w-lg text-center mx-auto py-6">
        <div
          className={`mx-auto mb-7 w-16 h-16 flex items-center justify-center ${
            cancelled ? "bg-taupe" : "bg-bronze/10"
          }`}
        >
          <svg
            className={`w-8 h-8 ${
              cancelled ? "text-warm-gray" : "text-bronze"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d={
                cancelled
                  ? "M6 18L18 6M6 6l12 12"
                  : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
        </div>
        <div className="inline-flex items-center gap-2 bg-cream-dark px-4 py-2 mb-5">
          <span className="text-[10px] uppercase text-warm-gray">
            Booking Reference
          </span>
          <span className="text-[13px] font-medium text-charcoal">
            {appointment.bookingReference}
          </span>
        </div>
        <h2 className="font-serif text-[30px] lg:text-[36px] text-charcoal mb-3">
          {cancelled ? "Appointment Cancelled" : "Appointment Updated"}
        </h2>
        <p className="text-[14px] text-charcoal-mid mb-8">
          {cancelled
            ? "Your appointment has been cancelled."
            : "Your appointment has been rescheduled successfully."}
        </p>
        <div
          className={`${
            cancelled ? "bg-taupe" : "bg-cream-dark"
          } p-6 text-left space-y-3 mb-8`}
        >
          {[
            ["Service", appointment.service.name],
            ["Stylist", appointment.stylist.name],
            [
              cancelled ? "Was Scheduled For" : "New Date",
              formatAppointmentDate(appointment.startAt),
            ],
            ["Time", formatAppointmentTime(appointment.startAt)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-[11px] uppercase text-warm-gray">
                {label}
              </span>
              <span className="text-[13px] text-charcoal font-medium text-right">
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {cancelled ? (
            <button
              onClick={startBooking}
              className="bg-charcoal text-cream text-[13px] font-medium px-7 py-3 hover:bg-bronze"
            >
              Book Another Appointment
            </button>
          ) : (
            <button
              onClick={() => setView("detail")}
              className="bg-charcoal text-cream text-[13px] font-medium px-7 py-3 hover:bg-bronze"
            >
              View Appointment
            </button>
          )}
          <a
            href={cancelled ? SALON_EMAIL_LINK : SALON_DIRECTIONS_URL}
            target={cancelled ? undefined : "_blank"}
            rel={cancelled ? undefined : "noopener noreferrer"}
            className="border border-warm-line text-charcoal text-[13px] font-medium px-7 py-3 hover:border-charcoal text-center"
          >
            {cancelled ? "Email Demo Contact" : "View Location"}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-warm-line bg-cream">
        <div className="max-w-4xl mx-auto px-5 lg:px-8 py-4 lg:py-5 flex items-center justify-between">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-1.5 text-[12px] text-warm-gray hover:text-charcoal transition-colors"
          >
            &larr; {SALON_NAME}
          </button>
          <span className="text-[11px] tracking-[0.15em] uppercase text-warm-gray font-medium">
            Manage Appointment
          </span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        {loading && <LoadingState />}
        {!loading && loadError && (
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-14 h-14 bg-taupe mx-auto mb-6 flex items-center justify-center text-warm-gray">
              !
            </div>
            <h1 className="font-serif text-[30px] text-charcoal mb-3">
              Invalid Management Link
            </h1>
            <p className="text-[14px] text-warm-gray mb-7">{loadError}</p>
            <button
              onClick={() => navigate("find")}
              className="bg-charcoal text-cream text-[13px] font-medium px-7 py-3 hover:bg-bronze"
            >
              Find My Booking
            </button>
          </div>
        )}
        {!loading && !loadError && view === "detail" && <DetailView />}
        {!loading && !loadError && view === "reschedule" && <RescheduleView />}
        {!loading && !loadError && view === "reschedule-confirm" && (
          <RescheduleConfirmView />
        )}
        {!loading && !loadError && view === "cancel-confirm" && (
          <CancelConfirmView />
        )}
        {!loading && !loadError && view === "cancelled" && (
          <SuccessView cancelled />
        )}
        {!loading && !loadError && view === "rescheduled" && (
          <SuccessView cancelled={false} />
        )}
      </div>
    </div>
  )
}
