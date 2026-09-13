import { useCallback, useEffect, useState } from "react"
import {
  createBlockedTime,
  deleteAvailability,
  deleteBlockedTime,
  getAvailability,
  getReferenceData,
  saveAvailability,
} from "../api"
import { ErrorBlock, LoadingBlock, PageHeader, Panel } from "../components"
import {
  adminDateKey,
  formatAdminDate,
  formatAdminTime,
  localInputToUtc,
  shiftDateKey,
} from "../time"
import type { AvailabilityData, ReferenceData } from "../types"

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export default function AvailabilityPage() {
  const [data, setData] = useState<AvailabilityData | null>(null)
  const [references, setReferences] = useState<ReferenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [schedule, setSchedule] = useState({
    stylistId: "",
    day: 1,
    start: "09:00",
    end: "18:00",
  })
  const [block, setBlock] = useState({
    stylistId: "",
    startDate: adminDateKey(),
    endDate: adminDateKey(),
    startTime: "09:00",
    endTime: "17:00",
    fullDay: false,
    reason: "Unavailable",
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [nextData, nextReferences] = await Promise.all([
        getAvailability(),
        getReferenceData(),
      ])
      setData(nextData)
      setReferences(nextReferences)
      if (!schedule.stylistId && nextReferences.stylists[0])
        setSchedule((current) => ({
          ...current,
          stylistId: nextReferences.stylists[0].id,
        }))
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load availability.",
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const addSchedule = async () => {
    setBusy(true)
    setError("")
    try {
      await saveAvailability({
        stylistId: schedule.stylistId,
        dayOfWeek: schedule.day,
        startTime: schedule.start,
        endTime: schedule.end,
      })
      setScheduleOpen(false)
      await load()
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save working hours.",
      )
    } finally {
      setBusy(false)
    }
  }
  const addBlock = async () => {
    setBusy(true)
    setError("")
    try {
      const startValue = block.fullDay
        ? `${block.startDate}T00:00`
        : `${block.startDate}T${block.startTime}`
      const endValue = block.fullDay
        ? `${shiftDateKey(block.endDate, 1)}T00:00`
        : `${block.endDate}T${block.endTime}`
      await createBlockedTime({
        stylistId: block.stylistId || null,
        startAt: localInputToUtc(startValue),
        endAt: localInputToUtc(endValue),
        reason: block.reason,
      })
      setBlockOpen(false)
      await load()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to block time.",
      )
    } finally {
      setBusy(false)
    }
  }
  const removeSchedule = async (id: string) => {
    if (!window.confirm("Remove these working hours?")) return
    await deleteAvailability(id)
    await load()
  }
  const removeBlock = async (id: string) => {
    if (!window.confirm("Remove this blocked time?")) return
    await deleteBlockedTime(id)
    await load()
  }

  if (loading) return <LoadingBlock label="Loading availability" />
  return (
    <div>
      <PageHeader
        title="Availability"
        description="Working hours and blocked time immediately affect customer and staff booking availability."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setScheduleOpen(true)}
              className="border border-warm-line px-4 py-3 text-[12px] font-semibold"
            >
              + Working hours
            </button>
            <button
              onClick={() => setBlockOpen(true)}
              className="bg-charcoal text-cream px-4 py-3 text-[12px] font-semibold"
            >
              + Block time
            </button>
          </div>
        }
      />
      {error && (
        <div className="mb-5">
          <ErrorBlock message={error} retry={load} />
        </div>
      )}
      <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        <div className="space-y-5">
          {references?.stylists.map((stylist) => (
            <Panel key={stylist.id}>
              <div className="p-4 border-b border-warm-line flex justify-between">
                <h2 className="font-serif text-lg">{stylist.name}</h2>
                <span className="text-[10px] uppercase text-warm-gray">
                  {stylist.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="divide-y divide-warm-line">
                {days.map((day, index) => {
                  const entries =
                    data?.schedules.filter(
                      (item) =>
                        item.stylist_id === stylist.id &&
                        item.day_of_week === index,
                    ) ?? []
                  return (
                    <div
                      key={day}
                      className="grid grid-cols-[100px_1fr] gap-3 p-3 text-[12px]"
                    >
                      <span className="font-semibold">{day}</span>
                      <div>
                        {entries.length === 0 ? (
                          <span className="text-warm-gray">Closed</span>
                        ) : (
                          entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex justify-between gap-3"
                            >
                              <span>
                                {entry.start_time.slice(0, 5)} –{" "}
                                {entry.end_time.slice(0, 5)}
                              </span>
                              <button
                                onClick={() => void removeSchedule(entry.id)}
                                className="text-[#7a3229] text-[10px]"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          ))}
        </div>
        <Panel className="h-fit">
          <div className="p-4 border-b border-warm-line">
            <h2 className="font-serif text-lg">Blocked time</h2>
            <p className="text-[11px] text-warm-gray mt-1">
              Reasons remain internal.
            </p>
          </div>
          <div className="max-h-[620px] overflow-auto">
            {data?.blocked_times.length === 0 ? (
              <p className="p-5 text-[12px] text-warm-gray">
                No current blocks.
              </p>
            ) : (
              data?.blocked_times.map((item) => (
                <div key={item.id} className="p-4 border-b border-warm-line">
                  <div className="flex justify-between gap-3">
                    <p className="text-[12px] font-semibold">
                      {item.stylist_name}
                    </p>
                    <button
                      onClick={() => void removeBlock(item.id)}
                      className="text-[10px] text-[#7a3229]"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-[11px] mt-2">
                    {formatAdminDate(item.start_at, true)} ·{" "}
                    {formatAdminTime(item.start_at)} –{" "}
                    {formatAdminDate(item.end_at, true)} ·{" "}
                    {formatAdminTime(item.end_at)}
                  </p>
                  <p className="text-[11px] text-warm-gray mt-1">
                    {item.reason || "Unavailable"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {scheduleOpen && references && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 p-4 flex items-center justify-center">
          <Panel className="w-full max-w-md p-6">
            <div className="flex justify-between">
              <h2 className="font-serif text-2xl">Add working hours</h2>
              <button onClick={() => setScheduleOpen(false)}>×</button>
            </div>
            <div className="space-y-3 mt-5">
              <label className="block text-[10px] uppercase text-warm-gray">
                Stylist
                <select
                  value={schedule.stylistId}
                  onChange={(event) =>
                    setSchedule({ ...schedule, stylistId: event.target.value })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-charcoal normal-case"
                >
                  {references.stylists.map((stylist) => (
                    <option key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] uppercase text-warm-gray">
                Day
                <select
                  value={schedule.day}
                  onChange={(event) =>
                    setSchedule({
                      ...schedule,
                      day: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-charcoal normal-case"
                >
                  {days.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[10px] uppercase text-warm-gray">
                  Start
                  <input
                    type="time"
                    value={schedule.start}
                    onChange={(event) =>
                      setSchedule({ ...schedule, start: event.target.value })
                    }
                    className="mt-1 w-full border border-warm-line p-3 text-charcoal"
                  />
                </label>
                <label className="text-[10px] uppercase text-warm-gray">
                  End
                  <input
                    type="time"
                    value={schedule.end}
                    onChange={(event) =>
                      setSchedule({ ...schedule, end: event.target.value })
                    }
                    className="mt-1 w-full border border-warm-line p-3 text-charcoal"
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setScheduleOpen(false)}
                className="border border-warm-line px-5 py-3 text-[12px]"
              >
                Cancel
              </button>
              <button
                disabled={busy || !schedule.stylistId}
                onClick={() => void addSchedule()}
                className="bg-charcoal text-cream px-6 py-3 text-[12px] font-semibold disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </Panel>
        </div>
      )}

      {blockOpen && references && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 p-4 flex items-center justify-center">
          <Panel className="w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between">
              <h2 className="font-serif text-2xl">Block time</h2>
              <button onClick={() => setBlockOpen(false)}>×</button>
            </div>
            <div className="space-y-3 mt-5">
              <label className="block text-[10px] uppercase text-warm-gray">
                Who is unavailable?
                <select
                  value={block.stylistId}
                  onChange={(event) =>
                    setBlock({ ...block, stylistId: event.target.value })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-charcoal normal-case"
                >
                  <option value="">Entire salon</option>
                  {references.stylists.map((stylist) => (
                    <option key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={block.fullDay}
                  onChange={(event) =>
                    setBlock({ ...block, fullDay: event.target.checked })
                  }
                />
                Full-day closure / date range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[10px] uppercase text-warm-gray">
                  Start date
                  <input
                    type="date"
                    value={block.startDate}
                    onChange={(event) =>
                      setBlock({
                        ...block,
                        startDate: event.target.value,
                        endDate:
                          event.target.value > block.endDate
                            ? event.target.value
                            : block.endDate,
                      })
                    }
                    className="mt-1 w-full border border-warm-line p-3 text-charcoal"
                  />
                </label>
                <label className="text-[10px] uppercase text-warm-gray">
                  End date
                  <input
                    type="date"
                    min={block.startDate}
                    value={block.endDate}
                    onChange={(event) =>
                      setBlock({ ...block, endDate: event.target.value })
                    }
                    className="mt-1 w-full border border-warm-line p-3 text-charcoal"
                  />
                </label>
              </div>
              {!block.fullDay && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px] uppercase text-warm-gray">
                    Start time
                    <input
                      type="time"
                      value={block.startTime}
                      onChange={(event) =>
                        setBlock({ ...block, startTime: event.target.value })
                      }
                      className="mt-1 w-full border border-warm-line p-3 text-charcoal"
                    />
                  </label>
                  <label className="text-[10px] uppercase text-warm-gray">
                    End time
                    <input
                      type="time"
                      value={block.endTime}
                      onChange={(event) =>
                        setBlock({ ...block, endTime: event.target.value })
                      }
                      className="mt-1 w-full border border-warm-line p-3 text-charcoal"
                    />
                  </label>
                </div>
              )}
              <label className="block text-[10px] uppercase text-warm-gray">
                Internal reason
                <input
                  value={block.reason}
                  onChange={(event) =>
                    setBlock({ ...block, reason: event.target.value })
                  }
                  placeholder="Lunch, vacation, salon closed…"
                  className="mt-1 w-full border border-warm-line p-3 text-charcoal normal-case"
                />
              </label>
            </div>
            <p className="text-[11px] text-warm-gray mt-4">
              Customers only see these times as unavailable; the reason is never
              exposed.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setBlockOpen(false)}
                className="border border-warm-line px-5 py-3 text-[12px]"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => void addBlock()}
                className="bg-charcoal text-cream px-6 py-3 text-[12px] font-semibold disabled:opacity-50"
              >
                Block time
              </button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}
