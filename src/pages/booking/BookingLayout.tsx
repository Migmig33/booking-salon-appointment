import { useState } from "react"
import type { BookingData, BookingStep, Page } from "../../App"
import type { Appointment } from "../../types/booking"
import { BookingApiError, createBooking } from "../../lib/bookingApi"
import { formatAppointmentTime } from "../../lib/time"
import StepService from './StepService'
import StepStylist from './StepStylist'
import StepDateTime from './StepDateTime'
import StepDetails from './StepDetails'
import StepReview from './StepReview'
import StepConfirm from './StepConfirm'

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'service', label: 'Service' },
  { key: 'stylist', label: 'Stylist' },
  { key: 'datetime', label: 'Date & Time' },
  { key: 'details', label: 'Details' },
  { key: 'review', label: 'Review' },
]

const STEP_ORDER: BookingStep[] = ['service', 'stylist', 'datetime', 'details', 'review', 'confirm']

interface Props {
  step: BookingStep
  setStep: (s: BookingStep) => void
  booking: BookingData
  setBooking: (b: BookingData) => void
  appointment: Appointment | null
  setAppointment: (appointment: Appointment | null) => void
  managementToken: string
  setManagementToken: (token: string) => void
  navigate: (p: Page) => void
  openManagement: (token: string) => void
}

function stepIndex(s: BookingStep) {
  return STEP_ORDER.indexOf(s)
}

export default function BookingLayout({
  step,
  setStep,
  booking,
  setBooking,
  appointment,
  setAppointment,
  managementToken,
  setManagementToken,
  navigate,
  openManagement,
}: Props) {
  const currentIdx = stepIndex(step)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const goNext = () => {
    const next = STEP_ORDER[currentIdx + 1]
    if (next) {
      setStep(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const confirmBooking = async () => {
    setSubmitting(true)
    setSubmitError("")
    try {
      const result = await createBooking(booking)
      setAppointment(result.appointment)
      setManagementToken(result.managementToken)
      setBooking({
        ...booking,
        service: result.appointment.service,
        addons: result.appointment.addons,
        stylist: result.appointment.stylist,
        startAt: result.appointment.startAt,
        time: formatAppointmentTime(result.appointment.startAt),
      })
      setStep("confirm")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      setSubmitError(
        error instanceof BookingApiError
          ? error.message
          : "We couldn't complete your booking. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = () => {
    const prev = STEP_ORDER[currentIdx - 1]
    if (prev) {
      setStep(prev)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goToStep = (s: BookingStep) => {
    if (stepIndex(s) < currentIdx) {
      setStep(s)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const isConfirm = step === 'confirm'

  return (
    <div className="min-h-screen bg-cream">

      {/* Progress bar — hidden on confirm */}
      {!isConfirm && (
        <div className="border-b border-warm-line bg-cream">
          <div className="max-w-5xl mx-auto px-5 lg:px-8 py-4 lg:py-5">
            <div className="flex items-center gap-1 overflow-x-auto">
              {STEPS.map((s, i) => {
                const done = stepIndex(step) > i
                const active = step === s.key
                return (
                  <div key={s.key} className="flex items-center shrink-0">
                    <button
                      onClick={() => goToStep(s.key)}
                      disabled={!done}
                      className={`flex items-center gap-2 group ${done ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span
                        className={`w-6 h-6 flex items-center justify-center text-[11px] font-medium transition-all ${
                          done
                            ? 'bg-bronze text-cream'
                            : active
                            ? 'bg-charcoal text-cream'
                            : 'bg-warm-line text-warm-gray'
                        }`}
                      >
                        {done ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={`text-[12px] font-medium tracking-wide hidden sm:inline transition-colors ${
                          active ? 'text-charcoal' : done ? 'text-bronze group-hover:text-charcoal' : 'text-warm-gray'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`w-6 lg:w-10 h-px mx-2 shrink-0 ${done ? 'bg-bronze/40' : 'bg-warm-line'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className={isConfirm ? '' : 'max-w-5xl mx-auto px-5 lg:px-8 py-8 lg:py-12'}>
        {step === 'service' && (
          <StepService booking={booking} setBooking={setBooking} onNext={goNext} />
        )}
        {step === 'stylist' && (
          <StepStylist booking={booking} setBooking={setBooking} onNext={goNext} onBack={goBack} />
        )}
        {step === 'datetime' && (
          <StepDateTime booking={booking} setBooking={setBooking} onNext={goNext} onBack={goBack} />
        )}
        {step === 'details' && (
          <StepDetails booking={booking} setBooking={setBooking} onNext={goNext} onBack={goBack} />
        )}
        {step === 'review' && (
          <StepReview
            booking={booking}
            onConfirm={confirmBooking}
            onBack={goBack}
            onEdit={(s) => goToStep(s)}
            submitting={submitting}
            error={submitError}
          />
        )}
        {step === 'confirm' && appointment && managementToken && (
          <StepConfirm
            appointment={appointment}
            managementToken={managementToken}
            navigate={navigate}
            openManagement={openManagement}
          />
        )}
      </div>
    </div>
  )
}
