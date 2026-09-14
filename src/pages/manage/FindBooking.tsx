import { useState } from "react"
import type { Page } from "../../App"
import { BookingApiError, findBooking } from "../../lib/bookingApi"
import { BOOKING_REFERENCE_EXAMPLE, SALON_NAME } from "../../config/salon"

interface Props {
  navigate: (page: Page) => void
  openManagement: (token: string) => void
}

export default function FindBooking({ navigate, openManagement }: Props) {
  const [reference, setReference] = useState("")
  const [contact, setContact] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!reference.trim() || !contact.trim()) return
    setLoading(true)
    setError("")
    try {
      const token = await findBooking(reference, contact)
      openManagement(token)
    } catch (caught) {
      setError(
        caught instanceof BookingApiError
          ? caught.message
          : "We couldn't verify that booking. Please check your information and try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full border border-warm-line bg-cream px-4 py-3 text-[14px] text-charcoal placeholder:text-warm-gray focus:outline-none focus:border-charcoal transition-colors min-h-[48px]"

  return (
    <main className="min-h-[calc(100vh-64px)] bg-cream">
      <div className="border-b border-warm-line">
        <div className="max-w-3xl mx-auto px-5 lg:px-8 py-4 lg:py-5">
          <button
            onClick={() => navigate("home")}
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
            {SALON_NAME}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-14 lg:py-20">
        <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
          Your Appointment
        </span>
        <h1 className="font-serif text-[34px] lg:text-[42px] text-charcoal mt-2 mb-3">
          Find My Booking
        </h1>
        <p className="text-[14px] text-charcoal-mid leading-relaxed mb-8">
          Enter your booking reference and the email address or phone number
          used when booking.
        </p>

        <form onSubmit={submit} className="bg-cream-dark p-6 lg:p-8 space-y-5">
          <div>
            <label className="block text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1.5">
              Booking Reference
            </label>
            <input
              className={inputClass}
              value={reference}
              onChange={(event) =>
                setReference(event.target.value.toUpperCase())
              }
              placeholder={BOOKING_REFERENCE_EXAMPLE}
              autoComplete="off"
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1.5">
              Email or Phone
            </label>
            <input
              className={inputClass}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Email address or phone number"
              autoComplete="email"
              maxLength={254}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="border border-bronze/30 bg-bronze/[0.05] px-4 py-3 text-[12px] text-charcoal-mid leading-relaxed"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !reference.trim() || !contact.trim()}
            className={`w-full py-3.5 text-[13px] font-medium tracking-wide transition-all ${
              !loading && reference.trim() && contact.trim()
                ? "bg-charcoal text-cream hover:bg-bronze"
                : "bg-warm-line text-warm-gray cursor-not-allowed"
            }`}
          >
            {loading ? "Verifying..." : "Find Appointment"}
          </button>
        </form>

        <p className="text-[12px] text-warm-gray text-center mt-6">
          Need help? Contact the salon and have your booking reference ready.
        </p>
      </div>
    </main>
  )
}
