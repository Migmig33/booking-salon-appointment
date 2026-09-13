import { useEffect, useState } from "react"
import Nav from "./components/Nav"
import MobileBottomBar from "./components/MobileBottomBar"
import HomePage from "./pages/HomePage"
import ServicesPage from "./pages/ServicesPage"
import BookingLayout from "./pages/booking/BookingLayout"
import ManageAppointment from "./pages/manage/ManageAppointment"
import FindBooking from "./pages/manage/FindBooking"
import ReminderPreview from "./pages/manage/ReminderPreview"
import { emptyBooking } from "./types/booking"
import type { Appointment, BookingData } from "./types/booking"
import { formatAppointmentTime, salonDateKey } from "./lib/time"

export type Page = "home" | "services" | "booking" | "manage" | "find" | "reminder"
export type BookingStep = "service" | "stylist" | "datetime" | "details" | "review" | "confirm"
export type { BookingData } from "./types/booking"

type ManagementAction = "reschedule" | "cancel" | null

function routeState() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  if (path.startsWith("/manage-booking/")) {
    const requestedAction = new URLSearchParams(window.location.search).get(
      "action",
    )
    const action: ManagementAction =
      requestedAction === "reschedule" || requestedAction === "cancel"
        ? requestedAction
        : null
    return {
      page: "manage" as Page,
      token: decodeURIComponent(path.slice("/manage-booking/".length)),
      action,
    }
  }
  if (path === "/find-booking")
    return { page: "find" as Page, token: "", action: null }
  if (path === "/services")
    return { page: "services" as Page, token: "", action: null }
  if (path === "/book")
    return { page: "booking" as Page, token: "", action: null }
  if (path === "/reminder")
    return { page: "reminder" as Page, token: "", action: null }
  return { page: "home" as Page, token: "", action: null }
}

const pagePaths: Record<Exclude<Page, "manage">, string> = {
  home: "/",
  services: "/services",
  booking: "/book",
  find: "/find-booking",
  reminder: "/reminder",
}

export default function App() {
  const initialRoute = routeState()
  const [page, setPage] = useState<Page>(initialRoute.page)
  const [managementToken, setManagementToken] = useState(initialRoute.token)
  const [managementAction, setManagementAction] = useState(initialRoute.action)
  const [bookingStep, setBookingStep] = useState<BookingStep>("service")
  const [booking, setBooking] = useState<BookingData>(emptyBooking)
  const [appointment, setAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    const onPopState = () => {
      const route = routeState()
      setPage(route.page)
      setManagementToken(route.token)
      setManagementAction(route.action)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const navigate = (nextPage: Page) => {
    if (nextPage === "manage") {
      if (managementToken) openManagement(managementToken)
      else navigate("find")
      return
    }
    window.history.pushState({}, "", pagePaths[nextPage])
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openManagement = (token: string) => {
    setManagementToken(token)
    setManagementAction(null)
    window.history.pushState(
      {},
      "",
      `/manage-booking/${encodeURIComponent(token)}`,
    )
    setPage("manage")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const startBooking = () => {
    setBookingStep("service")
    setBooking(emptyBooking)
    setAppointment(null)
    setManagementToken("")
    navigate("booking")
  }

  const inBookingFlow = page === "booking"
  const hideBottomBar =
    page === "booking" ||
    page === "manage" ||
    page === "find" ||
    page === "reminder"

  return (
    <div className="min-h-screen bg-cream font-sans">
      <Nav
        page={page}
        navigate={navigate}
        startBooking={startBooking}
        inBooking={inBookingFlow}
      />

      {page === "home" && (
        <HomePage navigate={navigate} startBooking={startBooking} />
      )}
      {page === "services" && (
        <ServicesPage navigate={navigate} startBooking={startBooking} />
      )}
      {page === "booking" && (
        <BookingLayout
          step={bookingStep}
          setStep={setBookingStep}
          booking={booking}
          setBooking={setBooking}
          appointment={appointment}
          setAppointment={setAppointment}
          managementToken={managementToken}
          setManagementToken={setManagementToken}
          navigate={navigate}
          openManagement={openManagement}
        />
      )}
      {page === "manage" && (
        <ManageAppointment
          token={managementToken}
          initialAction={managementAction}
          navigate={navigate}
          startBooking={startBooking}
          onAppointmentChange={setAppointment}
        />
      )}
      {page === "find" && (
        <FindBooking navigate={navigate} openManagement={openManagement} />
      )}
      {page === "reminder" && appointment && (
        <ReminderPreview
          booking={{
            service: appointment.service,
            addons: appointment.addons,
            stylist: appointment.stylist,
            date: salonDateKey(appointment.startAt),
            time: formatAppointmentTime(appointment.startAt),
            startAt: appointment.startAt,
            customer: { ...appointment.customer, updates: true },
          }}
          bookingRef={appointment.bookingReference}
          navigate={navigate}
        />
      )}
      {page === "reminder" && !appointment && (
        <FindBooking navigate={navigate} openManagement={openManagement} />
      )}

      {!hideBottomBar && <MobileBottomBar startBooking={startBooking} />}
    </div>
  )
}
