import type {
  EmailAppointmentPayload,
  EmailEventType,
  RenderedEmail,
} from "./notifications.ts"
import {
  CANCELLATION_POLICY,
  DEMO_NOTICE,
  DIRECTIONS_URL,
  LOCALE,
  SALON_ADDRESS,
  SALON_CONTACT_EMAIL,
  SALON_CONTACT_URL,
  SALON_NAME,
  TIME_ZONE,
  TIME_ZONE_LABEL,
} from "./salon-config.ts"

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value))
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (!hours) return `${remaining} minutes`
  if (!remaining) return `${hours} ${hours === 1 ? "hour" : "hours"}`
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${remaining} minutes`
}

function button(label: string, url: string, secondary = false) {
  const background = secondary ? "#ffffff" : "#61473a"
  const color = secondary ? "#61473a" : "#ffffff"
  const border = "1px solid #61473a"
  return `<a href="${escapeHtml(url)}" style="display:inline-block;margin:6px 6px 6px 0;padding:12px 18px;border-radius:999px;background:${background};color:${color};border:${border};text-decoration:none;font-weight:600;font-size:14px">${escapeHtml(label)}</a>`
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:8px 12px 8px 0;color:#76685f;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 0;color:#2e2824;font-weight:600">${escapeHtml(value)}</td></tr>`
}

