import type { ReactNode } from "react"
import type { Page } from "../App"
import Footer from "../components/Footer"
import {
  CANCELLATION_POLICY,
  SALON_ADDRESS,
  SALON_NAME,
  SALON_PHONE_DISPLAY,
  SALON_PHONE_LINK,
} from "../config/salon"

interface LegalPageProps {
  navigate: (page: Page) => void
  startBooking: () => void
}

function PolicySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-warm-line pt-7 first:border-0 first:pt-0">
      <h2 className="font-serif text-[21px] text-charcoal">{title}</h2>
      <div className="mt-3 space-y-3 text-[14px] leading-7 text-charcoal-mid">
        {children}
      </div>
    </section>
  )
}

function LegalPage({
  eyebrow,
  title,
  summary,
  children,
  navigate,
  startBooking,
}: LegalPageProps & {
  eyebrow: string
  title: string
  summary: string
  children: ReactNode
}) {
  return (
    <>
      <main>
        <header className="bg-charcoal text-cream">
          <div className="max-w-5xl mx-auto px-5 lg:px-8 py-14 lg:py-20">
            <p className="text-[10px] uppercase tracking-[0.22em] text-bronze-light font-medium">
              {eyebrow}
            </p>
            <h1 className="font-serif text-[34px] sm:text-[42px] lg:text-[50px] leading-tight mt-3">
              {title}
            </h1>
            <p className="max-w-2xl text-[14px] sm:text-[15px] text-cream/65 leading-7 mt-5">
              {summary}
            </p>
            <p className="text-[11px] text-cream/40 mt-6">
              Last updated September 14, 2026
            </p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10 lg:py-16">
          <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
            <aside className="lg:sticky lg:top-28 border-l-2 border-bronze pl-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-warm-gray font-medium">
                Questions?
              </p>
              <a
                href={SALON_PHONE_LINK}
                className="block text-[14px] text-charcoal hover:text-bronze mt-3 transition-colors"
              >
                {SALON_PHONE_DISPLAY}
              </a>
              <p className="text-[12px] leading-5 text-warm-gray mt-2">
                {SALON_ADDRESS}
              </p>
            </aside>
            <article className="min-w-0 space-y-8">{children}</article>
          </div>
        </div>
      </main>
      <Footer navigate={navigate} startBooking={startBooking} />
    </>
  )
}

export function PrivacyPolicyPage(props: LegalPageProps) {
  return (
    <LegalPage
      {...props}
      eyebrow="Your information"
      title="Privacy Policy"
      summary={
        "This policy explains how " +
        SALON_NAME +
        " handles the information you provide when browsing our website, booking an appointment, or contacting the salon."
      }
    >
      <PolicySection title="Information we collect">
        <p>
          When you book or manage an appointment, we collect the information
          needed to provide the service: your name, phone number, email address,
          selected service and add-ons, stylist preference, appointment date and
          time, and any notes you choose to provide.
        </p>
        <p>
          We also retain appointment status and history, such as confirmations,
          reschedules, cancellations, completed visits, and no-shows. No-show
          information is available only to authorized salon staff and is not
          displayed on the public website.
        </p>
        <p>
          Limited technical information may be processed for security and abuse
          prevention. For example, a one-way representation of a request&apos;s
          network address may be used to limit repeated booking-recovery
          attempts.
        </p>
      </PolicySection>

      <PolicySection title="How we use information">
        <p>We use customer information to:</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-bronze">
          <li>Create, confirm, manage, reschedule, or cancel appointments.</li>
          <li>Check stylist and service availability.</li>
          <li>Send appointment confirmations, changes, and reminders.</li>
          <li>Contact you about a booking or respond to your request.</li>
          <li>Maintain salon records and protect the booking system.</li>
        </ul>
        <p>
          We do not use booking contact information for unrelated marketing, and
          we do not sell or rent customer personal information.
        </p>
      </PolicySection>

      <PolicySection title="How information is shared">
        <p>
          Authorized owners, managers, and salon staff may access customer
          information only as needed to operate the appointment schedule and
          serve customers.
        </p>
        <p>
          We use service providers to run the website and booking system,
          including Vercel for website hosting, Supabase for authentication and
          database services, and a transactional email provider for appointment
          messages. These providers process information on our behalf under
          their own security and privacy obligations.
        </p>
        <p>
          We may disclose information when reasonably necessary to comply with
          law, respond to valid legal process, protect safety, or investigate
          misuse of the booking system.
        </p>
      </PolicySection>

      <PolicySection title="Retention and appointment history">
        <p>
          Appointment and customer records may remain in the salon&apos;s
          booking database for operational history, customer service, security,
          and recordkeeping. Cancelling an appointment changes its status; it
          does not automatically delete the appointment record.
        </p>
        <p>
          You may contact us to ask about correction or deletion of your
          information. We may retain limited records when reasonably necessary
          for legitimate business, security, dispute-resolution, or legal
          purposes.
        </p>
      </PolicySection>

      <PolicySection title="Security">
        <p>
          We use reasonable administrative and technical safeguards, including
          restricted staff access, authenticated administration, database access
          controls, and secure connections. No online service can guarantee
          absolute security, so please do not place highly sensitive information
          in the optional appointment-notes field.
        </p>
      </PolicySection>

      <PolicySection title="Browser storage and external services">
        <p>
          The website does not currently use advertising or behavioral-marketing
          cookies. Necessary browser storage may be used to keep authorized
          staff signed in and support essential website operation.
        </p>
        <p>
          Standard technical request information may be received by providers
          when your browser loads externally hosted resources or when you choose
          to open an external map link.
        </p>
      </PolicySection>

      <PolicySection title="Your choices">
        <p>
          You may use the secure Manage Booking link to review permitted booking
          details and make available changes. You can also contact the salon to
          request access to, correction of, or deletion of your customer
          information.
        </p>
        <p>
          Appointment confirmations, schedule changes, cancellations, and
          reminders are service-related communications rather than marketing
          messages. Contact the salon if you need help with these
          communications.
        </p>
      </PolicySection>

      <PolicySection title="Children's information">
        <p>
          The booking form is intended to be completed by an adult or with an
          adult&apos;s involvement. A parent or guardian booking for a minor
          should provide the adult&apos;s contact information and avoid
          submitting unnecessary personal information about the child.
        </p>
      </PolicySection>

      <PolicySection title="External links and policy changes">
        <p>
          Our website may link to external services such as maps. Their privacy
          practices are governed by their own policies. We may revise this
          policy as our services or legal obligations change. The updated date
          above shows when this policy was most recently revised.
        </p>
      </PolicySection>

      <PolicySection title="Contact us">
        <p>
          For privacy questions or requests, call{" "}
          <a
            href={SALON_PHONE_LINK}
            className="text-bronze underline underline-offset-4"
          >
            {SALON_PHONE_DISPLAY}
          </a>{" "}
          or write to {SALON_NAME}, {SALON_ADDRESS}.
        </p>
      </PolicySection>
    </LegalPage>
  )
}

