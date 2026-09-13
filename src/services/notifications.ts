import type { Appointment } from "../types/booking"

export interface AppointmentMessage {
  appointment: Appointment
  links: {
    view: string
    reschedule: string
    cancel: string
  }
}

export interface AppointmentNotificationService {
  sendConfirmation(message: AppointmentMessage): Promise<void>
  sendReminder(message: AppointmentMessage): Promise<void>
  sendRescheduleConfirmation(message: AppointmentMessage): Promise<void>
  sendCancellationConfirmation(message: AppointmentMessage): Promise<void>
}

// The email adapter lives in the Supabase booking-email-worker Edge Function.
// This provider-neutral contract remains available for a future SMS adapter.
