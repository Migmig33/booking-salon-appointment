import { useState } from "react"
import Footer from "../components/Footer"
import type { Page } from "../App"
import {
  SALON_BUSINESS_TYPE,
  SALON_DIRECTIONS_URL,
  SALON_EMAIL_DISPLAY,
  SALON_EMAIL_LINK,
  SALON_LOCATION,
  SALON_NAME,
} from "../config/salon"

const GALLERY_ITEMS = [
  {
    id: "1554519934-e32b1629d9ee",
    label: "Balayage",
    category: "Balayage",
    aspect: "tall",
  },
  {
    id: "1605980766335-d3a41c7332a1",
    label: "Blonde Color",
    category: "Color",
    aspect: "tall",
  },
  {
    id: "1712213396688-c6f2d536671f",
    label: "Precision Cut",
    category: "Cuts",
    aspect: "wide",
  },
  {
    id: "1629397685944-7073f5589754",
    label: "Styling Session",
    category: "Styling",
    aspect: "wide",
  },
  {
    id: "1560869713-7d0a29430803",
    label: "Curl Styling",
    category: "Perms",
    aspect: "tall",
  },
  {
    id: "1580618672591-eb180b1a973f",
    label: "Blowout",
    category: "Styling",
    aspect: "wide",
  },
  {
    id: "1605980625600-88b46abafa8d",
    label: "Color Result",
    category: "Color",
    aspect: "tall",
  },
  {
    id: "1707979577466-2d6109c68a45",
    label: "Hair Care",
    category: "Treatments",
    aspect: "wide",
  },
  {
    id: "1638064432601-18b99cb31acb",
    label: "Highlights",
    category: "Color",
    aspect: "tall",
  },
]

const SERVICE_CARDS = [
  {
    id: "cuts",
    label: "Haircuts",
    description:
      "Women's and men's cuts shaped around your face, texture, and lifestyle.",
    img: "1712213396688-c6f2d536671f",
  },
  {
    id: "color",
    label: "Hair Color",
    description:
      "Root touch-ups, full color, highlights, and bleach — every level of transformation.",
    img: "1605980766335-d3a41c7332a1",
  },
  {
    id: "balayage",
    label: "Balayage & Highlights",
    description:
      "Hand-painted balayage and strategically placed highlights for natural dimension.",
    img: "1554519934-e32b1629d9ee",
  },
  {
    id: "perms",
    label: "Perms",
    description:
      "Modern waves, curls, and straightening treatments with lasting, touchable results.",
    img: "1560869713-7d0a29430803",
  },
  {
    id: "treatments",
    label: "Treatments",
    description:
      "Keratin smoothing, deep conditioning, and targeted repair for healthy hair.",
    img: "1580618672591-eb180b1a973f",
  },
  {
    id: "styling",
    label: "Styling",
    description: "Blowouts, updos, and event-ready styling for any occasion.",
    img: "1629397685944-7073f5589754",
  },
]

const TESTIMONIALS = [
  {
    theme: "Color & Balayage",
    text: "“The stylist listened carefully and created natural-looking dimension that suited the client’s everyday style.”",
    attr: "Illustrative sample feedback",
  },
  {
    theme: "Cuts & Detail",
    text: "“The consultation felt thoughtful, and the finished cut was easy to maintain at home.”",
    attr: "Illustrative sample feedback",
  },
  {
    theme: "Experience & Value",
    text: "“The booking experience was simple, clear, and convenient from service selection through confirmation.”",
    attr: "Illustrative sample feedback",
  },
]

interface Props {
  navigate: (p: Page) => void
  startBooking: () => void
}

