import { supabase } from "./supabase"
import { durationLabel, formatAppointmentTime, salonHour } from "./time"
import type {
  Addon,
  Appointment,
  AvailabilitySlot,
  BookingConfirmation,
  BookingData,
  Service,
  Stylist,
} from "../types/booking"

export type BookingErrorCode = "NOT_CONFIGURED" | "LOAD_FAILED" | "SLOT_TAKEN" | "INVALID_LINK" | "ALREADY_CANCELLED" | "VALIDATION_FAILED" | "RATE_LIMITED" | "NETWORK_ERROR" | "BOOKING_FAILED" | "RESCHEDULE_FAILED"

export class BookingApiError extends Error {
  constructor(
    public code: BookingErrorCode,
    message: string,
  ) {
    super(message)
  }
}

function client() {
  if (!supabase) {
    throw new BookingApiError(
      "NOT_CONFIGURED",
      "Online booking is being connected. Please call the salon for assistance.",
    )
  }
  return supabase
}

async function wakeEmailWorker() {
  try {
    const { error } = await client().functions.invoke("booking-email-worker", {
      body: { source: "customer-booking-action" },
    })
    if (error) throw error
  } catch {
    // The database outbox is authoritative. A scheduled worker will retry, so
    // notification delivery never changes whether the appointment succeeded.
    console.warn("The appointment email remains queued for retry.")
  }
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function apiError(error: unknown, fallback: BookingErrorCode): BookingApiError {
  if (error instanceof BookingApiError) return error
  const raw = messageFromError(error)
  const normalized = raw.toLowerCase()
  if (
    normalized.includes("fetch") ||
    normalized.includes("network") ||
    normalized.includes("failed to connect")
  ) {
    return new BookingApiError(
      "NETWORK_ERROR",
      "We couldn't connect. Please check your connection and try again.",
    )
  }
  if (raw.includes("SLOT_TAKEN")) {
    return new BookingApiError(
      "SLOT_TAKEN",
      "That time was just booked by someone else. Please choose another available time.",
    )
  }
  if (raw.includes("INVALID_MANAGEMENT_TOKEN")) {
    return new BookingApiError(
      "INVALID_LINK",
      "This appointment link is invalid or no longer available.",
    )
  }
  if (raw.includes("ALREADY_CANCELLED")) {
    return new BookingApiError(
      "ALREADY_CANCELLED",
      "This appointment has already been cancelled.",
    )
  }
  if (raw.includes("RATE_LIMITED")) {
    return new BookingApiError(
      "RATE_LIMITED",
      "Too many attempts. Please wait a few minutes and try again.",
    )
  }
  if (raw.includes("VALIDATION_FAILED")) {
    return new BookingApiError(
      "VALIDATION_FAILED",
      "Please check your information and try again.",
    )
  }
  const messages: Record<BookingErrorCode, string> = {
    NOT_CONFIGURED:
      "Online booking is being connected. Please call the salon for assistance.",
    LOAD_FAILED: "We couldn't load that information. Please try again.",
    SLOT_TAKEN:
      "That time was just booked by someone else. Please choose another available time.",
    INVALID_LINK: "This appointment link is invalid or no longer available.",
    ALREADY_CANCELLED: "This appointment has already been cancelled.",
    VALIDATION_FAILED: "Please check your information and try again.",
    RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
    NETWORK_ERROR:
      "We couldn't connect. Please check your connection and try again.",
    BOOKING_FAILED: "We couldn't complete your booking. Please try again.",
    RESCHEDULE_FAILED:
      "We couldn't reschedule your appointment. Your original time is still reserved.",
  }
  return new BookingApiError(fallback, messages[fallback])
}

function rowToService(row: Record<string, unknown>): Service {
  const durationMinutes = Number(row.duration_minutes)
  const priceDisplay = String(row.price_display ?? "Price confirmed by salon")
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category),
    description: String(row.description ?? ""),
    durationMinutes,
    duration: durationLabel(durationMinutes, "~"),
    priceDisplay,
    price: priceDisplay,
  }
}

function rowToAddon(row: Record<string, unknown>): Addon {
  const durationMinutes = Number(row.duration_minutes)
  const priceDisplay = String(row.price_display ?? "Price confirmed by salon")
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    durationMinutes,
    duration: durationLabel(durationMinutes, "+"),
    priceDisplay,
    price: priceDisplay,
  }
}

function rowToStylist(row: Record<string, unknown>): Stylist {
  return {
    id: String(row.id),
    name: String(row.name),
    bio: String(row.bio ?? ""),
    imageUrl: row.image_url ? String(row.image_url) : null,
  }
}

function objectToAppointment(value: Record<string, any>): Appointment {
  return {
    bookingReference: value.booking_reference,
    service: rowToService(value.service),
    addons: (value.addons ?? []).map(rowToAddon),
    stylist: rowToStylist(value.stylist),
    startAt: value.start_at,
    endAt: value.end_at,
    status: value.status,
    customer: {
      firstName: value.customer.first_name,
      lastName: value.customer.last_name,
      phone: value.customer.phone,
      email: value.customer.email,
      notes: value.customer.notes ?? "",
    },
    durationMinutes: Number(value.duration_minutes),
  }
}

export async function listServices() {
  try {
    const { data, error } = await client().rpc("booking_list_services")
    if (error) throw error
    return ((data ?? []) as Record<string, unknown>[]).map(rowToService)
  } catch (error) {
    throw apiError(error, "LOAD_FAILED")
  }
}