export function BookingTermsPage(props: LegalPageProps) {
  return (
    <LegalPage
      {...props}
      eyebrow="Salon policies"
      title="Booking Terms & Conditions"
      summary={
        "These terms explain the conditions that apply when you use the " +
        SALON_NAME +
        " website to request or manage an appointment."
      }
    >
      <PolicySection title="Agreement to these terms">
        <p>
          By confirming an appointment through this website, you agree to these
          Booking Terms & Conditions and acknowledge our{" "}
          <a
            href="/privacy-policy"
            className="text-bronze underline underline-offset-4"
          >
            Privacy Policy
          </a>
          . If you do not agree, please contact the salon before booking online.
        </p>
      </PolicySection>

      <PolicySection title="Booking information">
        <p>
          Please provide accurate contact and appointment information. You are
          responsible for reviewing the service, stylist, date, and time before
          confirming. A booking reference or secure management link should be
          kept private because it may allow someone to view or manage the
          appointment.
        </p>
      </PolicySection>

      <PolicySection title="Availability and confirmation">
        <p>
          Displayed availability can change until an appointment is successfully
          confirmed. An appointment is accepted when the booking system creates
          a confirmation and booking reference. If a technical or scheduling
          error occurs, the salon may contact you to arrange a reasonable
          alternative.
        </p>
      </PolicySection>

      <PolicySection title="Services, duration, and pricing">
        <p>
          Service descriptions, durations, and displayed pricing are estimates
          or informational descriptions. Hair length, condition, product use,
          additional work, and consultation results may affect the final
          service, duration, and price. The salon will confirm final pricing
          directly.
        </p>
        <p>
          This website does not accept deposits, cards, or other online
          payments. Any payment for salon services is handled separately by the
          salon.
        </p>
      </PolicySection>

      <PolicySection title="Rescheduling and cancellation">
        <p>{CANCELLATION_POLICY}</p>
        <p>
          Online cancellation becomes unavailable inside that 24-hour window.
          Please call the salon as soon as possible if you need assistance with
          a late change. Contacting the salon does not guarantee that the policy
          will be waived.
        </p>
        <p>
          A rescheduled or cancelled appointment remains in salon records with
          its updated status. The salon may need to reschedule or cancel an
          appointment because of staff availability, emergencies, unsafe
          conditions, or other operational circumstances.
        </p>
      </PolicySection>

      <PolicySection title="Late arrivals and no-shows">
        <p>
          Arriving late may reduce the time available for your service or
          require rescheduling so later customers are not delayed. If you do not
          arrive and do not cancel, the appointment may be recorded internally
          as a no-show. No-show history is private and is not displayed
          publicly.
        </p>
      </PolicySection>

      <PolicySection title="Appointment communications">
        <p>
          We may use the email address or phone number supplied with a booking
          to send or make service-related communications, including
          confirmations, reminders, reschedule notices, cancellation notices, or
          questions about the appointment. These are not marketing messages.
        </p>
      </PolicySection>

      <PolicySection title="Acceptable use">
        <p>
          Do not create fraudulent, speculative, automated, or intentionally
          disruptive bookings; attempt to access another customer&apos;s
          appointment; interfere with website security; or use the service in
          violation of law. The salon may cancel bookings associated with misuse
          and restrict access when reasonably necessary to protect customers or
          operations.
        </p>
      </PolicySection>

      <PolicySection title="Website availability">
        <p>
          We work to keep booking information accurate and the website
          available, but temporary interruptions or errors may occur. To the
          extent allowed by law, the salon is not responsible for losses caused
          solely by an interruption outside its reasonable control. Nothing in
          these terms limits rights or remedies that cannot legally be limited.
        </p>
      </PolicySection>

      <PolicySection title="Privacy, changes, and contact">
        <p>
          Our{" "}
          <a
            href="/privacy-policy"
            className="text-bronze underline underline-offset-4"
          >
            Privacy Policy
          </a>{" "}
          explains how booking information is handled. We may update these terms
          when salon practices or the booking service changes. The terms
          displayed when you confirm a booking apply to that online transaction.
        </p>
        <p>
          Questions about a booking or these terms can be directed to{" "}
          <a
            href={SALON_PHONE_LINK}
            className="text-bronze underline underline-offset-4"
          >
            {SALON_PHONE_DISPLAY}
          </a>{" "}
          or {SALON_NAME}, {SALON_ADDRESS}.
        </p>
      </PolicySection>
    </LegalPage>
  )
}
