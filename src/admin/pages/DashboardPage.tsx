import { useCallback, useEffect, useState } from "react"
import { getDashboard } from "../api"
import {
  AppointmentRow,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Panel,
} from "../components"
import { adminDateKey } from "../time"
import type { DashboardData } from "../types"

export default function DashboardPage({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setError("")
    try {
      setData(await getDashboard(adminDateKey()))
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load today's schedule.",
      )
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 30000)
    return () => window.clearInterval(timer)
  }, [load])

  return (
    <div>
      <PageHeader
        eyebrow="Today"
        title="Salon overview"
        description="Appointments and operational status refresh automatically every 30 seconds."
        action={
          <button
            onClick={() => navigate("/admin/appointments/new")}
            className="bg-charcoal text-cream px-5 py-3 text-[13px] font-semibold hover:bg-bronze"
          >
            + New Appointment
          </button>
        }
      />
      {error && <ErrorBlock message={error} retry={load} />}
      {!data && !error && <LoadingBlock label="Loading today's appointments" />}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-7">
            {[
              ["Appointments Today", data.appointments_today],
              ["Upcoming", data.upcoming],
              ["Completed Today", data.completed_today],
              ["Cancelled", data.cancelled_today],
              ["No-shows", data.no_shows_today],
            ].map(([label, value]) => (
              <Panel key={label} className="p-4 lg:p-5">
                <p className="text-[10px] uppercase tracking-[0.13em] text-warm-gray min-h-8">
                  {label}
                </p>
                <p className="font-serif text-3xl text-charcoal mt-2">
                  {value}
                </p>
              </Panel>
            ))}
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
            <Panel>
              <div className="px-5 py-4 border-b border-warm-line flex items-center justify-between">
                <h2 className="font-serif text-xl">
                  Today&apos;s Appointments
                </h2>
                <button
                  onClick={load}
                  className="text-[11px] text-bronze underline"
                >
                  Refresh
                </button>
              </div>
              {data.appointments.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="font-serif text-xl">No appointments today</p>
                  <p className="text-[12px] text-warm-gray mt-2">
                    The schedule is clear.
                  </p>
                </div>
              ) : (
                data.appointments.map((appointment) => (
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
            <div className="space-y-4">
              <Panel className="p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-bronze font-semibold">
                  Quick actions
                </p>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => navigate("/admin/appointments/new")}
                    className="w-full bg-charcoal text-cream px-4 py-3 text-[12px] font-semibold"
                  >
                    Create appointment
                  </button>
                  <button
                    onClick={() => navigate("/admin/calendar")}
                    className="w-full border border-warm-line px-4 py-3 text-[12px] font-semibold hover:border-charcoal"
                  >
                    Open calendar
                  </button>
                  <button
                    onClick={() => navigate("/admin/availability")}
                    className="w-full border border-warm-line px-4 py-3 text-[12px] font-semibold hover:border-charcoal"
                  >
                    Block time
                  </button>
                </div>
              </Panel>
              <Panel className="p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-warm-gray font-semibold">
                  Privacy
                </p>
                <p className="text-[12px] text-charcoal-mid leading-relaxed mt-3">
                  Customer details are private. Always log out on shared salon
                  devices.
                </p>
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
