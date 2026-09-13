import { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import type { Page } from '../App'
import type { Service } from "../types/booking"
import { BookingApiError, listServices } from "../lib/bookingApi"
import { SERVICE_CATEGORIES, SERVICE_GROUPS } from "../config/servicePresentation"

interface Props {
  navigate: (p: Page) => void
  startBooking: () => void
}

export default function ServicesPage({ navigate, startBooking }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  // When a category is selected, find which groups have visible services
  const visibleGroups = SERVICE_GROUPS.map((group) => ({
    ...group,
    services: services.filter(
      (service) => (group.categories as readonly string[]).includes(service.category) && (activeCategory === 'all' || service.category === activeCategory),
    ),
  })).filter((g) => g.services.length > 0)

  return (
    <main className="pb-20 lg:pb-0">

      {/* Page header */}
      <section className="py-16 lg:py-20 bg-cream border-b border-warm-line">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">TJ Hair Salon</span>
          <h1 className="font-serif text-[40px] lg:text-[52px] text-charcoal mt-3 mb-4">Services</h1>
          <p className="text-[15px] text-charcoal-mid max-w-lg leading-relaxed">
            Find the right service for your next look.
          </p>
        </div>
      </section>

      {/* Category filters */}
      <section className="sticky top-[60px] lg:top-[72px] z-30 bg-cream border-b border-warm-line">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex items-center gap-1.5 py-3 overflow-x-auto scrollbar-hide">
            {SERVICE_CATEGORIES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`shrink-0 text-[12px] font-medium tracking-wide px-4 py-1.5 border transition-all duration-150 ${
                  activeCategory === id
                    ? 'bg-charcoal text-cream border-charcoal'
                    : 'border-warm-line text-warm-gray hover:border-charcoal hover:text-charcoal'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services listing */}
      <section className="py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 space-y-14 lg:space-y-20">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Loading services">
              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-64 bg-cream-dark animate-pulse" />)}
            </div>
          )}
          {!loading && error && (
            <div role="alert" className="bg-cream-dark p-8 text-center">
              <p className="text-[14px] text-charcoal-mid mb-4">{error}</p>
              <button onClick={() => void load()} className="text-[12px] text-bronze hover:text-charcoal underline underline-offset-2">Try again</button>
            </div>
          )}
          {!loading && !error && visibleGroups.map((group) => (
            <div key={group.title}>
              <div className="flex items-center gap-4 mb-7 lg:mb-8">
                <h2 className="font-serif text-[24px] lg:text-[28px] text-charcoal">{group.title}</h2>
                <div className="flex-1 h-px bg-warm-line" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-cream-dark p-6 flex flex-col gap-4 group hover:bg-taupe transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <h3 className="font-serif text-[17px] text-charcoal mb-2">{service.name}</h3>
                      <p className="text-[12px] text-warm-gray leading-relaxed">{service.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-warm-gray border-t border-warm-line pt-4">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-bronze" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.duration}
                      </span>
                    </div>

                    <div className="text-[11px] text-warm-gray italic">{service.price}</div>

                    <button
                      onClick={startBooking}
                      className="w-full bg-charcoal text-cream text-[12px] font-medium py-2.5 hover:bg-bronze transition-all duration-200 tracking-wide"
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loading && !error && visibleGroups.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-warm-gray text-[15px]">No services found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16 lg:py-20 bg-charcoal text-center">
        <div className="max-w-xl mx-auto px-5">
          <h2 className="font-serif text-[28px] lg:text-[34px] text-cream mb-4">
            Not sure which service is right for you?
          </h2>
          <p className="text-[14px] text-cream/65 leading-relaxed mb-8">
            Book a consultation or give us a call — we can help you find the best option for your hair.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={startBooking}
              className="bg-bronze text-cream text-[13px] font-medium px-7 py-3 hover:bg-bronze-light transition-all duration-200 tracking-wide"
            >
              Book Appointment
            </button>
            <a
              href="tel:7088089910"
              className="border border-cream/25 text-cream text-[13px] font-medium px-7 py-3 hover:border-cream/50 transition-all duration-200 tracking-wide text-center"
            >
              Call (708) 808-9910
            </a>
          </div>
        </div>
      </section>

      <Footer navigate={navigate} startBooking={startBooking} />
    </main>
  )
}
