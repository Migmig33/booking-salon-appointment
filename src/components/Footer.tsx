import type { Page } from "../App"
import {
  DEMO_NOTICE,
  SALON_BUSINESS_TYPE,
  SALON_EMAIL_DISPLAY,
  SALON_EMAIL_LINK,
  SALON_LOCATION,
  SALON_NAME,
} from "../config/salon"

interface Props {
  navigate: (p: Page) => void
  startBooking: () => void
}

export default function Footer({ navigate, startBooking }: Props) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <footer className="bg-charcoal text-cream/70">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <button onClick={() => navigate("home")} className="text-left mb-4">
              <span className="font-serif text-xl text-cream font-medium tracking-wide block">
                {SALON_NAME}
              </span>
              <span className="text-[10px] tracking-[0.18em] uppercase text-cream/50 mt-0.5 block">
                {SALON_LOCATION}
              </span>
            </button>
            <p className="text-sm leading-relaxed text-cream/60 max-w-[260px]">
              A fictional {SALON_BUSINESS_TYPE.toLowerCase()} experience built
              to demonstrate online salon booking in the Philippines.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-5 font-medium">
              Navigate
            </p>
            <ul className="space-y-3">
              {[
                { label: "Services", action: () => navigate("services") },
                { label: "Find Booking", action: () => navigate("find") },
                {
                  label: "Gallery",
                  action: () => {
                    navigate("home")
                    setTimeout(() => scrollTo("gallery"), 150)
                  },
                },
                {
                  label: "Reviews",
                  action: () => {
                    navigate("home")
                    setTimeout(() => scrollTo("reviews"), 150)
                  },
                },
                {
                  label: "About",
                  action: () => {
                    navigate("home")
                    setTimeout(() => scrollTo("about"), 150)
                  },
                },
                {
                  label: "Contact",
                  action: () => {
                    navigate("home")
                    setTimeout(() => scrollTo("contact"), 150)
                  },
                },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button
                    onClick={action}
                    className="text-sm text-cream/60 hover:text-cream transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={startBooking}
                  className="text-sm text-bronze-light hover:text-cream transition-colors font-medium"
                >
                  Book Appointment
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-cream/40 mb-5 font-medium">
              Visit Us
            </p>
            <address className="not-italic space-y-2">
              <p className="text-sm text-cream/70 leading-relaxed">
                {SALON_LOCATION}
                <br />
                No physical demo branch
              </p>
              <a
                href={SALON_EMAIL_LINK}
                className="text-sm text-cream/70 hover:text-cream transition-colors block"
              >
                {SALON_EMAIL_DISPLAY}
              </a>
            </address>
            <button
              onClick={startBooking}
              className="mt-6 border border-cream/20 text-cream/70 hover:border-bronze-light hover:text-cream text-sm px-5 py-2.5 transition-all duration-200 tracking-wide"
            >
              Book Appointment
            </button>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <p className="text-xs text-cream/30">
            &copy; {new Date().getFullYear()} {SALON_NAME}. Demonstration only.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              onClick={() => navigate("privacy")}
              className="text-xs text-cream/40 hover:text-cream transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate("terms")}
              className="text-xs text-cream/40 hover:text-cream transition-colors"
            >
              Booking Terms
            </button>
            <p className="text-xs text-cream/20">{DEMO_NOTICE}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
