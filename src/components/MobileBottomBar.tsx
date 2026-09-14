import { SALON_DIRECTIONS_URL, SALON_EMAIL_LINK } from "../config/salon"

interface Props {
  startBooking: () => void
}

export default function MobileBottomBar({ startBooking }: Props) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-cream border-t border-warm-line flex safe-bottom">
      <a
        href={SALON_EMAIL_LINK}
        className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-charcoal-mid hover:text-bronze transition-colors"
      >
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
            d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span className="text-[10px] tracking-wide font-medium">Email</span>
      </a>

      <a
        href={SALON_DIRECTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-charcoal-mid hover:text-bronze transition-colors"
      >
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
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-[10px] tracking-wide font-medium">Location</span>
      </a>

      <button
        onClick={startBooking}
        className="flex-[1.5] flex flex-col items-center justify-center py-3 gap-0.5 bg-charcoal text-cream hover:bg-bronze transition-colors"
      >
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-[10px] tracking-wide font-semibold">Book</span>
      </button>
    </div>
  )
}
