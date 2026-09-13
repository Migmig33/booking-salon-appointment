export type AdminRole = "owner" | "manager"
export type AdminAppointmentStatus = "confirmed" | "checked_in" | "completed" | "rescheduled" | "cancelled" | "no_show"

export interface AdminProfile {
  user_id: string
  display_name: string
  email: string
  role: AdminRole
}

export interface AdminCustomer {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
}

export interface AdminService {
  id: string
  name: string
  slug: string
  category: string
  description: string
  duration_minutes: number
  price_display: string
  active: boolean
  addon_ids: string[]
  stylist_ids: string[]
}

export interface AdminAddon {
  id: string
  name: string
  duration_minutes: number
  price_display: string
  active: boolean
}

export interface AdminStylist {
  id: string
  name: string
  bio: string
  image_url: string | null
  active: boolean
  service_ids: string[]
}

export interface AdminAppointment {
  id: string
  booking_reference: string
  start_at: string
  end_at: string
  status: AdminAppointmentStatus
  customer_notes: string | null
  created_at: string
  updated_at: string
  duration_minutes: number
  customer: AdminCustomer
  service: AdminService
  stylist: AdminStylist
  addons: AdminAddon[]
}

export interface DashboardData {
  date: string
  appointments_today: number
  upcoming: number
  completed_today: number
  cancelled_today: number
  no_shows_today: number
  appointments: AdminAppointment[]
}

export interface CustomerSummary extends AdminCustomer {
  upcoming_appointment: string | null
  last_appointment: string | null
  previous_appointments: number
  no_shows: number
}

export interface CustomerProfile extends AdminCustomer {
  created_at: string
  appointments: AdminAppointment[]
}

export interface ReferenceData {
  services: AdminService[]
  addons: AdminAddon[]
  stylists: AdminStylist[]
}

export interface AdminSlot {
  start_at: string
  end_at: string
  stylist_id: string
  stylist_name: string
}

export interface AvailabilitySchedule {
  id: string
  stylist_id: string
  stylist_name: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

export interface BlockedTime {
  id: string
  stylist_id: string | null
  stylist_name: string
  start_at: string
  end_at: string
  reason: string | null
}

export interface AvailabilityData {
  schedules: AvailabilitySchedule[]
  blocked_times: BlockedTime[]
}

export interface SalonSettings {
  id: number
  salon_name: string
  phone: string
  address: string
  booking_timezone: string
  booking_window_days: number
  minimum_lead_minutes: number
  cancellation_notice_hours: number
  updated_at: string
}

export interface AdminNotification {
  id: number
  appointment_id: string
  event_type: "new_booking" | "rescheduled" | "cancelled"
  title: string
  body: string
  created_at: string
}
