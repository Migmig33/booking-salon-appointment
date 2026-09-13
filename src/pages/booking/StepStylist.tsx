import { useEffect, useState } from "react"
import type { BookingData } from "../../App"
import type { Stylist, StylistChoice } from "../../types/booking"
import { BookingApiError, listStylists } from "../../lib/bookingApi"
import BookingSummary from "./BookingSummary"

interface Props {
  booking: BookingData
  setBooking: (booking: BookingData) => void
  onNext: () => void
  onBack: () => void
}

export default function StepStylist({ booking, setBooking, onNext, onBack }: Props) {
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    if (!booking.service) return
    setLoading(true)
    setError("")
    try {
      setStylists(await listStylists(booking.service.id))
    } catch (caught) {
      setError(caught instanceof BookingApiError ? caught.message : "Unable to load stylists. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [booking.service?.id])

  const select = (stylist: StylistChoice) => {
    setBooking({ ...booking, stylist, date: null, time: null, startAt: null })
  }

  const rows: Array<{
    key: string
    choice: StylistChoice
    name: string
    subtitle: string
    description: string
    imageUrl: string | null
    recommended: boolean
  }> = [
    {
      key: "any",
      choice: "any",
      name: "Any Available Stylist",
      subtitle: "Show me the earliest available appointment.",
      description: "Get the soonest available time with any compatible active stylist. Recommended for flexible scheduling.",
      imageUrl: null,
      recommended: true,
    },
    ...stylists.map((stylist) => ({
      key: stylist.id,
      choice: stylist,
      name: stylist.name,
      subtitle: "Choose this stylist for your appointment.",
      description: stylist.bio,
      imageUrl: stylist.imageUrl,
      recommended: false,
    })),
  ]

  const isSelected = (choice: StylistChoice) =>
    choice === "any"
      ? booking.stylist === "any"
      : choice && booking.stylist !== "any" && booking.stylist?.id === choice.id

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 lg:gap-10">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-warm-gray hover:text-charcoal transition-colors mb-6">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="font-serif text-[28px] lg:text-[34px] text-charcoal mb-1">Who would you like to see?</h1>
        <p className="text-[14px] text-warm-gray mb-8">Choose a stylist or let us find you the earliest available time.</p>

        {loading && (
          <div className="space-y-4 max-w-2xl" aria-label="Loading stylists">
            <div className="h-28 bg-cream-dark border-2 border-warm-line animate-pulse" />
            <div className="h-28 bg-cream-dark border-2 border-warm-line animate-pulse" />
          </div>
        )}
        {!loading && error && (
          <div role="alert" className="border border-warm-line bg-cream-dark p-6 text-center max-w-2xl">
            <p className="text-[13px] text-charcoal-mid mb-3">{error}</p>
            <button onClick={() => void load()} className="text-[12px] text-bronze hover:text-charcoal underline underline-offset-2">Try again</button>
          </div>
        )}
        {!loading && !error && (
          <div className="space-y-4 max-w-2xl">
            {rows.map((stylist) => {
              const selected = isSelected(stylist.choice)
              return (
                <button
                  key={stylist.key}
                  onClick={() => select(stylist.choice)}
                  className={`w-full text-left p-5 lg:p-6 border-2 transition-all duration-150 group ${
                    selected ? "border-charcoal bg-charcoal/[0.03]" : "border-warm-line bg-cream hover:border-charcoal/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 bg-taupe overflow-hidden flex items-center justify-center">
                      {stylist.imageUrl ? (
                        <img src={stylist.imageUrl} alt={stylist.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <svg className="w-7 h-7 text-warm-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="text-[15px] lg:text-[16px] font-medium text-charcoal">{stylist.name}</h3>
                        {stylist.recommended && <span className="text-[10px] tracking-wide bg-bronze/10 text-bronze px-2 py-0.5 font-medium">Recommended</span>}
                      </div>
                      <p className="text-[12px] text-warm-gray mb-2">{stylist.subtitle}</p>
                      <p className="text-[12px] text-charcoal-mid leading-relaxed">{stylist.description}</p>
                    </div>
                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      selected ? "border-charcoal bg-charcoal" : "border-warm-line group-hover:border-charcoal/40"
                    }`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-cream" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <p className="text-[11px] text-warm-gray mt-6 italic">Only active stylists who perform your selected service are shown.</p>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-[120px]">
          <BookingSummary booking={booking} />
          <button onClick={onNext} disabled={!booking.stylist} className={`mt-4 w-full py-3.5 text-[13px] font-medium tracking-wide transition-all duration-200 ${
            booking.stylist ? "bg-charcoal text-cream hover:bg-bronze" : "bg-warm-line text-warm-gray cursor-not-allowed"
          }`}>Continue</button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-cream border-t border-warm-line p-4">
        <button onClick={onNext} disabled={!booking.stylist} className={`w-full py-3.5 text-[13px] font-medium tracking-wide transition-all ${
          booking.stylist ? "bg-charcoal text-cream hover:bg-bronze" : "bg-warm-line text-warm-gray cursor-not-allowed"
        }`}>{booking.stylist ? "Continue to Date & Time" : "Select a Stylist to Continue"}</button>
      </div>
    </div>
  )
}
