import { SALON_LOCALE, SALON_TIME_ZONE } from "../config/salon"

const dateFormatter = new Intl.DateTimeFormat(SALON_LOCALE, {
  timeZone: SALON_TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
})

const shortDateFormatter = new Intl.DateTimeFormat(SALON_LOCALE, {
  timeZone: SALON_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat(SALON_LOCALE, {
  timeZone: SALON_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
})

const hourFormatter = new Intl.DateTimeFormat(SALON_LOCALE, {
  timeZone: SALON_TIME_ZONE,
  hour: "numeric",
  hourCycle: "h23",
})

export function formatAppointmentDate(value: string) {
  return dateFormatter.format(new Date(value))
}

export function formatAppointmentDateShort(value: string) {
  return shortDateFormatter.format(new Date(value))
}

export function formatAppointmentTime(value: string) {
  return timeFormatter.format(new Date(value))
}

export function salonHour(value: string) {
  return Number(hourFormatter.format(new Date(value)))
}

export function salonDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value))
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function durationLabel(minutes: number, prefix = "") {
  if (minutes < 60) return `${prefix}${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder
    ? `${prefix}${hours} hr ${remainder} min`
    : `${prefix}${hours} ${hours === 1 ? "hr" : "hrs"}`
}

export function getUpcomingSalonDates(count = 14) {
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const part = (type: string) =>
    Number(todayParts.find((item) => item.type === type)?.value)
  const cursor = new Date(
    Date.UTC(part("year"), part("month") - 1, part("day")),
  )

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(cursor)
    date.setUTCDate(cursor.getUTCDate() + index + 1)
    return date.toISOString().slice(0, 10)
  })
}

export function formatDateKey(
  dateKey: string,
  style: "long" | "short" = "long",
) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  return new Intl.DateTimeFormat(SALON_LOCALE, {
    timeZone: "UTC",
    weekday: style === "long" ? "long" : "short",
    month: style === "long" ? "long" : "short",
    day: "numeric",
  }).format(date)
}

export function dateKeyParts(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  return {
    weekday: new Intl.DateTimeFormat(SALON_LOCALE, {
      timeZone: "UTC",
      weekday: "short",
    }).format(date),
    day: date.getUTCDate(),
    month: new Intl.DateTimeFormat(SALON_LOCALE, {
      timeZone: "UTC",
      month: "short",
    }).format(date),
  }
}
