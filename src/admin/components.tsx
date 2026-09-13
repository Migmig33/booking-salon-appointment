import { useState, type ReactNode } from "react"
import { formatAppointmentDateShort, formatAppointmentTime } from "../lib/time"
import type {
  AdminAppointment,
  AdminAppointmentStatus,
  AdminNotification,
  AdminProfile,
} from "./types"

const statusStyles: Record<AdminAppointmentStatus, string> = {
  confirmed: "bg-[#e8efe9] text-[#315a3a]",
  checked_in: "bg-[#e5edf4] text-[#284f70]",
  completed: "bg-[#ede8f2] text-[#55406b]",
  rescheduled: "bg-[#f3ead8] text-[#6a5123]",
  cancelled: "bg-[#eeeae6] text-[#635d57]",
  no_show: "bg-[#f3e3e0] text-[#7a3229]",
}

export function StatusBadge({ status }: { status: AdminAppointmentStatus }) {
  const label =
    status === "no_show"
      ? "No-show"
      : status === "checked_in"
        ? "Checked in"
        : status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

export function AppointmentRow({
  appointment,
  onClick,
  compact = false,
}: {
  appointment: AdminAppointment
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left border-b border-warm-line last:border-0 px-4 py-4 hover:bg-cream-dark/70 focus-visible:outline-2 focus-visible:outline-bronze transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-20 shrink-0">
          <p className="text-[13px] font-semibold text-charcoal">
            {formatAppointmentTime(appointment.start_at)}
          </p>
          {!compact && (
            <p className="text-[11px] text-warm-gray mt-0.5">
              {formatAppointmentTime(appointment.end_at)}
            </p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[14px] text-charcoal truncate">
            {appointment.customer.first_name} {appointment.customer.last_name}
          </p>
          <p className="text-[12px] text-charcoal-mid truncate">
            {appointment.service.name}
          </p>
          {!compact && (
            <p className="text-[11px] text-warm-gray mt-1">
              {appointment.stylist.name} ·{" "}
              {formatAppointmentDateShort(appointment.start_at)}
            </p>
          )}
        </div>
        <StatusBadge status={appointment.status} />
      </div>
    </button>
  )
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`border border-warm-line/90 bg-white shadow-[0_1px_2px_rgba(26,25,22,0.035)] ${className}`}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 mb-6 lg:mb-8 border-b border-warm-line/80">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] tracking-[0.18em] uppercase text-bronze font-semibold mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-[30px] lg:text-[36px] text-charcoal leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-warm-gray mt-2 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="border border-warm-line bg-white p-8" aria-live="polite">
      <div className="h-2 w-24 bg-taupe animate-pulse mb-3" />
      <p className="text-[12px] text-warm-gray">{label}…</p>
    </div>
  )
}

export function ErrorBlock({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  return (
    <div
      role="alert"
      className="border border-[#caa59e] bg-[#fbf4f2] p-5 text-[13px] text-[#6f3028]"
    >
      <p>{message}</p>
      {retry && (
        <button onClick={retry} className="mt-3 underline font-semibold">
          Try again
        </button>
      )}
    </div>
  )
}

const navItems = [
  ["Dashboard", "/admin"],
  ["Calendar", "/admin/calendar"],
  ["Appointments", "/admin/appointments"],
  ["Customers", "/admin/customers"],
  ["Services", "/admin/services"],
  ["Stylists", "/admin/stylists"],
  ["Availability", "/admin/availability"],
  ["Settings", "/admin/settings"],
] as const

function isActive(path: string, href: string) {
  return href === "/admin" ? path === href : path.startsWith(href)
}

export function AdminShell({
  profile,
  path,
  notifications,
  navigate,
  logout,
  children,
}: {
  profile: AdminProfile
  path: string
  notifications: AdminNotification[]
  navigate: (path: string) => void
  logout: () => void
  children: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const go = (nextPath: string) => {
    setMenuOpen(false)
    navigate(nextPath)
  }
  return (
    <div className="min-h-screen bg-cream text-charcoal lg:pl-64">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-charcoal text-cream flex-col z-30">
        <div className="px-7 py-7 border-b border-white/10">
          <p className="font-serif text-xl">TJ Hair Salon</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cream/50 mt-1">
            Management
          </p>
        </div>
        <nav className="flex-1 px-3 py-5" aria-label="Admin navigation">
          {navItems.map(([label, href]) => (
            <button
              key={href}
              onClick={() => go(href)}
              className={`w-full text-left px-4 py-3 text-[13px] transition-colors ${
                isActive(path, href)
                  ? "bg-white/10 text-white border-l-2 border-bronze-light"
                  : "text-cream/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="p-5 border-t border-white/10">
          <p className="text-[13px] font-medium truncate">
            {profile.display_name}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-cream/50 mt-1">
            {profile.role}
          </p>
          <button
            onClick={logout}
            className="mt-4 text-[12px] text-cream/70 hover:text-white underline underline-offset-4"
          >
            Logout
          </button>
        </div>
      </aside>

      <header className="h-16 border-b border-warm-line bg-white/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="lg:hidden h-10 w-10 border border-warm-line text-xl"
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div>
            <p className="font-serif text-lg lg:hidden">TJ Hair Salon</p>
            <p className="hidden sm:block text-[11px] text-warm-gray">
              All times shown in America/New_York
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((value) => !value)}
            className="relative h-10 px-3 border border-warm-line text-[12px] hover:border-charcoal"
          >
            Notifications
            {notifications.length > 0 && (
              <span className="ml-2 inline-flex min-w-5 h-5 items-center justify-center bg-bronze text-white text-[10px] rounded-full">
                {Math.min(notifications.length, 9)}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <Panel className="absolute right-0 mt-2 w-[min(360px,calc(100vw-2rem))] shadow-xl max-h-96 overflow-auto">
              <div className="p-4 border-b border-warm-line">
                <p className="font-semibold text-[13px]">Recent activity</p>
              </div>
              {notifications.length === 0 ? (
                <p className="p-5 text-[12px] text-warm-gray">
                  No booking activity yet.
                </p>
              ) : (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setNotificationsOpen(false)
                      go(`/admin/appointments/${item.appointment_id}`)
                    }}
                    className="w-full text-left p-4 border-b border-warm-line last:border-0 hover:bg-cream-dark"
                  >
                    <p className="text-[12px] font-semibold">{item.title}</p>
                    <p className="text-[11px] text-warm-gray mt-1">
                      {item.body}
                    </p>
                  </button>
                ))
              )}
            </Panel>
          )}
        </div>
      </header>

      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-72 h-full bg-charcoal text-cream p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-serif text-xl">Management</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-2xl"
                aria-label="Close navigation"
              >
                ×
              </button>
            </div>
            {navItems.map(([label, href]) => (
              <button
                key={href}
                onClick={() => go(href)}
                className={`w-full text-left px-4 py-3 text-[13px] ${
                  isActive(path, href)
                    ? "bg-white/10 text-white"
                    : "text-cream/70"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={logout}
              className="mt-6 px-4 text-[12px] underline"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 lg:pb-10">
        {children}
      </main>

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-warm-line z-20 grid grid-cols-4"
        aria-label="Quick admin navigation"
      >
        {[
          ["Today", "/admin"],
          ["Calendar", "/admin/calendar"],
          ["New", "/admin/appointments/new"],
          ["Bookings", "/admin/appointments"],
        ].map(([label, href]) => (
          <button
            key={href}
            onClick={() => go(href)}
            className={`text-[11px] font-medium ${
              isActive(path, href) ? "text-bronze" : "text-warm-gray"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
