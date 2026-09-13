import type { BookingData } from '../../App'
import BookingSummary from './BookingSummary'

interface Props {
  booking: BookingData
  setBooking: (b: BookingData) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDetails({ booking, setBooking, onNext, onBack }: Props) {
  const c = booking.customer

  const update = (field: keyof BookingData['customer'], value: string | boolean) => {
    setBooking({
      ...booking,
      customer: { ...booking.customer, [field]: value },
    })
  }

  const canContinue =
    c.firstName.trim().length > 0 &&
    c.lastName.trim().length > 0 &&
    c.phone.replace(/\D/g, '').length >= 7 &&
    c.email.trim().length > 0 &&
    c.email.includes('@')

  const inputClass =
    'w-full border border-warm-line bg-cream px-4 py-3 text-[14px] text-charcoal placeholder:text-warm-gray focus:outline-none focus:border-charcoal transition-colors min-h-[48px]'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 lg:gap-10">

      {/* Main content */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-warm-gray hover:text-charcoal transition-colors mb-6"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="font-serif text-[28px] lg:text-[34px] text-charcoal mb-1">Almost Done</h1>
        <p className="text-[14px] text-warm-gray mb-8">Tell us how we can reach you.</p>

        <div className="max-w-lg space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1.5">
                First Name <span className="text-bronze">*</span>
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="Jane"
                value={c.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                autoComplete="given-name"
                maxLength={80}
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1.5">
                Last Name <span className="text-bronze">*</span>
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="Smith"
                value={c.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                autoComplete="family-name"
                maxLength={80}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1.5">
              Phone Number <span className="text-bronze">*</span>
            </label>
            <input
              type="tel"
              className={inputClass}
              placeholder="(555) 000-0000"
              value={c.phone}
              onChange={(e) => update('phone', e.target.value)}
              autoComplete="tel"
              maxLength={40}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1.5">
              Email Address <span className="text-bronze">*</span>
            </label>
            <input
              type="email"
              className={inputClass}
              placeholder="jane@example.com"
              value={c.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="email"
              maxLength={254}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] tracking-[0.12em] uppercase text-charcoal font-medium mb-1.5">
              Notes{' '}
              <span className="text-warm-gray font-normal lowercase tracking-normal">(optional)</span>
            </label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-none`}
              placeholder="Anything you'd like your stylist to know?"
              value={c.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className={`shrink-0 w-5 h-5 border-2 flex items-center justify-center mt-0.5 transition-all ${
                c.updates
                  ? 'border-charcoal bg-charcoal'
                  : 'border-warm-line group-hover:border-charcoal/40'
              }`}
              onClick={() => update('updates', !c.updates)}
            >
              {c.updates && (
                <svg className="w-3 h-3 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <span className="text-[13px] text-charcoal-mid leading-relaxed">
                Send me appointment-related updates.
              </span>
              <p className="text-[11px] text-warm-gray mt-0.5">
                You can unsubscribe at any time. This does not include marketing messages.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-[120px]">
          <BookingSummary booking={booking} />
          <button
            onClick={onNext}
            disabled={!canContinue}
            className={`mt-4 w-full py-3.5 text-[13px] font-medium tracking-wide transition-all duration-200 ${
              canContinue
                ? 'bg-charcoal text-cream hover:bg-bronze'
                : 'bg-warm-line text-warm-gray cursor-not-allowed'
            }`}
          >
            Review Appointment
          </button>
        </div>
      </div>

      {/* Mobile sticky bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-cream border-t border-warm-line p-4">
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`w-full py-3.5 text-[13px] font-medium tracking-wide transition-all ${
            canContinue
              ? 'bg-charcoal text-cream hover:bg-bronze'
              : 'bg-warm-line text-warm-gray cursor-not-allowed'
          }`}
        >
          {canContinue ? 'Review Appointment' : 'Fill in Your Details'}
        </button>
      </div>
    </div>
  )
}