export async function listAddons(serviceId: string) {
  try {
    const { data, error } = await client().rpc("booking_list_addons", {
      p_service_id: serviceId,
    })
    if (error) throw error
    return ((data ?? []) as Record<string, unknown>[]).map(rowToAddon)
  } catch (error) {
    throw apiError(error, "LOAD_FAILED")
  }
}

export async function listStylists(serviceId: string) {
  try {
    const { data, error } = await client().rpc("booking_list_stylists", {
      p_service_id: serviceId,
    })
    if (error) throw error
    return ((data ?? []) as Record<string, unknown>[]).map(rowToStylist)
  } catch (error) {
    throw apiError(error, "LOAD_FAILED")
  }
}

export async function listAvailability(
  serviceId: string,
  addonIds: string[],
  stylistId: string | null,
  date: string,
) {
  try {
    const { data, error } = await client().rpc("booking_available_slots", {
      p_service_id: serviceId,
      p_addon_ids: addonIds,
      p_stylist_id: stylistId,
      p_date: date,
    })
    if (error) throw error
    return ((data ?? []) as Record<string, unknown>[]).map(
      (row): AvailabilitySlot => ({
        startAt: String(row.start_at),
        endAt: String(row.end_at),
        stylistId: String(row.stylist_id),
        stylistName: String(row.stylist_name),
        label: formatAppointmentTime(String(row.start_at)),
        hour: salonHour(String(row.start_at)),
      }),
    )
  } catch (error) {
    throw apiError(error, "LOAD_FAILED")
  }
}

export async function createBooking(
  booking: BookingData,
): Promise<BookingConfirmation> {
  if (!booking.service || !booking.startAt || !booking.stylist) {
    throw new BookingApiError(
      "VALIDATION_FAILED",
      "Please complete every booking step.",
    )
  }
  try {
    const { data, error } = await client().rpc("booking_create_appointment", {
      p_service_id: booking.service.id,
      p_addon_ids: booking.addons.map((addon) => addon.id),
      p_stylist_id: booking.stylist === "any" ? null : booking.stylist.id,
      p_start_at: booking.startAt,
      p_first_name: booking.customer.firstName,
      p_last_name: booking.customer.lastName,
      p_phone: booking.customer.phone,
      p_email: booking.customer.email,
      p_customer_notes: booking.customer.notes || null,
    })
    if (error) throw error
    const result = data as Record<string, any>
    const confirmation = {
      appointment: objectToAppointment(result.appointment),
      managementToken: result.management_token,
    }
    void wakeEmailWorker()
    return confirmation
  } catch (error) {
    throw apiError(error, "BOOKING_FAILED")
  }
}

export async function getAppointment(token: string) {
  try {
    const { data, error } = await client().rpc("booking_get_appointment", {
      p_token: token,
    })
    if (error || !data) throw error ?? new Error("INVALID_MANAGEMENT_TOKEN")
    return objectToAppointment(data as Record<string, any>)
  } catch (error) {
    throw apiError(error, "INVALID_LINK")
  }
}

export async function listRescheduleAvailability(token: string, date: string) {
  try {
    const { data, error } = await client().rpc("booking_reschedule_slots", {
      p_token: token,
      p_date: date,
    })
    if (error) throw error
    return ((data ?? []) as Record<string, unknown>[]).map(
      (row): AvailabilitySlot => ({
        startAt: String(row.start_at),
        endAt: String(row.end_at),
        stylistId: String(row.stylist_id),
        stylistName: String(row.stylist_name),
        label: formatAppointmentTime(String(row.start_at)),
        hour: salonHour(String(row.start_at)),
      }),
    )
  } catch (error) {
    throw apiError(error, "LOAD_FAILED")
  }
}

export async function rescheduleAppointment(token: string, startAt: string) {
  try {
    const { data, error } = await client().rpc(
      "booking_reschedule_appointment",
      {
        p_token: token,
        p_start_at: startAt,
      },
    )
    if (error) throw error
    const appointment = objectToAppointment(data as Record<string, any>)
    void wakeEmailWorker()
    return appointment
  } catch (error) {
    throw apiError(error, "RESCHEDULE_FAILED")
  }
}

export async function cancelAppointment(token: string) {
  try {
    const { data, error } = await client().rpc("booking_cancel_appointment", {
      p_token: token,
    })
    if (error) throw error
    const appointment = objectToAppointment(data as Record<string, any>)
    void wakeEmailWorker()
    return appointment
  } catch (error) {
    throw apiError(error, "BOOKING_FAILED")
  }
}

export async function findBooking(reference: string, contact: string) {
  try {
    const { data, error } = await client().rpc("booking_find_appointment", {
      p_booking_reference: reference,
      p_contact: contact,
    })
    if (error) throw error
    const token = (data as { management_token?: string } | null)
      ?.management_token
    if (!token) throw new Error("INVALID_MANAGEMENT_TOKEN")
    return token
  } catch (error) {
    if (error instanceof BookingApiError && error.code === "RATE_LIMITED")
      throw error
    const parsed = apiError(error, "INVALID_LINK")
    if (
      parsed.code === "RATE_LIMITED" ||
      parsed.code === "NETWORK_ERROR" ||
      parsed.code === "NOT_CONFIGURED"
    )
      throw parsed
    throw new BookingApiError(
      "INVALID_LINK",
      "We couldn't verify that booking. Please check your information and try again.",
    )
  }
}
