import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import type {
  AdminAppointment,
  AdminAppointmentStatus,
  AdminNotification,
  AdminProfile,
  AdminSlot,
  AdminStylist,
  AvailabilityData,
  CustomerProfile,
  CustomerSummary,
  DashboardData,
  ReferenceData,
  SalonSettings,
} from "./types"

function client() {
  if (!supabase) throw new Error("Supabase is not configured.")
  return supabase
}

async function rpc<T>(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await client().rpc(name, args)
  if (error) throw error
  return data as T
}

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await client().auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data.session
}

export async function signOutAdmin() {
  const { error } = await client().auth.signOut()
  if (error) throw error
}

export async function getAdminSession() {
  const { data, error } = await client().auth.getSession()
  if (error) throw error
  return data.session
}

export function onAdminAuthChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return client().auth.onAuthStateChange(callback).data.subscription
}

export const getAdminProfile = () => rpc<AdminProfile>("admin_get_profile")

export const getDashboard = (date?: string) =>
  rpc<DashboardData>("admin_dashboard", { p_date: date ?? null })

export function listAppointments(
  input: {
    startAt?: string | null
    endAt?: string | null
    status?: string | null
    query?: string | null
    stylistId?: string | null
    serviceId?: string | null
  } = {},
) {
  return rpc<AdminAppointment[]>("admin_list_appointments", {
    p_start_at: input.startAt ?? null,
    p_end_at: input.endAt ?? null,
    p_status: input.status ?? null,
    p_query: input.query ?? null,
    p_stylist_id: input.stylistId ?? null,
    p_service_id: input.serviceId ?? null,
  })
}

export const getAppointment = (id: string) =>
  rpc<AdminAppointment>("admin_get_appointment", { p_appointment_id: id })

export const updateAppointmentStatus = (
  id: string,
  status: AdminAppointmentStatus,
) =>
  rpc<AdminAppointment>("admin_update_appointment_status", {
    p_appointment_id: id,
    p_status: status,
  })

export const getReferenceData = () => rpc<ReferenceData>("admin_reference_data")

export const getAdminSlots = (input: {
  serviceId: string
  addonIds: string[]
  stylistId: string | null
  date: string
  appointmentId?: string | null
}) =>
  rpc<AdminSlot[]>("admin_available_slots", {
    p_service_id: input.serviceId,
    p_addon_ids: input.addonIds,
    p_stylist_id: input.stylistId,
    p_date: input.date,
    p_appointment_id: input.appointmentId ?? null,
  })

export const rescheduleAdminAppointment = (
  id: string,
  startAt: string,
  stylistId: string | null,
) =>
  rpc<AdminAppointment>("admin_reschedule_appointment", {
    p_appointment_id: id,
    p_start_at: startAt,
    p_stylist_id: stylistId,
  })

export const createAdminAppointment = (input: {
  customerId: string | null
  firstName: string
  lastName: string
  phone: string
  email: string
  serviceId: string
  addonIds: string[]
  stylistId: string | null
  startAt: string
  notes: string
}) =>
  rpc<AdminAppointment>("admin_create_appointment", {
    p_customer_id: input.customerId,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_phone: input.phone,
    p_email: input.email,
    p_service_id: input.serviceId,
    p_addon_ids: input.addonIds,
    p_stylist_id: input.stylistId,
    p_start_at: input.startAt,
    p_customer_notes: input.notes || null,
  })

export const listCustomers = (query = "") =>
  rpc<CustomerSummary[]>("admin_list_customers", { p_query: query || null })

export const getCustomer = (id: string) =>
  rpc<CustomerProfile>("admin_get_customer", { p_customer_id: id })

export const updateCustomer = (
  id: string,
  customer: Pick<CustomerSummary, "first_name" | "last_name" | "phone" | "email">,
) =>
  rpc<CustomerProfile>("admin_update_customer", {
    p_customer_id: id,
    p_first_name: customer.first_name,
    p_last_name: customer.last_name,
    p_phone: customer.phone,
    p_email: customer.email,
  })

export const saveService = (service: {
  id: string | null
  name: string
  description: string
  durationMinutes: number
  priceDisplay: string
  category: string
  active: boolean
  addonIds: string[]
  stylistIds: string[]
}) =>
  rpc<string>("admin_save_service", {
    p_id: service.id,
    p_name: service.name,
    p_description: service.description,
    p_duration_minutes: service.durationMinutes,
    p_price_display: service.priceDisplay,
    p_category: service.category,
    p_active: service.active,
    p_addon_ids: service.addonIds,
    p_stylist_ids: service.stylistIds,
  })

export const saveStylist = (stylist: {
  id: string | null
  name: string
  bio: string
  imageUrl: string
  active: boolean
  serviceIds: string[]
}) =>
  rpc<string>("admin_save_stylist", {
    p_id: stylist.id,
    p_name: stylist.name,
    p_bio: stylist.bio,
    p_image_url: stylist.imageUrl,
    p_active: stylist.active,
    p_service_ids: stylist.serviceIds,
  })

export const getAvailability = () =>
  rpc<AvailabilityData>("admin_list_availability")

export const saveAvailability = (input: {
  id?: string | null
  stylistId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  active?: boolean
}) =>
  rpc<string>("admin_save_availability", {
    p_id: input.id ?? null,
    p_stylist_id: input.stylistId,
    p_day_of_week: input.dayOfWeek,
    p_start_time: input.startTime,
    p_end_time: input.endTime,
    p_active: input.active ?? true,
  })

export const deleteAvailability = (id: string) =>
  rpc<void>("admin_delete_availability", { p_id: id })

export const createBlockedTime = (input: {
  stylistId: string | null
  startAt: string
  endAt: string
  reason: string
}) =>
  rpc<string>("admin_create_block", {
    p_stylist_id: input.stylistId,
    p_start_at: input.startAt,
    p_end_at: input.endAt,
    p_reason: input.reason || null,
  })

export const deleteBlockedTime = (id: string) =>
  rpc<void>("admin_delete_block", { p_id: id })

export const getSettings = () => rpc<SalonSettings>("admin_get_settings")

export const updateSettings = (settings: SalonSettings) =>
  rpc<SalonSettings>("admin_update_settings", {
    p_salon_name: settings.salon_name,
    p_phone: settings.phone,
    p_address: settings.address,
    p_booking_timezone: settings.booking_timezone,
    p_booking_window_days: settings.booking_window_days,
    p_minimum_lead_minutes: settings.minimum_lead_minutes,
    p_cancellation_notice_hours: settings.cancellation_notice_hours,
  })

export const listNotifications = (limit = 20) =>
  rpc<AdminNotification[]>("admin_list_notifications", { p_limit: limit })
