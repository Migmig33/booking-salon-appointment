import { useEffect, useMemo, useState } from "react"
import {
  createAdminAppointment,
  getAdminSlots,
  getReferenceData,
  listCustomers,
} from "../api"
import { ErrorBlock, LoadingBlock, PageHeader, Panel } from "../components"
import { adminDateKey, shiftDateKey } from "../time"
import { formatAppointmentTime } from "../../lib/time"
import type { AdminSlot, CustomerSummary, ReferenceData } from "../types"

const steps = ["Customer", "Service", "Stylist", "Date & time", "Review"]

export default function NewAppointmentPage({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const [step, setStep] = useState(0)
  const [references, setReferences] = useState<ReferenceData | null>(null)
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [addonIds, setAddonIds] = useState<string[]>([])
  const [stylistId, setStylistId] = useState("")
  const [date, setDate] = useState(shiftDateKey(adminDateKey(), 1))
  const [slot, setSlot] = useState<AdminSlot | null>(null)
  const [slots, setSlots] = useState<AdminSlot[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getReferenceData()
      .then(setReferences)
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load booking options.",
        ),
      )
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    if (step !== 0) return
    const timer = window.setTimeout(
      () =>
        listCustomers(customerQuery)
          .then(setCustomers)
          .catch(() => setCustomers([])),
      200,
    )
    return () => window.clearTimeout(timer)
  }, [customerQuery, step])
  useEffect(() => {
    if (step !== 3 || !serviceId) return
    setSlotsLoading(true)
    setSlot(null)
    getAdminSlots({ serviceId, addonIds, stylistId: stylistId || null, date })
      .then(setSlots)
      .catch((caught) => {
        setSlots([])
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load available times.",
        )
      })
      .finally(() => setSlotsLoading(false))
  }, [addonIds, date, serviceId, step, stylistId])

  const service = references?.services.find((item) => item.id === serviceId)
  const stylist = references?.stylists.find(
    (item) => item.id === (slot?.stylist_id || stylistId),
  )
  const addons =
    references?.addons.filter((item) => addonIds.includes(item.id)) ?? []
  const compatibleStylists =
    references?.stylists.filter(
      (item) => item.active && item.service_ids.includes(serviceId),
    ) ?? []
  const compatibleAddons =
    references?.addons.filter(
      (item) => item.active && service?.addon_ids.includes(item.id),
    ) ?? []
  const selectedCustomer = customers.find(
    (customer) => customer.id === customerId,
  )

  const canContinue = useMemo(() => {
    if (step === 0)
      return Boolean(
        customerId ||
          (firstName.trim() && lastName.trim() && phone.trim() && email.trim()),
      )
    if (step === 1) return Boolean(serviceId)
    if (step === 2) return Boolean(stylistId)
    if (step === 3) return Boolean(slot)
    return true
  }, [
    customerId,
    email,
    firstName,
    lastName,
    phone,
    serviceId,
    slot,
    step,
    stylistId,
  ])

  const chooseCustomer = (customer: CustomerSummary) => {
    setCustomerId(customer.id)
    setFirstName(customer.first_name)
    setLastName(customer.last_name)
    setPhone(customer.phone)
    setEmail(customer.email)
  }
  const create = async () => {
    if (!slot || !service) return
    setBusy(true)
    setError("")
    try {
      const appointment = await createAdminAppointment({
        customerId,
        firstName,
        lastName,
        phone,
        email,
        serviceId,
        addonIds,
        stylistId: slot.stylist_id,
        startAt: slot.start_at,
        notes,
      })
      navigate(`/admin/appointments/${appointment.id}`)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create appointment.",
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingBlock label="Preparing appointment form" />
  if (!references && error) return <ErrorBlock message={error} />

  return (
    <div>
      <button
        onClick={() => navigate("/admin/appointments")}
        className="text-[12px] text-warm-gray mb-5"
      >
        ← Appointments
      </button>
      <PageHeader
        title="New Appointment"
        description="Manual bookings use the same database availability and overlap protection as customer bookings."
      />
      <div className="flex overflow-auto border border-warm-line bg-white mb-5">
        {steps.map((label, index) => (
          <button
            key={label}
            onClick={() => index < step && setStep(index)}
            className={`shrink-0 flex-1 min-w-28 px-3 py-3 text-[11px] ${
              index === step
                ? "bg-charcoal text-cream"
                : index < step
                  ? "text-bronze"
                  : "text-warm-gray"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>
      {error && (
        <div className="mb-5">
          <ErrorBlock message={error} />
        </div>
      )}
      <Panel className="p-5 lg:p-7 max-w-3xl">
        {step === 0 && (
          <div>
            <h2 className="font-serif text-xl mb-1">
              Choose or create a customer
            </h2>
            <p className="text-[12px] text-warm-gray mb-5">
              Search existing records to keep customer history together.
            </p>
            <input
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Search name, phone, or email"
              className="w-full border border-warm-line p-3 text-[13px] mb-3"
            />
            {customerQuery && (
              <div className="border border-warm-line max-h-44 overflow-auto mb-5">
                {customers.slice(0, 8).map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => chooseCustomer(customer)}
                    className={`w-full text-left p-3 border-b border-warm-line last:border-0 text-[12px] ${
                      customerId === customer.id
                        ? "bg-cream-dark"
                        : "hover:bg-cream"
                    }`}
                  >
                    <span className="font-semibold">
                      {customer.first_name} {customer.last_name}
                    </span>
                    <span className="block text-warm-gray">
                      {customer.phone} · {customer.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {customerId && selectedCustomer && (
              <div className="bg-cream-dark p-4 mb-5 text-[13px]">
                <span className="font-semibold">Selected:</span>{" "}
                {selectedCustomer.first_name} {selectedCustomer.last_name}
                <button
                  onClick={() => setCustomerId(null)}
                  className="ml-3 text-bronze underline"
                >
                  Use new customer
                </button>
              </div>
            )}
            {!customerId && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  className="border border-warm-line p-3 text-[13px]"
                />
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  className="border border-warm-line p-3 text-[13px]"
                />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone"
                  className="border border-warm-line p-3 text-[13px]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="border border-warm-line p-3 text-[13px]"
                />
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-serif text-xl mb-5">Choose service</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {references?.services
                .filter((item) => item.active)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setServiceId(item.id)
                      setAddonIds([])
                      setStylistId("")
                    }}
                    className={`text-left border p-4 ${
                      serviceId === item.id
                        ? "border-bronze bg-cream-dark"
                        : "border-warm-line hover:border-charcoal"
                    }`}
                  >
                    <span className="block font-semibold text-[13px]">
                      {item.name}
                    </span>
                    <span className="block text-[11px] text-warm-gray mt-1">
                      {item.duration_minutes} min · {item.price_display}
                    </span>
                  </button>
                ))}
            </div>
            {service && compatibleAddons.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-wider text-warm-gray mb-3">
                  Compatible add-ons
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {compatibleAddons.map((addon) => (
                    <label
                      key={addon.id}
                      className="border border-warm-line p-3 text-[12px] flex gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={addonIds.includes(addon.id)}
                        onChange={(event) =>
                          setAddonIds((current) =>
                            event.target.checked
                              ? [...current, addon.id]
                              : current.filter((id) => id !== addon.id),
                          )
                        }
                      />
                      {addon.name} (+{addon.duration_minutes} min)
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-serif text-xl mb-5">Choose stylist</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {compatibleStylists.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStylistId(item.id)}
                  className={`text-left border p-4 ${
                    stylistId === item.id
                      ? "border-bronze bg-cream-dark"
                      : "border-warm-line hover:border-charcoal"
                  }`}
                >
                  <span className="font-semibold text-[13px]">{item.name}</span>
                  <span className="block text-[11px] text-warm-gray mt-1">
                    {item.bio || "Salon stylist"}
                  </span>
                </button>
              ))}
            </div>
            {compatibleStylists.length === 0 && (
              <p className="text-[12px] text-warm-gray">
                No active stylist is assigned to this service.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-serif text-xl mb-5">
              Choose date and available time
            </h2>
            <input
              type="date"
              min={adminDateKey()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="border border-warm-line p-3 text-[13px] mb-5"
            />
            {slotsLoading ? (
              <p className="text-[12px] text-warm-gray">
                Checking the shared calendar…
              </p>
            ) : slots.length === 0 ? (
              <p className="text-[12px] text-warm-gray">
                No available times on this date.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {slots.map((item) => (
                  <button
                    key={`${item.start_at}-${item.stylist_id}`}
                    onClick={() => setSlot(item)}
                    className={`border p-3 text-[12px] ${
                      slot?.start_at === item.start_at &&
                      slot?.stylist_id === item.stylist_id
                        ? "border-bronze bg-cream-dark"
                        : "border-warm-line"
                    }`}
                  >
                    <span className="block font-semibold">
                      {formatAppointmentTime(item.start_at)}
                    </span>
                    <span className="text-[10px] text-warm-gray">
                      {item.stylist_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-serif text-xl mb-5">Review appointment</h2>
            <div className="bg-cream-dark p-5 grid sm:grid-cols-2 gap-4 text-[13px]">
              <div>
                <p className="text-[10px] uppercase text-warm-gray">Customer</p>
                <p className="font-semibold mt-1">
                  {firstName} {lastName}
                </p>
                <p className="text-[11px] text-warm-gray">
                  {phone} · {email}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-gray">Service</p>
                <p className="font-semibold mt-1">{service?.name}</p>
                <p className="text-[11px] text-warm-gray">
                  {addons.map((addon) => addon.name).join(", ") || "No add-ons"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-gray">Stylist</p>
                <p className="font-semibold mt-1">{stylist?.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-gray">
                  Date & time
                </p>
                <p className="font-semibold mt-1">
                  {date} · {slot && formatAppointmentTime(slot.start_at)}
                </p>
              </div>
            </div>
            <label className="block text-[11px] text-warm-gray mt-5">
              Internal/customer notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-1 block w-full border border-warm-line p-3 text-charcoal"
              />
            </label>
          </div>
        )}

        <div className="flex gap-3 mt-7 pt-5 border-t border-warm-line">
          <button
            disabled={step === 0 || busy}
            onClick={() => setStep((current) => current - 1)}
            className="border border-warm-line px-5 py-3 text-[12px] disabled:opacity-40"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              disabled={!canContinue}
              onClick={() => setStep((current) => current + 1)}
              className="bg-charcoal text-cream px-6 py-3 text-[12px] font-semibold disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => void create()}
              className="bg-charcoal text-cream px-6 py-3 text-[12px] font-semibold disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create appointment"}
            </button>
          )}
        </div>
      </Panel>
    </div>
  )
}
