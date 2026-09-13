import { useEffect, useState } from "react"
import { getSettings, updateSettings } from "../api"
import { ErrorBlock, LoadingBlock, PageHeader, Panel } from "../components"
import type { SalonSettings } from "../types"

export default function SettingsPage({ owner }: { owner: boolean }) {
  const [settings, setSettings] = useState<SalonSettings | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((caught) =>
        setError(
          caught instanceof Error ? caught.message : "Unable to load settings.",
        ),
      )
  }, [])
  const save = async () => {
    if (!settings || !owner) return
    setBusy(true)
    setError("")
    setSaved(false)
    try {
      setSettings(await updateSettings(settings))
      setSaved(true)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save settings.",
      )
    } finally {
      setBusy(false)
    }
  }
  if (!settings && !error)
    return <LoadingBlock label="Loading salon settings" />
  if (!settings) return <ErrorBlock message={error} />
  const field = (
    label: string,
    key: keyof SalonSettings,
    type = "text",
    locked = false,
  ) => (
    <label className="block text-[10px] uppercase tracking-wider text-warm-gray">
      {label}
      <input
        type={type}
        disabled={!owner || locked}
        value={String(settings[key])}
        onChange={(event) =>
          setSettings({
            ...settings,
            [key]:
              type === "number"
                ? Number(event.target.value)
                : event.target.value,
          })
        }
        className="mt-1 w-full border border-warm-line bg-cream p-3 text-[13px] normal-case text-charcoal disabled:opacity-70"
      />
    </label>
  )
  return (
    <div>
      <PageHeader
        title="Business Settings"
        description={
          owner
            ? "Update public salon information and customer booking rules."
            : "Only the owner can change business settings."
        }
      />
      {error && (
        <div className="mb-5">
          <ErrorBlock message={error} />
        </div>
      )}
      {saved && (
        <div className="mb-5 border border-[#a9c0ac] bg-[#f1f7f2] p-4 text-[12px] text-[#315a3a]">
          Settings saved.
        </div>
      )}
      <Panel className="max-w-3xl p-5 lg:p-7">
        <div className="grid sm:grid-cols-2 gap-4">
          {field("Salon name", "salon_name")}
          {field("Phone", "phone")}
          <div className="sm:col-span-2">{field("Address", "address")}</div>
          {field("Booking timezone", "booking_timezone", "text", true)}
          {field("Booking window (days)", "booking_window_days", "number")}
          {field(
            "Minimum lead time (minutes)",
            "minimum_lead_minutes",
            "number",
          )}
          {field(
            "Cancellation notice (hours)",
            "cancellation_notice_hours",
            "number",
            true,
          )}
        </div>
        <p className="text-[11px] text-warm-gray mt-3">
          Timezone and the 24-hour cancellation policy are fixed for the current
          customer experience.
        </p>
        <div className="mt-6 border-t border-warm-line pt-5">
          <p className="text-[11px] uppercase tracking-wider text-warm-gray">
            Security
          </p>
          <p className="text-[12px] text-charcoal-mid mt-2">
            API credentials and authentication secrets are not available in this
            dashboard. Staff access is managed separately through Supabase Auth.
          </p>
        </div>
        {owner && (
          <button
            disabled={busy}
            onClick={() => void save()}
            className="mt-6 bg-charcoal text-cream px-6 py-3 text-[12px] font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save settings"}
          </button>
        )}
      </Panel>
    </div>
  )
}