export default function HomePage({ navigate, startBooking }: Props) {
  const [activeFilter, setActiveFilter] = useState("All")
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)
  const [lightboxLabel, setLightboxLabel] = useState("")

  const filters = ["All", "Color", "Balayage", "Cuts", "Perms", "Styling"]

  const filteredGallery =
    activeFilter === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((i) => i.category === activeFilter)

  return (
    <main className="pb-20 lg:pb-0">
      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] lg:min-h-[88vh] grid grid-cols-1 lg:grid-cols-2">
        {/* Left: text */}
        <div className="flex flex-col justify-center px-5 lg:px-16 xl:px-24 pt-14 pb-12 lg:py-24 order-2 lg:order-1 bg-cream">
          <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium mb-6 lg:mb-8">
            {SALON_BUSINESS_TYPE} &nbsp;·&nbsp; {SALON_LOCATION}
          </span>
          <h1 className="font-serif text-[46px] sm:text-[56px] lg:text-[64px] xl:text-[72px] leading-[1.05] text-charcoal mb-6 lg:mb-7">
            Hair Designed
            <br />
            <em className="not-italic text-charcoal/80">Around You.</em>
          </h1>
          <p className="text-[15px] lg:text-base text-charcoal-mid leading-relaxed max-w-[400px] mb-8 lg:mb-10">
            A polished Philippine salon booking experience with cuts, color,
            styling, treatments, and beauty services.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-10 lg:mb-12">
            <button
              onClick={startBooking}
              className="bg-charcoal text-cream text-[13px] font-medium px-7 py-3.5 hover:bg-bronze transition-all duration-200 tracking-wide text-center"
            >
              Book an Appointment
            </button>
            <button
              onClick={() => navigate("services")}
              className="border border-charcoal/30 text-charcoal text-[13px] font-medium px-7 py-3.5 hover:border-charcoal transition-all duration-200 tracking-wide text-center"
            >
              Explore Services
            </button>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-warm-gray">
            <svg
              className="w-3.5 h-3.5 text-bronze shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{SALON_LOCATION} &nbsp;·&nbsp; Fictional demo location</span>
          </div>
        </div>

        {/* Right: image */}
        <div className="order-1 lg:order-2 relative h-[52vw] sm:h-[45vw] lg:h-auto lg:min-h-full bg-taupe overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1629397685944-7073f5589754?w=1200&h=900&fit=crop&auto=format"
            alt="Hair stylist at work in a salon"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-charcoal/10" />
          {/* Decorative label */}
          <div className="absolute bottom-5 left-5 lg:bottom-8 lg:left-8">
            <span className="bg-cream/90 backdrop-blur-sm text-charcoal text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 font-medium">
              Fictional demo salon
            </span>
          </div>
        </div>
      </section>

      {/* ── SERVICES PREVIEW ── */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="max-w-xl mb-12 lg:mb-16">
            <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
              What We Offer
            </span>
            <h2 className="font-serif text-[36px] lg:text-[44px] text-charcoal mt-3 leading-tight">
              Find Your Next Look
            </h2>
            <p className="text-charcoal-mid text-[15px] leading-relaxed mt-4">
              From everyday cuts to complete transformations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => navigate("services")}
                className="group text-left bg-cream-dark hover:bg-taupe transition-colors duration-200 overflow-hidden"
              >
                <div className="relative h-48 lg:h-52 bg-taupe overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-${card.img}?w=600&h=400&fit=crop&auto=format`}
                    alt={card.label}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 lg:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-[18px] text-charcoal mb-1.5">
                        {card.label}
                      </h3>
                      <p className="text-[13px] text-warm-gray leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-bronze shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-10 lg:mt-12 text-center">
            <button
              onClick={() => navigate("services")}
              className="border border-charcoal/25 text-charcoal text-[13px] font-medium px-8 py-3 hover:border-charcoal hover:bg-charcoal hover:text-cream transition-all duration-200 tracking-wide"
            >
              View All Services
            </button>
          </div>
        </div>
      </section>

      {/* ── TRANSFORMATION ── */}
      <section className="py-0 lg:py-0 bg-charcoal overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Images */}
          <div className="grid grid-cols-2 h-[380px] lg:h-[520px]">
            <div className="relative bg-taupe overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1554519934-e32b1629d9ee?w=400&h=600&fit=crop&auto=format"
                alt="Balayage hair transformation"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="relative bg-taupe overflow-hidden border-l-2 border-charcoal">
              <img
                src="https://images.unsplash.com/photo-1605980766335-d3a41c7332a1?w=400&h=600&fit=crop&auto=format"
                alt="Blonde color transformation"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center px-8 lg:px-16 py-14 lg:py-20">
            <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium mb-5">
              The Work
            </span>
            <h2 className="font-serif text-[36px] lg:text-[46px] text-cream leading-tight mb-5">
              Color. Cut.
              <br />
              Transform.
            </h2>
            <p className="text-[14px] lg:text-[15px] text-cream/65 leading-relaxed mb-8 max-w-sm">
              Every appointment starts with a conversation. We listen to what
              you want, consider your hair, and deliver results that are
              designed around you — not just what looks good on someone else.
            </p>
            <button
              onClick={() =>
                document
                  .getElementById("gallery")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="self-start border border-cream/25 text-cream text-[13px] font-medium px-7 py-3 hover:border-bronze hover:text-bronze-light transition-all duration-200 tracking-wide"
            >
              View Style Gallery
            </button>
          </div>
        </div>
      </section>

      {/* ── WHY THIS SALON ── */}
      <section className="py-20 lg:py-28 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-14 lg:mb-16">
            <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
              Why Choose Us
            </span>
            <h2 className="font-serif text-[34px] lg:text-[40px] text-charcoal mt-3">
              Designed Around You
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {[
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                ),
                title: "Personalized Attention",
                body: "We listen before we cut. Every service begins with understanding what you want and how your hair behaves.",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                ),
                title: "Skilled Cuts & Color",
                body: "Thoughtful technique for the look you want — whether that is a precision cut or a complete color transformation.",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                ),
                title: "Welcoming Experience",
                body: "A comfortable neighborhood salon where you feel at ease from the moment you walk in.",
              },
              {
                icon: (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                ),
                title: "Results That Feel Like You",
                body: "Styles designed around your hair and your preferences — not a generic template.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-11 h-11 bg-cream text-bronze mb-5">
                  {icon}
                </div>
                <h3 className="font-serif text-[18px] text-charcoal mb-2">
                  {title}
                </h3>
                <p className="text-[13px] text-warm-gray leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / STYLIST ── */}
      <section id="about" className="py-0 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="relative h-[380px] lg:h-auto bg-taupe overflow-hidden order-1">
            <img
              src="https://images.unsplash.com/photo-1626383137804-ff908d2753a2?w=800&h=900&fit=crop&auto=format"
              alt="Stylist at work in the salon"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-charcoal/10" />
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center px-8 lg:px-16 xl:px-20 py-16 lg:py-24 bg-cream order-2">
            <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium mb-5">
              The Studio Experience
            </span>
            <h2 className="font-serif text-[32px] lg:text-[42px] text-charcoal leading-tight mb-5">
              Care and attention
              <br />
              behind every look.
            </h2>
            <p className="text-[14px] lg:text-[15px] text-charcoal-mid leading-relaxed mb-5 max-w-sm">
              This sample salon experience highlights attentive consultations,
              careful technique, and clear service choices for every
              appointment.
            </p>
            <p className="text-[13px] text-warm-gray leading-relaxed mb-8 max-w-sm">
              Whether you come in with a reference photo or a general idea, the
              goal is always the same — a result that fits your hair, your face,
              and your life.
            </p>
            <button
              onClick={startBooking}
              className="self-start bg-charcoal text-cream text-[13px] font-medium px-7 py-3 hover:bg-bronze transition-all duration-200 tracking-wide"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" className="py-20 lg:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
            <div>
              <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
                Sample Gallery
              </span>
              <h2 className="font-serif text-[34px] lg:text-[40px] text-charcoal mt-2">
                Style Inspiration
              </h2>
              <p className="mt-2 text-[11px] text-warm-gray">
                Stock imagery shown for demonstration purposes.
              </p>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-[11px] font-medium tracking-wide px-4 py-1.5 border transition-all duration-150 ${
                    activeFilter === f
                      ? "bg-charcoal text-cream border-charcoal"
                      : "border-warm-line text-warm-gray hover:border-charcoal hover:text-charcoal"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="columns-2 md:columns-3 gap-3 [column-fill:balance]">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="break-inside-avoid mb-3 relative group cursor-pointer overflow-hidden bg-taupe"
                onClick={() => {
                  setLightboxImg(item.id)
                  setLightboxLabel(item.label)
                }}
              >
                <img
                  src={`https://images.unsplash.com/photo-${item.id}?w=500&h=${
                    item.aspect === "tall" ? "700" : "400"
                  }&fit=crop&auto=format`}
                  alt={item.label}
                  className="w-full h-auto block group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-all duration-300 flex items-end justify-start p-4">
                  <span className="text-cream text-[11px] tracking-wide uppercase font-medium opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredGallery.length === 0 && (
            <p className="text-center text-warm-gray py-12">
              No items in this category yet.
            </p>
          )}

          <div className="mt-10 text-center">
            <button
              onClick={startBooking}
              className="border border-charcoal/25 text-charcoal text-[13px] font-medium px-8 py-3 hover:bg-charcoal hover:text-cream hover:border-charcoal transition-all duration-200 tracking-wide"
            >
              Book Your Appointment
            </button>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section id="reviews" className="py-20 lg:py-28 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
              Sample Feedback
            </span>
            <h2 className="font-serif text-[34px] lg:text-[40px] text-charcoal mt-3">
              Illustrative Client Experiences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ theme, text, attr }) => (
              <div
                key={theme}
                className="bg-cream p-7 lg:p-8 flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-3.5 h-3.5 text-bronze"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div>
                  <p className="text-[13px] text-charcoal-mid leading-relaxed mb-4">
                    {text}
                  </p>
                  <p className="text-[11px] text-warm-gray tracking-wide">
                    {attr}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-warm-line">
                  <p className="text-[11px] tracking-[0.15em] uppercase text-bronze font-medium">
                    {theme}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-[12px] text-warm-gray">
            These examples demonstrate the review-card layout and are not real
            customer testimonials.
          </p>
        </div>
      </section>

      {/* ── BOOKING CTA ── */}
      <section className="py-20 lg:py-28 bg-charcoal text-cream text-center">
        <div className="max-w-2xl mx-auto px-5">
          <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
            Ready?
          </span>
          <h2 className="font-serif text-[36px] lg:text-[48px] text-cream mt-3 mb-5 leading-tight">
            Ready for Your
            <br />
            Next Look?
          </h2>
          <p className="text-[14px] text-cream/65 leading-relaxed mb-10">
            Choose your service and find a time that works for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={startBooking}
              className="bg-bronze text-cream text-[13px] font-medium px-8 py-3.5 hover:bg-bronze-light transition-all duration-200 tracking-wide"
            >
              Book Appointment
            </button>
            <a
              href={SALON_EMAIL_LINK}
              className="border border-cream/25 text-cream text-[13px] font-medium px-8 py-3.5 hover:border-cream/50 transition-all duration-200 tracking-wide text-center"
            >
              Email the Demo
            </a>
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section id="contact" className="py-20 lg:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Info */}
            <div>
              <span className="text-[11px] tracking-[0.22em] uppercase text-bronze font-medium">
                Find Us
              </span>
              <h2 className="font-serif text-[34px] lg:text-[40px] text-charcoal mt-3 mb-7">
                Demo Location
              </h2>
              <div className="space-y-5 mb-8">
                <div className="flex gap-3">
                  <svg
                    className="w-4 h-4 text-bronze mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <address className="not-italic text-[14px] text-charcoal-mid leading-relaxed">
                    {SALON_NAME}
                    <br />
                    {SALON_LOCATION}
                    <br />
                    No physical demo branch
                  </address>
                </div>
                <div className="flex gap-3 items-center">
                  <svg
                    className="w-4 h-4 text-bronze shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a
                    href={SALON_EMAIL_LINK}
                    className="text-[14px] text-charcoal-mid hover:text-bronze transition-colors"
                  >
                    {SALON_EMAIL_DISPLAY}
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={SALON_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-charcoal text-cream text-[13px] font-medium px-6 py-2.5 hover:bg-bronze transition-all duration-200 tracking-wide"
                >
                  View Metro Manila
                </a>
                <a
                  href={SALON_EMAIL_LINK}
                  className="border border-charcoal/25 text-charcoal text-[13px] font-medium px-6 py-2.5 hover:border-charcoal transition-all duration-200 tracking-wide"
                >
                  Email Demo Contact
                </a>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="relative h-[300px] lg:h-[360px] bg-cream-dark overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <svg
                  className="w-8 h-8 text-bronze"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.25}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.25}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="font-serif text-[16px] text-charcoal">
                    {SALON_NAME}
                  </p>
                  <p className="text-[13px] text-warm-gray mt-1">
                    {SALON_LOCATION} · Sample location only
                  </p>
                </div>
                <a
                  href={SALON_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-[12px] text-bronze hover:text-charcoal transition-colors underline underline-offset-2 tracking-wide"
                >
                  View Region in Google Maps
                </a>
              </div>
              {/* Grid decoration */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--color-warm-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-warm-line) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer navigate={navigate} startBooking={startBooking} />

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/90 flex items-center justify-center p-4 lg:p-8"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`https://images.unsplash.com/photo-${lightboxImg}?w=1200&h=900&fit=crop&auto=format`}
              alt={lightboxLabel}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-charcoal/70 px-5 py-3 flex justify-between items-center">
              <span className="text-cream text-[12px] tracking-wide">
                {lightboxLabel}
              </span>
              <button
                onClick={() => setLightboxImg(null)}
                className="text-cream/60 hover:text-cream text-[12px] tracking-wide"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