function frame(title: string, intro: string, details: string, actions: string) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f1ec;color:#2e2824;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f1ec;padding:28px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7ddd5">
          <tr><td style="padding:28px 32px;background:#61473a;color:#ffffff">
            <div style="font-family:Georgia,serif;font-size:26px">${SALON_NAME}</div>
            <div style="margin-top:6px;font-size:11px;letter-spacing:.08em;opacity:.72">${escapeHtml(DEMO_NOTICE)}</div>
          </td></tr>
          <tr><td style="padding:32px">
            <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#2e2824">${escapeHtml(title)}</h1>
            <p style="margin:0 0 22px;line-height:1.6;color:#5d514a">${escapeHtml(intro)}</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin-bottom:22px;border-top:1px solid #eee5df;border-bottom:1px solid #eee5df">${details}</table>
            <div>${actions}</div>
            <p style="margin:24px 0 0;color:#5d514a;font-size:13px;line-height:1.6"><strong>Cancellation policy:</strong> ${escapeHtml(CANCELLATION_POLICY)}</p>
            <p style="margin:24px 0 0;color:#76685f;font-size:13px;line-height:1.6">All appointment times are shown in ${escapeHtml(TIME_ZONE_LABEL)}.<br>${escapeHtml(SALON_ADDRESS)} · ${escapeHtml(SALON_CONTACT_EMAIL)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

function common(payload: EmailAppointmentPayload, publicSiteUrl: string) {
  const baseUrl = publicSiteUrl.replace(/\/$/, "")
  const manageUrl = `${baseUrl}/manage-booking/${encodeURIComponent(payload.management_token)}`
  const customerName =
    `${payload.customer.first_name} ${payload.customer.last_name}`.trim()
  const addonNames = (payload.addons ?? []).map((addon) => addon.name)
  return {
    addonNames,
    customerName,
    date: formatDate(payload.start_at),
    duration: formatDuration(Number(payload.duration_minutes)),
    manageUrl,
    time: formatTime(payload.start_at),
  }
}

export function renderAppointmentEmail(
  eventType: EmailEventType,
  payload: EmailAppointmentPayload,
  publicSiteUrl: string,
): RenderedEmail {
  const value = common(payload, publicSiteUrl)
  const reference = payload.booking_reference
  const service = payload.service.name
  const stylist = payload.stylist.name
  const addOns = value.addonNames.length ? value.addonNames.join(", ") : "None"
  const contact = `${SALON_ADDRESS} · ${SALON_CONTACT_EMAIL}`

  if (eventType === "booking") {
    const subject = `Your ${SALON_NAME} Appointment is Confirmed`
    const details = [
      detailRow("Customer", value.customerName),
      detailRow("Booking reference", reference),
      detailRow("Service", service),
      detailRow("Add-ons", addOns),
      detailRow("Stylist", stylist),
      detailRow("Date", value.date),
      detailRow("Time", value.time),
      detailRow("Estimated duration", value.duration),
    ].join("")
    const actions = [
      button("Manage Appointment", value.manageUrl),
      button("Get Directions", DIRECTIONS_URL, true),
      button("Email Demo Contact", SALON_CONTACT_URL, true),
    ].join("")
    return {
      subject,
      html: frame(
        subject,
        `Hi ${value.customerName}, your appointment is confirmed.`,
        details,
        actions,
      ),
      text: `${subject}\n${DEMO_NOTICE}\n\nHi ${value.customerName}, your sample appointment is confirmed.\n\nBooking reference: ${reference}\nService: ${service}\nAdd-ons: ${addOns}\nStylist: ${stylist}\nDate: ${value.date}\nTime: ${value.time}\nEstimated duration: ${value.duration}\nLocation: ${SALON_ADDRESS}\nEmail: ${SALON_CONTACT_EMAIL}\n\nCancellation policy: ${CANCELLATION_POLICY}\n\nManage Appointment: ${value.manageUrl}\nView Location: ${DIRECTIONS_URL}\nEmail Demo Contact: ${SALON_CONTACT_URL}`,
    }
  }

  if (eventType === "reschedule") {
    const subject = `Your ${SALON_NAME} Appointment Has Been Updated`
    const details = [
      detailRow("Booking reference", reference),
      detailRow("Service", service),
      detailRow("Stylist", stylist),
      detailRow("New date", value.date),
      detailRow("New time", value.time),
    ].join("")
    return {
      subject,
      html: frame(
        subject,
        `Hi ${value.customerName}, your new appointment time is confirmed.`,
        details,
        button("Manage Appointment", value.manageUrl),
      ),
      text: `${subject}\n${DEMO_NOTICE}\n\nHi ${value.customerName}, your new appointment time is confirmed.\n\nBooking reference: ${reference}\nService: ${service}\nStylist: ${stylist}\nNew date: ${value.date}\nNew time: ${value.time}\n\nCancellation policy: ${CANCELLATION_POLICY}\n\nManage Appointment: ${value.manageUrl}\n${contact}`,
    }
  }

  if (eventType === "cancellation") {
    const subject = `Your ${SALON_NAME} Appointment Has Been Cancelled`
    const bookUrl = `${publicSiteUrl.replace(/\/$/, "")}/book`
    const details = [
      detailRow("Booking reference", reference),
      detailRow("Cancelled service", service),
      detailRow("Original date", value.date),
      detailRow("Original time", value.time),
    ].join("")
    return {
      subject,
      html: frame(
        subject,
        `Hi ${value.customerName}, your appointment has been cancelled.`,
        details,
        button("Book Another Appointment", bookUrl),
      ),
      text: `${subject}\n${DEMO_NOTICE}\n\nHi ${value.customerName}, your appointment has been cancelled.\n\nBooking reference: ${reference}\nCancelled service: ${service}\nOriginal date: ${value.date}\nOriginal time: ${value.time}\n${contact}\n\nBook Another Appointment: ${bookUrl}`,
    }
  }

  const subject = `Reminder: Your ${SALON_NAME} Appointment is Tomorrow`
  const details = [
    detailRow("Booking reference", reference),
    detailRow("Service", service),
    detailRow("Stylist", stylist),
    detailRow("Date", value.date),
    detailRow("Time", value.time),
    detailRow("Address", SALON_ADDRESS),
  ].join("")
  const actions = [
    button("View Appointment", value.manageUrl),
    button("Reschedule", `${value.manageUrl}?action=reschedule`, true),
    button("Cancel", `${value.manageUrl}?action=cancel`, true),
  ].join("")
  return {
    subject,
    html: frame(
      subject,
      `Hi ${value.customerName}, this is a reminder for your appointment tomorrow.`,
      details,
      actions,
    ),
    text: `${subject}\n${DEMO_NOTICE}\n\nHi ${value.customerName}, this is a reminder for your sample appointment tomorrow.\n\nBooking reference: ${reference}\nService: ${service}\nStylist: ${stylist}\nDate: ${value.date}\nTime: ${value.time}\nLocation: ${SALON_ADDRESS}\n\nCancellation policy: ${CANCELLATION_POLICY}\n\nView Appointment: ${value.manageUrl}\nReschedule: ${value.manageUrl}?action=reschedule\nCancel: ${value.manageUrl}?action=cancel`,
  }
}
