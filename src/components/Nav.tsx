import { useState } from "react"
import type { Page } from "../App"
import {
  SALON_EMAIL_DISPLAY,
  SALON_EMAIL_LINK,
  SALON_LOCATION,
  SALON_NAME,
} from "../config/salon"

interface Props {
  page: Page
  navigate: (p: Page) => void
  startBooking: () => void
  inBooking: boolean
}

export default function Nav({
  page,
  navigate,
  startBooking,
  inBooking,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    if (page !== "home") {
      navigate("home")
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      }, 150)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const isHome = page === "home"
  const isServices = page === "services"

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-warm-line">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex items-center justify-between h-[60px] lg:h-[72px]">
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            className="flex flex-col items-start leading-none group"
          >
            <span className="font-serif text-[17px] lg:text-[19px] font-medium text-charcoal tracking-wide group-hover:text-bronze transition-colors">
              {SALON_NAME}
            </span>
            <span className="text-[9px] font-sans text-warm-gray tracking-[0.18em] uppercase mt-0.5">
              {SALON_LOCATION}
            </span>
          </button>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-7">
            {[
              { label: "Home", action: () => navigate("home"), active: isHome },
              {
                label: "Services",
                action: () => navigate("services"),
                active: isServices,
              },
              {
                label: "Find Booking",
                action: () => navigate("find"),
                active: page === "find",
              },
              {
                label: "Gallery",
                action: () => scrollTo("gallery"),
                active: false,
              },
              {
                label: "Reviews",
                action: () => scrollTo("reviews"),
                active: false,
              },
              {
                label: "About",
                action: () => scrollTo("about"),
                active: false,
              },
              {
                label: "Contact",
                action: () => scrollTo("contact"),
                active: false,
              },
            ].map(({ label, action, active }) => (
              <button
                key={label}
                onClick={action}
                className={`text-[13px] font-medium tracking-wide transition-colors ${
                  active
                    ? "text-charcoal"
                    : "text-warm-gray hover:text-charcoal"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href={SALON_EMAIL_LINK}
              className="text-[13px] text-warm-gray hover:text-charcoal transition-colors tracking-wide"
            >
              {SALON_EMAIL_DISPLAY}
            </a>
            <button
              onClick={startBooking}
              className="bg-charcoal text-cream text-[13px] font-medium px-5 py-2.5 hover:bg-bronze transition-all duration-200 tracking-wide"
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile right */}
          <div className="flex lg:hidden items-center gap-2.5">
            {!inBooking && (
              <button
                onClick={startBooking}
                className="bg-bronze text-cream text-[12px] font-medium px-4 py-2 tracking-wide"
              >
                Book
              </button>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-charcoal"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-cream border-t border-warm-line px-5 pt-2 pb-5 flex flex-col">
          {[
            { label: "Home", action: () => navigate("home") },
            { label: "Services", action: () => navigate("services") },
            { label: "Find Booking", action: () => navigate("find") },
            { label: "Gallery", action: () => scrollTo("gallery") },
            { label: "Reviews", action: () => scrollTo("reviews") },
            { label: "About", action: () => scrollTo("about") },
            { label: "Contact", action: () => scrollTo("contact") },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={() => {
                action()
                setMobileOpen(false)
              }}
              className="text-left text-base text-charcoal py-3 border-b border-warm-line last:border-0"
            >
              {label}
            </button>
          ))}
          <a
            href={SALON_EMAIL_LINK}
            className="text-base text-bronze py-3 mt-1"
          >
            {SALON_EMAIL_DISPLAY}
          </a>
          <button
            onClick={() => {
              startBooking()
              setMobileOpen(false)
            }}
            className="bg-charcoal text-cream text-base font-medium py-3.5 mt-3 tracking-wide"
          >
            Book Appointment
          </button>
        </div>
      )}
    </header>
  )
}
