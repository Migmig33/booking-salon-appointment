import { SALON_ADDRESS, SALON_NAME } from "../config/salon"
import type { Appointment } from "../types/booking"

function calendarTimestamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
}

export function googleCalendarUrl(appointment: Appointment) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${SALON_NAME} - ${appointment.service.name}`,
    dates: `${calendarTimestamp(appointment.startAt)}/${calendarTimestamp(appointment.endAt)}`,
    details: `Booking Reference: ${appointment.bookingReference}`,
    location: SALON_ADDRESS,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
