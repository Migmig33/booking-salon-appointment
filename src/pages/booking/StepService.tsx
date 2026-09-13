import { useEffect, useState } from "react"
import type { BookingData } from "../../App"
import type { Addon, Service } from "../../types/booking"
import { BookingApiError, listAddons, listServices } from "../../lib/bookingApi"
import { SERVICE_CATEGORIES } from "../../config/servicePresentation"
import BookingSummary from "./BookingSummary"

interface Props {
  booking: BookingData
  setBooking: (booking: BookingData) => void
  onNext: () => void
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="border border-warm-line bg-cream-dark p-6 text-center">
      <p className="text-[13px] text-charcoal-mid mb-3">{message}</p>
      <button onClick={retry} className="text-[12px] text-bronze hover:text-charcoal underline underline-offset-2">
        Try again
      </button>
    </div>
  )
}

export default function StepService({ booking, setBooking, onNext }: Props) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [services, setServices] = useState<Service[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [loading, setLoading] = useState(true)
  const [addonsLoading, setAddonsLoading] = useState(false)
  const [error, setError] = useState("")
  const [addonsError, setAddonsError] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      setServices(await listServices())
    } catch (caught) {
      setError(caught instanceof BookingApiError ? caught.message : "Unable to load services. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!booking.service) {
      setAddons([])
      return
    }
    let active = true
    setAddonsLoading(true)
    setAddonsError("")
    listAddons(booking.service.id)
      .then((result) => active && setAddons(result))
      .catch((caught) => {
        if (active) setAddonsError(caught instanceof BookingApiError ? caught.message : "Unable to load add-ons.")
      })
      .finally(() => active && setAddonsLoading(false))
    return () => {
      active = false
    }
  }, [booking.service?.id])

  const retryAddons = async () => {
    if (!booking.service) return
    setAddonsLoading(true)
    setAddonsError("")
    try {
      setAddons(await listAddons(booking.service.id))
    } catch (caught) {
      setAddonsError(caught instanceof BookingApiError ? caught.message : "Unable to load add-ons.")
    } finally {
      setAddonsLoading(false)
    }
  }

  const filteredServices =
    activeCategory === "all" ? services : services.filter((service) => service.category === activeCategory)

  const selectService = (service: Service) => {
    setBooking({
      ...booking,
      service,
      addons: [],
      stylist: null,
      date: null,
      time: null,
      startAt: null,
    })
  }

  const toggleAddon = (addon: Addon) => {
    const selected = booking.addons.some((item) => item.id === addon.id)
    setBooking({
      ...booking,
      addons: selected
        ? booking.addons.filter((item) => item.id !== addon.id)
        : [...booking.addons, addon],
      date: null,
      time: null,
      startAt: null,
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 lg:gap-10">
      <div>
        <h1 className="font-serif text-[28px] lg:text-[34px] text-charcoal mb-1">What would you like to book?</h1>
        <p className="text-[14px] text-warm-gray mb-7">Select a service to get started.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {SERVICE_CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`text-[11px] font-medium tracking-wide px-4 py-1.5 border transition-all duration-150 ${
                activeCategory === id
                  ? "bg-charcoal text-cream border-charcoal"
                  : "border-warm-line text-warm-gray hover:border-charcoal hover:text-charcoal"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10" aria-label="Loading services">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-36 bg-cream-dark animate-pulse border-2 border-warm-line" />
            ))}
          </div>
        )}
        {!loading && error && <ErrorState message={error} retry={() => void load()} />}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
            {filteredServices.map((service) => {
              const selected = booking.service?.id === service.id
              return (
                <button
                  key={service.id}
                  onClick={() => selectService(service)}
                  className={`text-left p-5 border-2 transition-all duration-150 group ${
                    selected ? "border-charcoal bg-charcoal/[0.03]" : "border-warm-line bg-cream hover:border-charcoal/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-medium text-charcoal mb-1">{service.name}</h3>
                      <p className="text-[12px] text-warm-gray leading-relaxed">{service.description}</p>
                    </div>
                    <div className={`shrink-0 w-5 h-5 border-2 flex items-center justify-center transition-all mt-0.5 ${
                      selected ? "border-charcoal bg-charcoal" : "border-warm-line group-hover:border-charcoal/40"
                    }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-warm-line">
                    <span className="text-[11px] text-warm-gray flex items-center gap-1">
                      <svg className="w-3 h-3 text-bronze" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration}
                    </span>
                    <span className="text-[11px] text-warm-gray italic">{service.priceDisplay}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {booking.service && (
          <div>
            <h2 className="text-[17px] font-medium text-charcoal">Enhance Your Appointment</h2>
            <p className="text-[12px] text-warm-gray mt-0.5 mb-5">Optional add-ons to complement your service.</p>
            {addonsLoading && <div className="h-24 bg-cream-dark animate-pulse" aria-label="Loading add-ons" />}
            {addonsError && <ErrorState message={addonsError} retry={() => void retryAddons()} />}
            {!addonsLoading && !addonsError && addons.length === 0 && (
              <p className="text-[12px] text-warm-gray italic">No add-ons are available for this service.</p>
            )}
            {!addonsLoading && !addonsError && addons.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {addons.map((addon) => {
                  const selected = booking.addons.some((item) => item.id === addon.id)
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`text-left p-4 border-2 transition-all duration-150 group ${
                        selected ? "border-bronze bg-bronze/[0.04]" : "border-warm-line bg-cream hover:border-bronze/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[13px] font-medium text-charcoal">{addon.name}</h3>
                        <div className={`shrink-0 w-4 h-4 border-2 flex items-center justify-center ${
                          selected ? "border-bronze bg-bronze" : "border-warm-line"
                        }`}>
                          {selected && (
                            <svg className="w-2.5 h-2.5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-warm-gray leading-snug mb-2">{addon.description}</p>
                      <div className="flex gap-2 text-[10px] text-warm-gray">
                        <span>{addon.duration}</span><span>&middot;</span><span className="italic">{addon.priceDisplay}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-[120px]">
          <BookingSummary booking={booking} />
          <button
            onClick={onNext}
            disabled={!booking.service}
            className={`mt-4 w-full py-3.5 text-[13px] font-medium tracking-wide transition-all duration-200 ${
              booking.service ? "bg-charcoal text-cream hover:bg-bronze" : "bg-warm-line text-warm-gray cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-cream border-t border-warm-line p-4">
        <div className="flex items-center gap-3">
          {booking.service && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-charcoal truncate">{booking.service.name}</p>
              {booking.addons.length > 0 && <p className="text-[11px] text-warm-gray">+ {booking.addons.length} add-on{booking.addons.length > 1 ? "s" : ""}</p>}
            </div>
          )}
          <button
            onClick={onNext}
            disabled={!booking.service}
            className={`shrink-0 px-6 py-3 text-[13px] font-medium tracking-wide transition-all ${
              booking.service ? "bg-charcoal text-cream hover:bg-bronze" : "bg-warm-line text-warm-gray cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
