import { SALON_TIME_ZONE } from "../config/salon"

export function adminDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value)
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function startOfWeek(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  const day = date.getUTCDay()
  return shiftDateKey(dateKey, day === 0 ? -6 : 1 - day)
}

export function monthBounds(dateKey: string) {
  const [year, month] = dateKey.split("-").map(Number)
  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const next = new Date(Date.UTC(year, month, 1, 12))
  return { start, end: next.toISOString().slice(0, 10) }
}

export function dateRangeUtc(startDate: string, endDateExclusive: string) {
  // Noon probes make the New York UTC offset deterministic on DST boundaries.
  const zoned = (dateKey: string) => {
    const noonUtc = new Date(`${dateKey}T12:00:00Z`)
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: SALON_TIME_ZONE,
      timeZoneName: "longOffset",
    }).formatToParts(noonUtc)
    const offset = parts.find((part) => part.type === "timeZoneName")?.value
    const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/)
    const minutes = match
      ? (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3]))
      : -300
    return new Date(
      new Date(`${dateKey}T00:00:00Z`).getTime() - minutes * 60000,
    ).toISOString()
  }
  return { start: zoned(startDate), end: zoned(endDateExclusive) }
}

export function localInputToUtc(value: string) {
  if (!value) return ""
  const [dateKey, time] = value.split("T")
  const [hour, minute] = time.split(":").map(Number)
  const midnight = dateRangeUtc(dateKey, shiftDateKey(dateKey, 1)).start
  return new Date(
    new Date(midnight).getTime() + (hour * 60 + minute) * 60000,
  ).toISOString()
}

export function formatAdminDate(value: string, withYear = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" as const } : {}),
  }).format(new Date(value))
}

export function formatAdminTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatDateKeyLabel(
  dateKey: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(`${dateKey}T12:00:00Z`))
}

export function minutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}
