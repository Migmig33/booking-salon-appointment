import { useCallback, useEffect, useState } from "react"
import { getReferenceData, saveService, saveStylist } from "../api"
import { ErrorBlock, LoadingBlock, PageHeader, Panel } from "../components"
import type { AdminService, AdminStylist, ReferenceData } from "../types"

const emptyService = {
  id: null as string | null,
  name: "",
  description: "",
  duration_minutes: 60,
  price_display: "Price confirmed by salon",
  category: "cuts",
  active: true,
  addon_ids: [] as string[],
  stylist_ids: [] as string[],
}
const emptyStylist = {
  id: null as string | null,
  name: "",
  bio: "",
  image_url: "",
  active: true,
  service_ids: [] as string[],
}

function useReferences() {
  const [data, setData] = useState<ReferenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setData(await getReferenceData())
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load catalog.",
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  return { data, loading, error, setError, load }
}

export function ServicesPage({ owner }: { owner: boolean }) {
  const { data, loading, error, setError, load } = useReferences()
  const [editing, setEditing] = useState<typeof emptyService | null>(null)
  const [busy, setBusy] = useState(false)
  const edit = (service: AdminService) =>
    setEditing({
      id: service.id,
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      price_display: service.price_display,
      category: service.category,
      active: service.active,
      addon_ids: service.addon_ids,
      stylist_ids: service.stylist_ids,
    })
  const save = async () => {
    if (!editing) return
    setBusy(true)
    setError("")
    try {
      await saveService({
        id: editing.id,
        name: editing.name,
        description: editing.description,
        durationMinutes: editing.duration_minutes,
        priceDisplay: editing.price_display,
        category: editing.category,
        active: editing.active,
        addonIds: editing.addon_ids,
        stylistIds: editing.stylist_ids,
      })
      setEditing(null)
      await load()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save service.",
      )
    } finally {
      setBusy(false)
    }
  }
  if (loading) return <LoadingBlock label="Loading services" />
  return (
    <div>
      <PageHeader
        title="Services"
        description={
          owner
            ? "Manage duration, pricing text, availability, add-ons, and stylist assignments."
            : "Service catalog is read-only for manager accounts."
        }
        action={
          owner ? (
            <button
              onClick={() => setEditing({ ...emptyService })}
              className="bg-charcoal text-cream px-5 py-3 text-[13px] font-semibold"
            >
              + Add Service
            </button>
          ) : undefined
        }
      />
      {error && (
        <div className="mb-5">
          <ErrorBlock message={error} retry={load} />
        </div>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.services.map((service) => (
          <Panel
            key={service.id}
            className={`p-5 ${service.active ? "" : "opacity-60"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-bronze">
                  {service.category}
                </p>
                <h2 className="font-serif text-lg mt-1">{service.name}</h2>
              </div>
              <span className="text-[10px] uppercase text-warm-gray">
                {service.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-[12px] text-warm-gray leading-relaxed mt-3 min-h-12">
              {service.description}
            </p>
            <p className="text-[12px] mt-4">
              {service.duration_minutes} min · {service.price_display}
            </p>
            <p className="text-[10px] text-warm-gray mt-2">
              {service.stylist_ids.length} stylist
              {service.stylist_ids.length === 1 ? "" : "s"} ·{" "}
              {service.addon_ids.length} add-on
              {service.addon_ids.length === 1 ? "" : "s"}
            </p>
            {owner && (
              <button
                onClick={() => edit(service)}
                className="mt-4 text-[12px] text-bronze underline"
              >
                Edit service
              </button>
            )}
          </Panel>
        ))}
      </div>
      {editing && data && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 p-4 flex justify-center items-center">
          <Panel className="w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between">
              <h2 className="font-serif text-2xl">
                {editing.id ? "Edit Service" : "Add Service"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-xl">
                ×
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <label className="text-[10px] uppercase text-warm-gray">
                Name
                <input
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
                />
              </label>
              <label className="text-[10px] uppercase text-warm-gray">
                Category
                <input
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({ ...editing, category: event.target.value })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
                />
              </label>
              <label className="text-[10px] uppercase text-warm-gray">
                Duration minutes
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={editing.duration_minutes}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      duration_minutes: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
                />
              </label>
              <label className="text-[10px] uppercase text-warm-gray">
                Display price
                <input
                  value={editing.price_display}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      price_display: event.target.value,
                    })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
                />
              </label>
            </div>
            <label className="block text-[10px] uppercase text-warm-gray mt-3">
              Description
              <textarea
                rows={3}
                value={editing.description}
                onChange={(event) =>
                  setEditing({ ...editing, description: event.target.value })
                }
                className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
              />
            </label>
            <div className="grid sm:grid-cols-2 gap-5 mt-5">
              <div>
                <p className="text-[10px] uppercase text-warm-gray mb-2">
                  Compatible add-ons
                </p>
                {data.addons.map((addon) => (
                  <label key={addon.id} className="flex gap-2 text-[12px] py-1">
                    <input
                      type="checkbox"
                      checked={editing.addon_ids.includes(addon.id)}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          addon_ids: event.target.checked
                            ? [...editing.addon_ids, addon.id]
                            : editing.addon_ids.filter((id) => id !== addon.id),
                        })
                      }
                    />
                    {addon.name}
                  </label>
                ))}
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-gray mb-2">
                  Available stylists
                </p>
                {data.stylists.map((stylist) => (
                  <label
                    key={stylist.id}
                    className="flex gap-2 text-[12px] py-1"
                  >
                    <input
                      type="checkbox"
                      checked={editing.stylist_ids.includes(stylist.id)}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          stylist_ids: event.target.checked
                            ? [...editing.stylist_ids, stylist.id]
                            : editing.stylist_ids.filter(
                                (id) => id !== stylist.id,
                              ),
                        })
                      }
                    />
                    {stylist.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex gap-2 text-[12px] mt-5">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(event) =>
                  setEditing({ ...editing, active: event.target.checked })
                }
              />
              Active and bookable
            </label>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="border border-warm-line px-5 py-3 text-[12px]"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => void save()}
                className="bg-charcoal text-cream px-6 py-3 text-[12px] font-semibold disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save service"}
              </button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}

export function StylistsPage({ owner }: { owner: boolean }) {
  const { data, loading, error, setError, load } = useReferences()
  const [editing, setEditing] = useState<typeof emptyStylist | null>(null)
  const [busy, setBusy] = useState(false)
  const edit = (stylist: AdminStylist) =>
    setEditing({
      id: stylist.id,
      name: stylist.name,
      bio: stylist.bio,
      image_url: stylist.image_url ?? "",
      active: stylist.active,
      service_ids: stylist.service_ids,
    })
  const save = async () => {
    if (!editing) return
    setBusy(true)
    setError("")
    try {
      await saveStylist({
        id: editing.id,
        name: editing.name,
        bio: editing.bio,
        imageUrl: editing.image_url,
        active: editing.active,
        serviceIds: editing.service_ids,
      })
      setEditing(null)
      await load()
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save stylist.",
      )
    } finally {
      setBusy(false)
    }
  }
  if (loading) return <LoadingBlock label="Loading stylists" />
  return (
    <div>
      <PageHeader
        title="Stylists"
        description={
          owner
            ? "Manage profiles, service assignments, and active status."
            : "Stylist profiles are read-only for manager accounts."
        }
        action={
          owner ? (
            <button
              onClick={() => setEditing({ ...emptyStylist })}
              className="bg-charcoal text-cream px-5 py-3 text-[13px] font-semibold"
            >
              + Add Stylist
            </button>
          ) : undefined
        }
      />
      {error && (
        <div className="mb-5">
          <ErrorBlock message={error} retry={load} />
        </div>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.stylists.map((stylist) => (
          <Panel
            key={stylist.id}
            className={`p-5 ${stylist.active ? "" : "opacity-60"}`}
          >
            <div className="flex gap-4">
              <div className="h-14 w-14 bg-taupe shrink-0 overflow-hidden">
                {stylist.image_url ? (
                  <img
                    src={stylist.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full grid place-items-center font-serif text-xl">
                    {stylist.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-serif text-lg">{stylist.name}</h2>
                <p className="text-[10px] uppercase text-warm-gray">
                  {stylist.active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
            <p className="text-[12px] text-warm-gray mt-4 min-h-12">
              {stylist.bio}
            </p>
            <p className="text-[10px] text-warm-gray mt-3">
              {stylist.service_ids.length} assigned service
              {stylist.service_ids.length === 1 ? "" : "s"}
            </p>
            {owner && (
              <button
                onClick={() => edit(stylist)}
                className="mt-4 text-[12px] text-bronze underline"
              >
                Edit stylist
              </button>
            )}
          </Panel>
        ))}
      </div>
      {editing && data && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 p-4 flex justify-center items-center">
          <Panel className="w-full max-w-xl max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between">
              <h2 className="font-serif text-2xl">
                {editing.id ? "Edit Stylist" : "Add Stylist"}
              </h2>
              <button onClick={() => setEditing(null)} className="text-xl">
                ×
              </button>
            </div>
            <div className="space-y-3 mt-5">
              <label className="block text-[10px] uppercase text-warm-gray">
                Name
                <input
                  value={editing.name}
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
                />
              </label>
              <label className="block text-[10px] uppercase text-warm-gray">
                Profile image URL
                <input
                  value={editing.image_url}
                  onChange={(event) =>
                    setEditing({ ...editing, image_url: event.target.value })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
                />
              </label>
              <label className="block text-[10px] uppercase text-warm-gray">
                Bio
                <textarea
                  rows={3}
                  value={editing.bio}
                  onChange={(event) =>
                    setEditing({ ...editing, bio: event.target.value })
                  }
                  className="mt-1 w-full border border-warm-line p-3 text-[13px] normal-case text-charcoal"
                />
              </label>
              <div>
                <p className="text-[10px] uppercase text-warm-gray mb-2">
                  Services performed
                </p>
                <div className="grid sm:grid-cols-2">
                  {data.services.map((service) => (
                    <label
                      key={service.id}
                      className="flex gap-2 text-[12px] py-1"
                    >
                      <input
                        type="checkbox"
                        checked={editing.service_ids.includes(service.id)}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            service_ids: event.target.checked
                              ? [...editing.service_ids, service.id]
                              : editing.service_ids.filter(
                                  (id) => id !== service.id,
                                ),
                          })
                        }
                      />
                      {service.name}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex gap-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(event) =>
                    setEditing({ ...editing, active: event.target.checked })
                  }
                />
                Active and bookable
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="border border-warm-line px-5 py-3 text-[12px]"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => void save()}
                className="bg-charcoal text-cream px-6 py-3 text-[12px] font-semibold disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save stylist"}
              </button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}

export default ServicesPage
