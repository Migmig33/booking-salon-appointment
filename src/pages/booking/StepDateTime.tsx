import { useEffect, useMemo, useState } from "react"
import type { BookingData } from "../../App"
import type { AvailabilitySlot } from "../../types/booking"
import { BookingApiError, listAvailability } from "../../lib/bookingApi"
import {
  dateKeyParts,
  formatDateKey,
  getUpcomingSalonDates,
} from "../../lib/time"
import BookingSummary from "./BookingSummary"
import { SALON_TIME_ZONE_LABEL } from "../../config/salon"

interface Props {
  booking: BookingData
  setBooking: (booking: BookingData) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDateTime({
  booking,
  setBooking,
  onNext,
  onBack,
}: Props) {
  const dates = useMemo(() => getUpcomingSalonDates(14), [])
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadSlots = async () => {
    if (!booking.date || !booking.service || !booking.stylist) return
    setLoading(true)
    setError("")
    try {
      const result = await listAvailability(
        booking.service.id,
        booking.addons.map((addon) => addon.id),
        booking.stylist === "any" ? null : booking.stylist.id,
        booking.date,
      )
      setSlots(result)
    } catch (caught) {
      setSlots([])
      setError(
        caught instanceof BookingApiError
          ? caught.message
          : "Unable to load availability. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    if (!booking.date || !booking.service || !booking.stylist) return
    setLoading(true)
    setError("")
    listAvailability(
      booking.service.id,
      booking.addons.map((addon) => addon.id),
      booking.stylist === "any" ? null : booking.stylist.id,
      booking.date,
    )
      .then((result) => active && setSlots(result))
      .catch((caught) => {
        if (!active) return
        setSlots([])
        setError(
          caught instanceof BookingApiError
            ? caught.message
            : "Unable to load availability. Please try again.",
        )
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [
    booking.date,
    booking.service?.id,
    booking.stylist === "any" ? "any" : booking.stylist?.id,
    booking.addons.map((addon) => addon.id).join(","),
  ])

  const selectDate = (date: string) => {
    setBooking({ ...booking, date, time: null, startAt: null })
  }

  const selectTime = (slot: AvailabilitySlot) => {
    setBooking({ ...booking, time: slot.label, startAt: slot.startAt })
  }

  const groups = [
    { label: "Morning", slots: slots.filter((slot) => slot.hour < 12) },
    {
      label: "Afternoon",
      slots: slots.filter((slot) => slot.hour >= 12 && slot.hour < 17),
    },
    { label: "Evening", slots: slots.filter((slot) => slot.hour >= 17) },
  ].filter((group) => group.slots.length > 0)
  const canContinue = Boolean(booking.date && booking.startAt)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 lg:gap-10">
      <div>
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

        <h1 className="font-serif text-[28px] lg:text-[34px] text-charcoal mb-1">
          When would you like to visit?
        </h1>
        <p className="text-[14px] text-warm-gray mb-7">
          Select a date, then choose an available time.
        </p>

        <div className="mb-8">
          <p className="text-[11px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
            Select a Date
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
            {dates.map((date) => {
              const parts = dateKeyParts(date)
              const selected = booking.date === date
              return (
                <button
                  key={date}
                  onClick={() => selectDate(date)}
                  className={`shrink-0 w-[50px] h-[64px] flex flex-col items-center justify-center gap-0.5 border-2 transition-all duration-150 ${
                    selected
                      ? "border-charcoal bg-charcoal text-cream"
                      : "border-warm-line bg-cream hover:border-charcoal/40 text-charcoal"
                  }`}
                >
                  <span
                    className={`text-[9px] font-medium tracking-wide uppercase ${
                      selected ? "text-cream/70" : "text-warm-gray"
                    }`}
                  >
                    {parts.weekday}
                  </span>
                  <span
                    className={`text-[18px] font-serif leading-none ${
                      selected ? "text-cream" : "text-charcoal"
                    }`}
                  >
                    {parts.day}
                  </span>
                  <span
                    className={`text-[9px] ${
                      selected ? "text-cream/70" : "text-warm-gray"
                    }`}
                  >
                    {parts.month}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {booking.date && (
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-4">
              Available Times
            </p>
            <p className="text-[11px] text-warm-gray italic mb-4">
              All times are shown in {SALON_TIME_ZONE_LABEL}.
            </p>

            {loading && (
              <div
                className="grid grid-cols-3 gap-2"
                aria-label="Loading available times"
              >
                {Array.from({ length: 9 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-11 bg-cream-dark animate-pulse"
                  />
                ))}
              </div>
            )}
            {!loading && error && (
              <div
                role="alert"
                className="border border-warm-line bg-cream-dark p-6 text-center"
              >
                <p className="text-[13px] text-charcoal-mid mb-3">{error}</p>
                <button
                  onClick={() => void loadSlots()}
                  className="text-[12px] text-bronze hover:text-charcoal underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}
            {!loading && !error && slots.length === 0 && (
              <div className="py-8 text-center border-2 border-dashed border-warm-line">
                <p className="text-[13px] text-warm-gray">
                  No times are available on this date. Please choose another
                  day.
                </p>
              </div>
            )}
            {!loading &&
              !error &&
              groups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="text-[10px] tracking-[0.12em] uppercase text-warm-gray font-medium mb-2">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.slots.map((slot) => {
                      const selected = booking.startAt === slot.startAt
                      return (
                        <button
                          key={`${slot.startAt}-${slot.stylistId}`}
                          onClick={() => selectTime(slot)}
                          className={`py-2 text-[12px] font-medium border-2 transition-all duration-150 min-h-[44px] ${
                            selected
                              ? "border-charcoal bg-charcoal text-cream"
                              : "border-warm-line text-charcoal bg-cream hover:border-charcoal/40"
                          }`}
                        >
                          {slot.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {!booking.date && (
          <div className="py-8 text-center border-2 border-dashed border-warm-line">
            <svg
              className="w-8 h-8 text-warm-line mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.25}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-[13px] text-warm-gray">
              Select a date above to see available times.
            </p>
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-[120px]">
          <BookingSummary booking={booking} />
          <button
            onClick={onNext}
            disabled={!canContinue}
            className={`mt-4 w-full py-3.5 text-[13px] font-medium tracking-wide transition-all duration-200 ${
              canContinue
                ? "bg-charcoal text-cream hover:bg-bronze"
                : "bg-warm-line text-warm-gray cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-cream border-t border-warm-line p-4">
        {booking.date && booking.time && (
          <div className="text-[12px] text-warm-gray mb-2.5 flex gap-1.5">
            <span className="font-medium text-charcoal">
              {formatDateKey(booking.date, "short")}
            </span>
            <span>&middot;</span>
            <span>{booking.time}</span>
          </div>
        )}
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`w-full py-3.5 text-[13px] font-medium tracking-wide transition-all ${
            canContinue
              ? "bg-charcoal text-cream hover:bg-bronze"
              : "bg-warm-line text-warm-gray cursor-not-allowed"
          }`}
        >
          {canContinue ? "Continue to Details" : "Select a Date & Time"}
        </button>
      </div>
    </div>
  )
}
