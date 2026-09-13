import { useCallback, useEffect, useState } from "react"
import { getCustomer, listCustomers, updateCustomer } from "../api"
import {
  AppointmentRow,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Panel,
} from "../components"
import { formatAdminDate } from "../time"
import type { CustomerProfile, CustomerSummary } from "../types"

export function CustomersPage({
  navigate,
}: {
  navigate: (path: string) => void
}) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setCustomers(await listCustomers(query))
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load customers.",
      )
    } finally {
      setLoading(false)
    }
  }, [query])
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200)
    return () => window.clearTimeout(timer)
  }, [load])
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Private customer records and appointment history."
      />
      <Panel className="p-4 mb-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, phone, or email"
          className="w-full border border-warm-line bg-cream p-3 text-[13px]"
        />
      </Panel>
      {error && <ErrorBlock message={error} retry={load} />}
      {loading ? (
        <LoadingBlock label="Loading customers" />
      ) : (
        <Panel>
          <div className="hidden md:grid grid-cols-[1.2fr_1fr_1fr_130px_80px] gap-3 px-4 py-3 border-b border-warm-line text-[10px] uppercase tracking-wider text-warm-gray">
            <span>Customer</span>
            <span>Contact</span>
            <span>Upcoming</span>
            <span>Last visit</span>
            <span>Visits</span>
          </div>
          {customers.length === 0 ? (
            <p className="p-8 text-center text-[12px] text-warm-gray">
              No customers found.
            </p>
          ) : (
            customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => navigate(`/admin/customers/${customer.id}`)}
                className="w-full text-left grid md:grid-cols-[1.2fr_1fr_1fr_130px_80px] gap-2 md:gap-3 p-4 border-b border-warm-line last:border-0 hover:bg-cream-dark"
              >
                <span>
                  <span className="block text-[13px] font-semibold">
                    {customer.first_name} {customer.last_name}
                  </span>
                  {customer.no_shows > 0 && (
                    <span className="text-[10px] text-[#7a3229]">
                      {customer.no_shows} no-show
                      {customer.no_shows === 1 ? "" : "s"}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-warm-gray">
                  <span className="block">{customer.phone}</span>
                  <span className="block truncate">{customer.email}</span>
                </span>
                <span className="text-[12px]">
                  {customer.upcoming_appointment
                    ? formatAdminDate(customer.upcoming_appointment)
                    : "—"}
                </span>
                <span className="text-[12px]">
                  {customer.last_appointment
                    ? formatAdminDate(customer.last_appointment)
                    : "—"}
                </span>
                <span className="text-[12px] font-semibold">
                  {customer.previous_appointments}
                </span>
              </button>
            ))
          )}
        </Panel>
      )}
    </div>
  )
}

export function CustomerProfilePage({
  id,
  navigate,
}: {
  id: string
  navigate: (path: string) => void
}) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [draft, setDraft] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const value = await getCustomer(id)
      setCustomer(value)
      setDraft(value)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load customer.",
      )
    } finally {
      setLoading(false)
    }
  }, [id])
  useEffect(() => {
    void load()
  }, [load])
  const save = async () => {
    if (!draft) return
    try {
      const value = await updateCustomer(id, draft)
      setCustomer(value)
      setDraft(value)
      setEditing(false)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save customer.",
      )
    }
  }
  if (loading) return <LoadingBlock label="Loading customer" />
  if (!customer || !draft)
    return <ErrorBlock message={error || "Customer not found."} retry={load} />
  const upcoming = customer.appointments.filter(
    (item) =>
      new Date(item.start_at) >= new Date() &&
      !["cancelled", "no_show"].includes(item.status),
  )
  const previous = customer.appointments.filter(
    (item) =>
      new Date(item.start_at) < new Date() &&
      !["cancelled", "no_show"].includes(item.status),
  )
  const cancelled = customer.appointments.filter(
    (item) => item.status === "cancelled",
  )
  const noShows = customer.appointments.filter(
    (item) => item.status === "no_show",
  )
  return (
    <div>
      <button
        onClick={() => navigate("/admin/customers")}
        className="text-[12px] text-warm-gray mb-5"
      >
        ← Customers
      </button>
      <PageHeader
        title={`${customer.first_name} ${customer.last_name}`}
        description={`Customer since ${formatAdminDate(customer.created_at, true)}`}
        action={
          <button
            onClick={() => setEditing((value) => !value)}
            className="border border-warm-line px-4 py-2.5 text-[12px] font-semibold"
          >
            {editing ? "Cancel edit" : "Edit customer"}
          </button>
        }
      />
      {error && (
        <div className="mb-5">
          <ErrorBlock message={error} />
        </div>
      )}
      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
        <Panel className="p-5 h-fit">
          {editing ? (
            <div className="space-y-3">
              {(["first_name", "last_name", "phone", "email"] as const).map(
                (field) => (
                  <label
                    key={field}
                    className="block text-[10px] uppercase tracking-wider text-warm-gray"
                  >
                    {field.replace("_", " ")}
                    <input
                      value={draft[field]}
                      onChange={(event) =>
                        setDraft({ ...draft, [field]: event.target.value })
                      }
                      className="mt-1 w-full border border-warm-line p-2.5 text-[13px] text-charcoal normal-case"
                    />
                  </label>
                ),
              )}
              <button
                onClick={() => void save()}
                className="w-full bg-charcoal text-cream p-3 text-[12px] font-semibold"
              >
                Save changes
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase text-warm-gray">Phone</p>
                <a
                  href={`tel:${customer.phone}`}
                  className="text-[13px] text-bronze"
                >
                  {customer.phone}
                </a>
              </div>
              <div>
                <p className="text-[10px] uppercase text-warm-gray">Email</p>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-[13px] text-bronze break-all"
                >
                  {customer.email}
                </a>
              </div>
            </div>
          )}
        </Panel>
        <div className="space-y-5">
          {[
            ["Upcoming appointments", upcoming],
            ["Previous appointments", previous],
            ["Cancelled appointments", cancelled],
            ["No-shows", noShows],
          ].map(([label, items]) => (
            <Panel key={label as string}>
              <div className="p-4 border-b border-warm-line">
                <h2 className="font-serif text-lg">{label as string}</h2>
              </div>
              {(items as typeof upcoming).length ? (
                (items as typeof upcoming).map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() =>
                      navigate(`/admin/appointments/${appointment.id}`)
                    }
                  />
                ))
              ) : (
                <p className="p-5 text-[12px] text-warm-gray">None</p>
              )}
            </Panel>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CustomersPage
