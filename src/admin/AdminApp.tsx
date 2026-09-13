import { useCallback, useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import {
  getAdminProfile,
  getAdminSession,
  listNotifications,
  onAdminAuthChange,
  signInAdmin,
  signOutAdmin,
} from "./api"
import { AdminShell, ErrorBlock, LoadingBlock, Panel } from "./components"
import type { AdminNotification, AdminProfile } from "./types"
import DashboardPage from "./pages/DashboardPage"
import AppointmentsPage from "./pages/AppointmentsPage"
import AppointmentDetailPage from "./pages/AppointmentDetailPage"
import CalendarPage from "./pages/CalendarPage"
import NewAppointmentPage from "./pages/NewAppointmentPage"
import CustomersPage, { CustomerProfilePage } from "./pages/CustomersPage"
import { ServicesPage, StylistsPage } from "./pages/CatalogPages"
import AvailabilityPage from "./pages/AvailabilityPage"
import SettingsPage from "./pages/SettingsPage"

function AdminLogin({
  onLogin,
  accessError,
}: {
  onLogin: (email: string, password: string) => Promise<void>
  accessError: string
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    try {
      await onLogin(email, password)
    } catch (caught) {
      setError(
        caught instanceof Error &&
          caught.message.includes("ADMIN_ACCESS_DENIED")
          ? "This account does not have staff access."
          : "Unable to sign in. Check your email and password.",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="min-h-screen bg-cream grid lg:grid-cols-[1fr_1fr]">
      <div className="hidden lg:flex bg-charcoal text-cream p-12 flex-col justify-between">
        <div>
          <p className="font-serif text-3xl">TJ Hair Salon</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cream/50 mt-2">
            Owner & Manager Dashboard
          </p>
        </div>
        <div>
          <h1 className="font-serif text-5xl leading-tight max-w-lg">
            Run today&apos;s salon schedule with confidence.
          </h1>
          <p className="text-sm text-cream/60 mt-5 max-w-md leading-relaxed">
            Appointments, customers, availability, and services stay
            synchronized with the customer booking website.
          </p>
        </div>
        <p className="text-[11px] text-cream/40">
          Private staff system · America/New_York
        </p>
      </div>
      <div className="flex items-center justify-center p-5">
        <Panel className="w-full max-w-md p-7 sm:p-9 shadow-sm">
          <p className="font-serif text-2xl lg:hidden mb-7">TJ Hair Salon</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-bronze font-semibold">
            Protected area
          </p>
          <h1 className="font-serif text-3xl mt-2">Staff sign in</h1>
          <p className="text-[13px] text-warm-gray mt-2">
            Use the account provided by the salon owner.
          </p>
          {(error || accessError) && (
            <div className="mt-5">
              <ErrorBlock message={error || accessError} />
            </div>
          )}
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-[11px] text-charcoal-mid">
              Email
              <input
                required
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 block w-full border border-warm-line bg-cream p-3.5 text-[14px] outline-none focus:border-bronze"
              />
            </label>
            <label className="block text-[11px] text-charcoal-mid">
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 block w-full border border-warm-line bg-cream p-3.5 text-[14px] outline-none focus:border-bronze"
              />
            </label>
            <button
              disabled={busy}
              className="w-full bg-charcoal text-cream py-3.5 text-[13px] font-semibold hover:bg-bronze disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-warm-line">
            <p className="text-[11px] text-warm-gray leading-relaxed">
              Admin accounts cannot be created here. Contact the owner if you
              need access.
            </p>
            <a
              href="/"
              className="inline-block mt-4 text-[12px] text-bronze underline"
            >
              Return to customer website
            </a>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [path, setPath] = useState(
    window.location.pathname.replace(/\/+$/, "") || "/admin",
  )
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const navigate = useCallback((nextPath: string, replace = false) => {
    if (replace) window.history.replaceState({}, "", nextPath)
    else window.history.pushState({}, "", nextPath)
    setPath(nextPath.replace(/\/+$/, "") || "/admin")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const authorize = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession)
      setError("")
      if (!nextSession) {
        setProfile(null)
        setLoading(false)
        if (window.location.pathname !== "/admin/login")
          navigate("/admin/login", true)
        return
      }
      try {
        const nextProfile = await getAdminProfile()
        setProfile(nextProfile)
        if (window.location.pathname === "/admin/login")
          navigate("/admin", true)
      } catch (caught) {
        await signOutAdmin().catch(() => undefined)
        setSession(null)
        setProfile(null)
        setError(
          caught instanceof Error &&
            (caught.message.includes("ADMIN_ACCESS_DENIED") ||
              caught.message.includes("permission denied"))
            ? "This account does not have active owner or manager access."
            : "Staff access could not be verified.",
        )
        navigate("/admin/login", true)
      } finally {
        setLoading(false)
      }
    },
    [navigate],
  )

  useEffect(() => {
    const onPop = () =>
      setPath(window.location.pathname.replace(/\/+$/, "") || "/admin")
    window.addEventListener("popstate", onPop)
    getAdminSession()
      .then(authorize)
      .catch(() => setLoading(false))
    const subscription = onAdminAuthChange((_event, nextSession) => {
      if (nextSession?.access_token !== session?.access_token)
        void authorize(nextSession)
    })
    return () => {
      window.removeEventListener("popstate", onPop)
      subscription.unsubscribe()
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!profile) return
    try {
      setNotifications(await listNotifications(20))
    } catch {
      /* Dashboard data remains available even if notifications fail. */
    }
  }, [profile])
  useEffect(() => {
    void loadNotifications()
    const timer = window.setInterval(() => void loadNotifications(), 30000)
    return () => window.clearInterval(timer)
  }, [loadNotifications])

  const login = async (email: string, password: string) => {
    setLoading(true)
    const nextSession = await signInAdmin(email, password)
    await authorize(nextSession)
  }
  const logout = async () => {
    await signOutAdmin()
    setSession(null)
    setProfile(null)
    navigate("/admin/login", true)
  }

  if (loading)
    return (
      <div className="min-h-screen bg-cream grid place-items-center px-5">
        <div className="w-full max-w-sm">
          <LoadingBlock label="Verifying staff session" />
        </div>
      </div>
    )
  if (!session || !profile)
    return <AdminLogin onLogin={login} accessError={error} />
  const owner = profile.role === "owner"
  let content: React.ReactNode
  if (path === "/admin") content = <DashboardPage navigate={navigate} />
  else if (path === "/admin/calendar")
    content = <CalendarPage navigate={navigate} />
  else if (path === "/admin/appointments/new")
    content = <NewAppointmentPage navigate={navigate} />
  else if (/^\/admin\/appointments\/[^/]+$/.test(path))
    content = (
      <AppointmentDetailPage id={path.split("/").pop()!} navigate={navigate} />
    )
  else if (path === "/admin/appointments")
    content = <AppointmentsPage navigate={navigate} />
  else if (/^\/admin\/customers\/[^/]+$/.test(path))
    content = (
      <CustomerProfilePage id={path.split("/").pop()!} navigate={navigate} />
    )
  else if (path === "/admin/customers")
    content = <CustomersPage navigate={navigate} />
  else if (path === "/admin/services") content = <ServicesPage owner={owner} />
  else if (path === "/admin/stylists") content = <StylistsPage owner={owner} />
  else if (path === "/admin/availability") content = <AvailabilityPage />
  else if (path === "/admin/settings") content = <SettingsPage owner={owner} />
  else
    content = (
      <div>
        <ErrorBlock message="This admin page does not exist." />
        <button
          onClick={() => navigate("/admin")}
          className="mt-4 underline text-[12px]"
        >
          Return to dashboard
        </button>
      </div>
    )

  return (
    <AdminShell
      profile={profile}
      path={path}
      notifications={notifications}
      navigate={navigate}
      logout={() => void logout()}
    >
      <main className="lg:ml-64 px-4 sm:px-7 py-7 pb-24 lg:pb-10 max-w-[1500px]">
        {error && (
          <div className="mb-5">
            <ErrorBlock message={error} />
          </div>
        )}
        {content}
      </main>
    </AdminShell>
  )
}
