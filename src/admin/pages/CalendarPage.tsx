import { useCallback, useEffect, useMemo, useState } from "react"
import { listAppointments } from "../api"
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Panel,
  StatusBadge,
} from "../components"
import {
  adminDateKey,
  dateRangeUtc,
  formatDateKeyLabel,
  monthBounds,
  shiftDateKey,
  startOfWeek,
} from "../time"
import { formatAppointmentTime } from "../../lib/time"
import type { AdminAppointment } from "../types"

type CalendarView = "day" | "week" | "month"

export default function CalendarPage({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const [view, setView] = useState<CalendarView>("week")
  const [focusDate, setFocusDate] = useState(adminDateKey())
  const [appointments, setAppointments] = useState<AdminAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const period = useMemo(() => {
    if (view === "day")
      return {
        start: focusDate,
        end: shiftDateKey(focusDate, 1),
        gridStart: focusDate,
        days: 1,
      }
    if (view === "week") {
      const start = startOfWeek(focusDate)
      return { start, end: shiftDateKey(start, 7), gridStart: start, days: 7 }
    }
    const month = monthBounds(focusDate)
    const gridStart = startOfWeek(month.start)
    return { ...month, gridStart, days: 42 }
  }, [focusDate, view])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const queryStart = view === "month" ? period.gridStart : period.start
      const queryEnd =
        view === "month" ? shiftDateKey(period.gridStart, 42) : period.end
      const bounds = dateRangeUtc(queryStart, queryEnd)
      setAppointments(
        await listAppointments({ startAt: bounds.start, endAt: bounds.end }),
      )
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load calendar.",
      )
    } finally {
      setLoading(false)
    }
  }, [period, view])
  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(
    () =>
      appointments.reduce<Record<string, AdminAppointment[]>>(
        (result, appointment) => {
          const key = adminDateKey(new Date(appointment.start_at))
          ;(result[key] ??= []).push(appointment)
          return result
        },
        {},
      ),
    [appointments],
  )
  const dates = Array.from({ length: period.days }, (_, index) =>
    shiftDateKey(period.gridStart, index),
  )
  const move = (direction: number) =>
    setFocusDate((current) =>
      shiftDateKey(
        current,
        direction * (view === "day" ? 1 : view === "week" ? 7 : 28),
      ),
    )

  const AppointmentCard = ({
    appointment,
  }: {
    appointment: AdminAppointment
  }) => (
    <button
      onClick={() => navigate(`/admin/appointments/${appointment.id}`)}
      className="w-full text-left border-l-2 border-bronze bg-cream-dark p-2 hover:bg-taupe transition-colors"
    >
      <p className="text-[10px] font-semibold">
        {formatAppointmentTime(appointment.start_at)} –{" "}
        {formatAppointmentTime(appointment.end_at)}
      </p>
      <p className="text-[11px] font-medium truncate mt-1">
        {appointment.customer.first_name} — {appointment.service.name}
      </p>
      <p className="text-[10px] text-warm-gray truncate">
        {appointment.stylist.name} · {appointment.status.replace("_", " ")}
      </p>
    </button>
  )

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Live appointment schedule from the shared booking database."
        action={
          <button
            onClick={() => navigate("/admin/appointments/new")}
            className="bg-charcoal text-cream px-5 py-3 text-[13px] font-semibold"
          >
            + New Appointment
          </button>
        }
      />
      <Panel className="p-3 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex border border-warm-line">
            {(["day", "week", "month"] as CalendarView[]).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`px-4 py-2 text-[12px] capitalize ${
                  view === item
                    ? "bg-charcoal text-cream"
                    : "hover:bg-cream-dark"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => move(-1)}
              className="h-9 w-9 border border-warm-line"
              aria-label="Previous period"
            >
              ←
            </button>
            <button
              onClick={() => setFocusDate(adminDateKey())}
              className="h-9 px-4 border border-warm-line text-[12px]"
            >
              Today
            </button>
            <button
              onClick={() => move(1)}
              className="h-9 w-9 border border-warm-line"
              aria-label="Next period"
            >
              →
            </button>
          </div>
        </div>
      </Panel>
      {error && <ErrorBlock message={error} retry={load} />}
      {loading && <LoadingBlock label="Loading calendar" />}
      {!loading && !error && (
        <>
          <div className="md:hidden space-y-4">
            {dates
              .filter(
                (date) => (grouped[date]?.length ?? 0) > 0 || view === "day",
              )
              .map((date) => (
                <Panel key={date}>
                  <div className="px-4 py-3 border-b border-warm-line flex justify-between">
                    <p className="font-semibold text-[13px]">
                      {formatDateKeyLabel(date, {
                        weekday: "long",
                        month: "long",
                      })}
                    </p>
                    <span className="text-[11px] text-warm-gray">
                      {grouped[date]?.length ?? 0}
                    </span>
                  </div>
                  {grouped[date]?.length ? (
                    grouped[date].map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-3 border-b border-warm-line last:border-0"
                      >
                        <AppointmentCard appointment={appointment} />
                      </div>
                    ))
                  ) : (
                    <p className="p-5 text-[12px] text-warm-gray">
                      No appointments.
                    </p>
                  )}
                </Panel>
              ))}
            {appointments.length === 0 && view !== "day" && (
              <Panel className="p-8 text-center text-[12px] text-warm-gray">
                No appointments in this period.
              </Panel>
            )}
          </div>

          {view === "day" && (
            <Panel className="hidden md:block">
              <div className="p-5 border-b border-warm-line">
                <h2 className="font-serif text-xl">
                  {formatDateKeyLabel(focusDate, {
                    weekday: "long",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {grouped[focusDate]?.length ? (
                  grouped[focusDate].map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))
                ) : (
                  <p className="p-8 text-center text-[12px] text-warm-gray">
                    No appointments.
                  </p>
                )}
              </div>
            </Panel>
          )}

          {view === "week" && (
            <Panel className="hidden md:grid grid-cols-7 overflow-hidden">
              {dates.map((date) => (
                <div
                  key={date}
                  className="min-h-[520px] border-r border-warm-line last:border-r-0"
                >
                  <div
                    className={`p-3 text-center border-b border-warm-line ${
                      date === adminDateKey()
                        ? "bg-bronze text-white"
                        : "bg-cream-dark"
                    }`}
                  >
                    <p className="text-[10px] uppercase">
                      {formatDateKeyLabel(date, {
                        weekday: "short",
                        month: undefined,
                        day: undefined,
                      })}
                    </p>
                    <p className="font-serif text-xl mt-1">
                      {Number(date.slice(-2))}
                    </p>
                  </div>
                  <div className="p-2 space-y-2">
                    {(grouped[date] ?? []).map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </Panel>
          )}

          {view === "month" && (
            <Panel className="hidden md:block overflow-hidden">
              <div className="grid grid-cols-7 bg-cream-dark border-b border-warm-line">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-[10px] uppercase tracking-wider text-warm-gray"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-7">
                {dates.map((date) => {
                  const inMonth = date.slice(0, 7) === focusDate.slice(0, 7)
                  return (
                    <div
                      key={date}
                      className={`min-h-28 border-r border-b border-warm-line p-2 ${
                        inMonth ? "bg-white" : "bg-cream/60"
                      }`}
                    >
                      <p
                        className={`text-[11px] font-semibold ${
                          date === adminDateKey()
                            ? "text-bronze"
                            : inMonth
                              ? "text-charcoal"
                              : "text-warm-gray"
                        }`}
                      >
                        {Number(date.slice(-2))}
                      </p>
                      <div className="mt-2 space-y-1">
                        {(grouped[date] ?? [])
                          .slice(0, 3)
                          .map((appointment) => (
                            <button
                              key={appointment.id}
                              onClick={() =>
                                navigate(
                                  `/admin/appointments/${appointment.id}`,
                                )
                              }
                              className="w-full text-left text-[9px] bg-cream-dark px-1.5 py-1 truncate"
                            >
                              {formatAppointmentTime(appointment.start_at)}{" "}
                              {appointment.customer.first_name}
                            </button>
                          ))}
                        {(grouped[date]?.length ?? 0) > 3 && (
                          <p className="text-[9px] text-warm-gray">
                            +{grouped[date].length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  )
}
