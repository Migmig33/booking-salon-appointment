export type EmailEventType = "booking" | "reschedule" | "cancellation" | "reminder"

export interface EmailAddon {
  name: string
}

export interface EmailAppointmentPayload {
  booking_reference: string
  start_at: string
  end_at: string
  duration_minutes: number
  management_token: string
  service: { name: string }
  addons: EmailAddon[]
  stylist: { name: string }
  customer: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
}

export interface ClaimedEmailDelivery {
  id: string
  event_type: EmailEventType
  event_key: string
  recipient_email: string
  payload: EmailAppointmentPayload
  attempts: number
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EmailProviderResult {
  messageId: string
}

export interface EmailProvider {
  send(input: {
    deliveryId: string
    recipient: string
    email: RenderedEmail
  }): Promise<EmailProviderResult>
}
