import { useCallback, useEffect, useState } from "react"
import { listAppointments } from "../api"
import {
  AppointmentRow,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Panel,
} from "../components"
import { adminDateKey, dateRangeUtc, shiftDateKey } from "../time"
import type { AdminAppointment } from "../types"

export default function AppointmentsPage({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [range, setRange] = useState("upcoming")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const today = adminDateKey()
      const bounds =
        range === "today" ? dateRangeUtc(today, shiftDateKey(today, 1)) : null
      setAppointments(
        await listAppointments({
          startAt:
            bounds?.start ??
            (range === "upcoming" ? new Date().toISOString() : null),
          endAt: bounds?.end ?? null,
          status: status || null,
          query: query || null,
        }),
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load appointments.",
      )
    } finally {
      setLoading(false)
    }
  }, [query, range, status])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200)
    return () => window.clearTimeout(timer)
  }, [load])

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Search by customer, phone, email, or booking reference."
        action={
          <button
            onClick={() => navigate("/admin/appointments/new")}
            className="bg-charcoal text-cream px-5 py-3 text-[13px] font-semibold"
          >
            + New Appointment
          </button>
        }
      />
      <Panel className="p-4 mb-5">
        <div className="grid sm:grid-cols-[minmax(220px,1fr)_160px_160px] gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search appointments"
            className="border border-warm-line bg-cream px-3 py-2.5 text-[13px] outline-none focus:border-bronze"
          />
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="border border-warm-line bg-cream px-3 py-2.5 text-[13px]"
          >
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="all">All dates</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border border-warm-line bg-cream px-3 py-2.5 text-[13px]"
          >
            <option value="">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked in</option>
            <option value="completed">Completed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-show</option>
          </select>
        </div>
      </Panel>
      {loading && <LoadingBlock label="Loading appointments" />}
      {error && <ErrorBlock message={error} retry={load} />}
      {!loading && !error && (
        <Panel>
          <div className="px-5 py-3 border-b border-warm-line text-[11px] text-warm-gray">
            {appointments.length} appointment
            {appointments.length === 1 ? "" : "s"}
          </div>
          {appointments.length === 0 ? (
            <p className="p-8 text-center text-[13px] text-warm-gray">
              No appointments match these filters.
            </p>
          ) : (
            appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onClick={() =>
                  navigate(`/admin/appointments/${appointment.id}`)
                }
              />
            ))
          )}
        </Panel>
      )}
    </div>
  )
}
