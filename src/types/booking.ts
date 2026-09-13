export interface Service {
  id: string
  slug: string
  name: string
  category: string
  description: string
  durationMinutes: number
  duration: string
  priceDisplay: string
  price: string
}

export interface Addon {
  id: string
  slug: string
  name: string
  description: string
  durationMinutes: number
  duration: string
  priceDisplay: string
  price: string
}

export interface Stylist {
  id: string
  name: string
  bio: string
  imageUrl: string | null
}

export type StylistChoice = "any" | Stylist | null

export interface CustomerDetails {
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
  updates: boolean
}

export interface BookingData {
  service: Service | null
  addons: Addon[]
  stylist: StylistChoice
  date: string | null
  time: string | null
  startAt: string | null
  customer: CustomerDetails
}

export interface AvailabilitySlot {
  startAt: string
  endAt: string
  stylistId: string
  stylistName: string
  label: string
  hour: number
}

export type AppointmentStatus = "confirmed" | "checked_in" | "rescheduled" | "cancelled" | "completed" | "no_show"

export interface Appointment {
  bookingReference: string
  service: Service
  addons: Addon[]
  stylist: Stylist
  startAt: string
  endAt: string
  status: AppointmentStatus
  customer: Omit<CustomerDetails, "updates">
  durationMinutes: number
}

export interface BookingConfirmation {
  appointment: Appointment
  managementToken: string
}

export const emptyBooking: BookingData = {
  service: null,
  addons: [],
  stylist: null,
  date: null,
  time: null,
  startAt: null,
  customer: {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
    updates: false,
  },
}
