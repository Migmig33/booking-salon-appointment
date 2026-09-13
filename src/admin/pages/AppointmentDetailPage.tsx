import { useCallback, useEffect, useState } from "react"
import {
  getAdminSlots,
  getAppointment,
  getReferenceData,
  rescheduleAdminAppointment,
  updateAppointmentStatus,
} from "../api"
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Panel,
  StatusBadge,
} from "../components"
import { adminDateKey, minutesLabel, shiftDateKey } from "../time"
import { formatAppointmentDate, formatAppointmentTime } from "../../lib/time"
import type {
  AdminAppointment,
  AdminAppointmentStatus,
  AdminSlot,
  ReferenceData,
} from "../types"

function Detail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="py-3 border-b border-warm-line last:border-0">
      <p className="text-[10px] uppercase tracking-[0.13em] text-warm-gray mb-1">
        {label}
      </p>
      <div className="text-[13px] font-medium text-charcoal">{children}</div>
    </div>
  )
}

export default function AppointmentDetailPage({
  id,
  navigate,
}: {
  id: string
  navigate: (path: string) => void
}) {
  const [appointment, setAppointment] = useState<AdminAppointment | null>(null)
  const [references, setReferences] = useState<ReferenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [confirmStatus, setConfirmStatus] =
    useState<AdminAppointmentStatus | null>(null)
  const [rescheduling, setRescheduling] = useState(false)
  const [date, setDate] = useState(adminDateKey())
  const [stylistId, setStylistId] = useState("")
  const [slots, setSlots] = useState<AdminSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [nextAppointment, nextReferences] = await Promise.all([
        getAppointment(id),
        getReferenceData(),
      ])
      setAppointment(nextAppointment)
      setReferences(nextReferences)
      setStylistId(nextAppointment.stylist.id)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load appointment.",
      )
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    void load()
  }, [load])

  const loadSlots = async () => {
    if (!appointment) return
    setSlotsLoading(true)
    setError("")
    try {
      setSlots(
        await getAdminSlots({
          serviceId: appointment.service.id,
          addonIds: appointment.addons.map((addon) => addon.id),
          stylistId: stylistId || null,
          date,
          appointmentId: appointment.id,
        }),
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load available times.",
      )
    } finally {
      setSlotsLoading(false)
    }
  }
  useEffect(() => {
    if (rescheduling && appointment) void loadSlots()
  }, [date, stylistId, rescheduling])

  const setStatus = async (status: AdminAppointmentStatus) => {
    if (!appointment) return
    setBusy(true)
    setError("")
    try {
      setAppointment(await updateAppointmentStatus(appointment.id, status))
      setConfirmStatus(null)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update appointment.",
      )
    } finally {
      setBusy(false)
    }
  }

  const reschedule = async (slot: AdminSlot) => {
    if (!appointment) return
    setBusy(true)
    setError("")
    try {
      setAppointment(
        await rescheduleAdminAppointment(
          appointment.id,
          slot.start_at,
          slot.stylist_id,
        ),
      )
      setRescheduling(false)
      setSlots([])
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reschedule appointment.",
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingBlock label="Loading appointment" />
  if (error && !appointment) return <ErrorBlock message={error} retry={load} />
  if (!appointment) return null
  const active = ["confirmed", "checked_in", "rescheduled"].includes(
    appointment.status,
  )
  const compatibleStylists =
    references?.stylists.filter(
      (stylist) =>
        stylist.active && stylist.service_ids.includes(appointment.service.id),
    ) ?? []

  return (
    <div>
      <button
        onClick={() => navigate("/admin/appointments")}
        className="text-[12px] text-warm-gray hover:text-charcoal mb-5"
      >
        ← All appointments
      </button>
      <PageHeader
        eyebrow={appointment.booking_reference}
        title={`${appointment.customer.first_name} ${appointment.customer.last_name}`}
        action={<StatusBadge status={appointment.status} />}
      />
      {error && (
        <div className="mb-5">
          <ErrorBlock message={error} />
        </div>
      )}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <Panel className="p-5 lg:p-7">
          <h2 className="font-serif text-xl mb-4">Appointment details</h2>
          <div className="grid sm:grid-cols-2 gap-x-8">
            <Detail label="Service">{appointment.service.name}</Detail>
            <Detail label="Stylist">{appointment.stylist.name}</Detail>
            <Detail label="Date">
              {formatAppointmentDate(appointment.start_at)}
            </Detail>
            <Detail label="Time">
              {formatAppointmentTime(appointment.start_at)} –{" "}
              {formatAppointmentTime(appointment.end_at)}
            </Detail>
            <Detail label="Duration">
              {minutesLabel(appointment.duration_minutes)}
            </Detail>
            <Detail label="Created">
              {new Date(appointment.created_at).toLocaleString()}
            </Detail>
            <Detail label="Add-ons">
              {appointment.addons.length
                ? appointment.addons.map((addon) => addon.name).join(", ")
                : "None"}
            </Detail>
            <Detail label="Status">
              <StatusBadge status={appointment.status} />
            </Detail>
          </div>
          <Detail label="Customer notes">
            {appointment.customer_notes || "No notes"}
          </Detail>
        </Panel>
        <div className="space-y-5">
          <Panel className="p-5">
            <h2 className="font-serif text-lg mb-3">Customer</h2>
            <p className="text-[14px] font-medium">
              {appointment.customer.first_name} {appointment.customer.last_name}
            </p>
            <a
              href={`tel:${appointment.customer.phone}`}
              className="block text-[12px] text-bronze mt-2"
            >
              {appointment.customer.phone}
            </a>
            <a
              href={`mailto:${appointment.customer.email}`}
              className="block text-[12px] text-bronze mt-1 break-all"
            >
              {appointment.customer.email}
            </a>
            <button
              onClick={() =>
                navigate(`/admin/customers/${appointment.customer.id}`)
              }
              className="text-[11px] underline mt-4"
            >
              View customer history
            </button>
          </Panel>
          {active && (
            <Panel className="p-5">
              <h2 className="font-serif text-lg mb-4">Actions</h2>
              <div className="grid gap-2">
                {appointment.status !== "checked_in" && (
                  <button
                    disabled={busy}
                    onClick={() => void setStatus("checked_in")}
                    className="bg-charcoal text-cream py-2.5 text-[12px] font-semibold disabled:opacity-50"
                  >
                    Mark checked in
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => void setStatus("completed")}
                  className="border border-warm-line py-2.5 text-[12px] font-semibold hover:border-charcoal disabled:opacity-50"
                >
                  Mark completed
                </button>
                <button
                  disabled={busy}
                  onClick={() => setRescheduling(true)}
                  className="border border-warm-line py-2.5 text-[12px] font-semibold hover:border-charcoal disabled:opacity-50"
                >
                  Reschedule
                </button>
                <button
                  disabled={busy}
                  onClick={() => setConfirmStatus("no_show")}
                  className="border border-warm-line py-2.5 text-[12px] font-semibold hover:border-charcoal disabled:opacity-50"
                >
                  Mark no-show
                </button>
                <button
                  disabled={busy}
                  onClick={() => setConfirmStatus("cancelled")}
                  className="border border-[#caa59e] text-[#7a3229] py-2.5 text-[12px] font-semibold disabled:opacity-50"
                >
                  Cancel appointment
                </button>
              </div>
            </Panel>
          )}
        </div>
      </div>

      {confirmStatus && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/50 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <Panel className="w-full max-w-md p-6 shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.15em] text-bronze font-semibold">
              Confirm action
            </p>
            <h2 className="font-serif text-2xl mt-2">
              {confirmStatus === "cancelled"
                ? "Cancel this appointment?"
                : "Mark as no-show?"}
            </h2>
            <p className="text-[14px] mt-4">
              {appointment.customer.first_name} {appointment.customer.last_name}
            </p>
            <p className="text-[12px] text-warm-gray mt-1">
              {appointment.service.name} ·{" "}
              {formatAppointmentDate(appointment.start_at)} ·{" "}
              {formatAppointmentTime(appointment.start_at)}
            </p>
            <div className="flex gap-3 mt-7">
              <button
                disabled={busy}
                onClick={() => setConfirmStatus(null)}
                className="flex-1 border border-warm-line py-3 text-[12px] font-semibold"
              >
                Keep appointment
              </button>
              <button
                disabled={busy}
                onClick={() => void setStatus(confirmStatus)}
                className="flex-1 bg-charcoal text-cream py-3 text-[12px] font-semibold disabled:opacity-50"
              >
                {busy
                  ? "Updating…"
                  : confirmStatus === "cancelled"
                    ? "Cancel appointment"
                    : "Mark no-show"}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {rescheduling && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/50 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <Panel className="w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-bronze font-semibold">
                  Actual availability
                </p>
                <h2 className="font-serif text-2xl mt-2">
                  Reschedule appointment
                </h2>
              </div>
              <button
                onClick={() => setRescheduling(false)}
                className="text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <label className="text-[11px] text-warm-gray">
                Date
                <input
                  type="date"
                  min={adminDateKey()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 block w-full border border-warm-line p-3 text-charcoal"
                />
              </label>
              <label className="text-[11px] text-warm-gray">
                Stylist
                <select
                  value={stylistId}
                  onChange={(event) => setStylistId(event.target.value)}
                  className="mt-1 block w-full border border-warm-line p-3 text-charcoal"
                >
                  <option value="">Any available</option>
                  {compatibleStylists.map((stylist) => (
                    <option key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-wider text-warm-gray mb-3">
                Available times
              </p>
              {slotsLoading ? (
                <p className="text-[12px] text-warm-gray">
                  Checking availability…
                </p>
              ) : slots.length === 0 ? (
                <p className="text-[12px] text-warm-gray">
                  No available times for this date.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      disabled={busy}
                      key={`${slot.start_at}-${slot.stylist_id}`}
                      onClick={() => void reschedule(slot)}
                      className="border border-warm-line p-3 text-[12px] hover:border-bronze hover:text-bronze"
                    >
                      <span className="block font-semibold">
                        {formatAppointmentTime(slot.start_at)}
                      </span>
                      <span className="text-[10px] text-warm-gray">
                        {slot.stylist_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
