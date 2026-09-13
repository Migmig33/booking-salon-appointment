import type { BookingData } from '../../App'
import { durationLabel, formatDateKey } from "../../lib/time"

interface Props {
  booking: BookingData
  compact?: boolean
}

const Row = ({ label, value, empty }: { label: string; value?: string; empty?: boolean }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">{label}</span>
    <span className={`text-[13px] ${empty ? 'text-warm-gray italic' : 'text-charcoal font-medium'}`}>
      {value || 'Not selected yet'}
    </span>
  </div>
)

export default function BookingSummary({ booking, compact }: Props) {
  const stylistLabel =
    booking.stylist === 'any'
      ? 'Any Available'
      : booking.stylist
      ? booking.stylist.name
      : undefined

  return (
    <div className={compact ? '' : 'bg-cream-dark p-6 lg:p-7'}>
      {!compact && (
        <h3 className="font-serif text-[17px] text-charcoal mb-5">Your Appointment</h3>
      )}

      <div className="space-y-4">
        <Row
          label="Service"
          value={booking.service?.name}
          empty={!booking.service}
        />

        {booking.addons.length > 0 && (
          <Row
            label="Add-ons"
            value={booking.addons.map((a) => a.name).join(', ')}
          />
        )}

        <Row label="Stylist" value={stylistLabel} empty={!booking.stylist} />

        <Row
          label="Date"
          value={booking.date ? formatDateKey(booking.date) : undefined}
          empty={!booking.date}
        />

        <Row label="Time" value={booking.time ?? undefined} empty={!booking.time} />
      </div>

      {(booking.service || booking.addons.length > 0) && (
        <div className="mt-5 pt-4 border-t border-warm-line space-y-1.5">
          {booking.service && (
            <div className="flex justify-between text-[12px] text-warm-gray">
              <span>{booking.service.name}</span>
              <span>{durationLabel(booking.service.durationMinutes)}</span>
            </div>
          )}
          {booking.addons.map((a) => (
            <div key={a.id} className="flex justify-between text-[12px] text-warm-gray">
              <span>{a.name}</span>
              <span>{a.duration}</span>
            </div>
          ))}
          <div className="pt-2 flex justify-between text-[12px] text-bronze font-medium">
            <span>Pricing</span>
            <span>Confirmed by salon</span>
          </div>
        </div>
      )}
    </div>
  )
}
