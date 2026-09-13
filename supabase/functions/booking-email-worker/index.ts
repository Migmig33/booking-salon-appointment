import { withSupabase } from "npm:@supabase/server"
import { renderAppointmentEmail } from "../_shared/email-templates.ts"
import type {
  ClaimedEmailDelivery,
  EmailProvider,
} from "../_shared/notifications.ts"

const CORS_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
}

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing required email configuration: ${name}`)
  return value
}

function emailMode() {
  const mode = (Deno.env.get("EMAIL_MODE") ?? "log").toLowerCase()
  if (!["log", "test", "production"].includes(mode)) {
    throw new Error("EMAIL_MODE must be log, test, or production")
  }
  return mode as "log" | "test" | "production"
}

function emailProviderName() {
  const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "brevo").toLowerCase()
  if (!["brevo", "resend"].includes(provider)) {
    throw new Error("EMAIL_PROVIDER must be brevo or resend")
  }
  return provider as "brevo" | "resend"
}

function brevoProvider(): EmailProvider {
  const apiKey = requiredEnvironment("BREVO_API_KEY")
  const senderName = Deno.env.get("EMAIL_FROM_NAME")?.trim() || "TJ Hair Salon"
  const senderEmail = requiredEnvironment("EMAIL_FROM_ADDRESS")

  return {
    async send({ deliveryId, recipient, email }) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipient }],
          subject: email.subject,
          htmlContent: email.html,
          textContent: email.text,
          headers: { idempotencyKey: deliveryId },
          tags: ["tj-appointment"],
        }),
      })

      const body = (await response.json().catch(() => ({}))) as {
        messageId?: string
        message?: string
      }
      if (!response.ok || !body.messageId) {
        throw new Error(
          `Brevo rejected the email (${response.status}): ${body.message ?? "unknown provider error"}`,
        )
      }
      return { messageId: body.messageId }
    },
  }
}

function resendProvider(): EmailProvider {
  const apiKey = requiredEnvironment("RESEND_API_KEY")
  const from = requiredEnvironment("EMAIL_FROM")

  return {
    async send({ deliveryId, recipient, email }) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": deliveryId,
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      })

      const body = (await response.json().catch(() => ({}))) as {
        id?: string
        message?: string
      }
      if (!response.ok || !body.id) {
        throw new Error(
          `Resend rejected the email (${response.status}): ${body.message ?? "unknown provider error"}`,
        )
      }
      return { messageId: body.id }
    },
  }
}

function configuredProvider() {
  return emailProviderName() === "brevo" ? brevoProvider() : resendProvider()
}

function retryDelay(attempts: number) {
  return Math.min(3600, 30 * 2 ** Math.max(0, attempts - 1))
}

const securedHandler = withSupabase(
  { auth: ["publishable", "secret"] },
  async (_request, context) => {
    const mode = emailMode()
    const publicSiteUrl = requiredEnvironment("PUBLIC_SITE_URL")

    const { error: reminderError } = await context.supabaseAdmin.rpc(
      "email_enqueue_due_reminders",
    )
    if (reminderError) {
      console.error(
        "Unable to enqueue appointment reminders",
        reminderError.message,
      )
    }

    const { data, error } = await context.supabaseAdmin.rpc(
      "email_claim_deliveries",
      {
        p_limit: 10,
      },
    )
    if (error) {
      console.error("Unable to claim email deliveries", error.message)
      return Response.json(
        { ok: false, message: "Email queue is temporarily unavailable." },
        { status: 500 },
      )
    }

    const deliveries = (data ?? []) as ClaimedEmailDelivery[]
    const provider = mode === "log" ? null : configuredProvider()
    let delivered = 0
    let failed = 0

    for (const delivery of deliveries) {
      try {
        const rendered = renderAppointmentEmail(
          delivery.event_type,
          delivery.payload,
          publicSiteUrl,
        )

        if (mode === "log") {
          console.log(
            JSON.stringify({
              mode,
              deliveryId: delivery.id,
              eventType: delivery.event_type,
              bookingReference: delivery.payload.booking_reference,
              subject: rendered.subject,
            }),
          )
          const { error: finishError } = await context.supabaseAdmin.rpc(
            "email_finish_delivery",
            {
              p_delivery_id: delivery.id,
              p_status: "simulated",
            },
          )
          if (finishError) throw finishError
          delivered += 1
          continue
        }

        const recipient =
          mode === "test"
            ? requiredEnvironment("EMAIL_TEST_RECIPIENT")
            : delivery.recipient_email
        const email =
          mode === "test"
            ? { ...rendered, subject: `[TEST] ${rendered.subject}` }
            : rendered
        const result = await provider!.send({
          deliveryId: delivery.id,
          recipient,
          email,
        })

        const { error: finishError } = await context.supabaseAdmin.rpc(
          "email_finish_delivery",
          {
            p_delivery_id: delivery.id,
            p_status: "sent",
            p_provider_message_id: result.messageId,
          },
        )
        if (finishError) throw finishError
        delivered += 1
      } catch (cause) {
        failed += 1
        const message = cause instanceof Error ? cause.message : String(cause)
        const willRetry = delivery.attempts < 5
        console.error("Email delivery failed", {
          deliveryId: delivery.id,
          eventType: delivery.event_type,
          attempts: delivery.attempts,
          error: message,
        })
        const { error: finishError } = await context.supabaseAdmin.rpc(
          "email_finish_delivery",
          {
            p_delivery_id: delivery.id,
            p_status: willRetry ? "queued" : "failed",
            p_error: message,
            p_retry_seconds: willRetry ? retryDelay(delivery.attempts) : null,
          },
        )
        if (finishError) {
          console.error(
            "Unable to record email delivery failure",
            finishError.message,
          )
        }
      }
    }

    return Response.json({
      ok: true,
      processed: deliveries.length,
      delivered,
      failed,
    })
  },
)

export default {
  async fetch(request: Request) {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS })
    }
    if (request.method !== "POST") {
      return Response.json({ ok: false, message: "Method not allowed." }, {
        status: 405,
        headers: CORS_HEADERS,
      })
    }

    const response = await securedHandler(request)
    const headers = new Headers(response.headers)
    Object.entries(CORS_HEADERS).forEach(([key, value]) =>
      headers.set(key, value),
    )
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}
