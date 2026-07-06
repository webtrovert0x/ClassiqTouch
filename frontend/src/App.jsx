import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5390/api";

const services = [
  {
    id: "signature-cut",
    title: "Signature cut",
    duration: "25 min",
    detail: "Clean shape-up, tailored fade, finished with a crisp line.",
  },
  {
    id: "fade-refresh",
    title: "Fade refresh",
    duration: "20 min",
    detail: "A quick reset for the sides, neckline, and top.",
  },
  {
    id: "beard-sculpt",
    title: "Beard sculpt",
    duration: "15 min",
    detail: "Beard line-up and trim with a neat finish.",
  },
  {
    id: "cut-and-beard",
    title: "Cut + beard",
    duration: "35 min",
    detail: "Full service for a sharper weekly reset.",
  },
];

function toDateKey(iso) {
  return new Date(iso).toDateString();
}

function formatDayLabel(iso) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function formatTimeLabel(iso) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatLongLabel(iso) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function App() {
  const [slots, setSlots] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0].id);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [bookingReceipt, setBookingReceipt] = useState(null);
  const [bookingState, setBookingState] = useState({
    loading: false,
    error: "",
  });
  const [slotState, setSlotState] = useState({
    loading: true,
    error: "",
  });


  const selectedService =
    services.find((service) => service.id === selectedServiceId) ?? services[0];
  const groupedSlots = slots.reduce((groups, slot) => {
    const key = toDateKey(slot.time);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(slot);
    return groups;
  }, {});
  const availableDays = Object.keys(groupedSlots);
  const activeDay = selectedSlot
    ? toDateKey(selectedSlot)
    : (availableDays[0] ?? "");
  const visibleSlots = activeDay ? (groupedSlots[activeDay] ?? []) : [];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const selectFirstSlotInMonth = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
      const dKey = new Date(y, m, i).toDateString();
      if (groupedSlots[dKey]) {
        setSelectedSlot(groupedSlots[dKey][0].time);
        return;
      }
    }
  };

  const handlePrevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setViewDate(d);
    selectFirstSlotInMonth(d);
  };
  const handleNextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setViewDate(d);
    selectFirstSlotInMonth(d);
  };

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(viewDate);
  const availableSlotsCount = visibleSlots.reduce((acc, slot) => acc + slot.available, 0);

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      try {
        setSlotState({ loading: true, error: "" });
        const response = await fetch(`${API_BASE}/slots`);

        if (!response.ok) {
          throw new Error("Unable to load appointment slots right now.");
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setSlotState({ loading: false, error: "" });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSlots([]);
        setSlotState({
          loading: false,
          error: error.message || "Unable to load appointment slots right now.",
        });
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slots.length === 0) {
      setSelectedSlot("");
      return;
    }

    if (!selectedSlot || !slots.some(s => s.time === selectedSlot)) {
      setSelectedSlot(slots[0].time);
    }
  }, [slots, selectedSlot]);

  async function refreshSlots() {
    try {
      const response = await fetch(`${API_BASE}/slots`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch {
      // Keep the current view if the refresh fails.
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();

    if (!selectedSlot) {
      setBookingState({ loading: false, error: "Pick a time before booking." });
      return;
    }

    setBookingState({ loading: true, error: "" });
    setBookingReceipt(null);

    try {
      const response = await fetch(`${API_BASE}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          time: selectedSlot,
          serviceId: selectedService.id,
          serviceTitle: selectedService.title,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "That time is no longer available.");
      }

      const receipt = {
        bookingId: data.bookingId,
        name: data.name,
        time: data.time,
        serviceTitle: data.serviceTitle,
        verificationCode: data.verificationCode,
        shopEmail: data.shopEmail,
      };

      setBookingReceipt(receipt);
      setBookingState({ loading: false, error: "" });
      setForm({ name: "", phone: "", email: "", notes: "" });
      await refreshSlots();
    } catch (error) {
      setBookingState({
        loading: false,
        error: error.message || "We could not complete the booking.",
      });
    }
  }


  return (
    <div className="app-shell">
      <div className="backdrop backdrop-one" />
      <div className="backdrop backdrop-two" />

      <header className="topbar">
        <div>
          <p className="eyebrow"><strong>CLASSIQ TOUCH </strong></p>
          <h1>Book your chair with a live check-in code.</h1>
        </div>

        <div className="topbar-badge">
          <span />
          <strong>Walk-ins are limited</strong>
          <small>Open daily 10am to 8pm.</small>
          {/* <Link to="/admin" style={{ marginLeft: '1rem', color: '#d7ac62', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
            ADMIN
          </Link> */}
        </div>
      </header>

      <main className="page-grid">
        <section className="hero-card">
          <div className="hero-copy">
            <p className="section-label">Fresh cuts, clean timing</p>
            <h2>Book a slot, get a verification code, and show up ready.</h2>
            <p>
              Customers pick a time, the backend generates a code, and that code
              is mirrored to the shop notice flow so the chair can be confirmed
              at the door.
            </p>

            <div className="hero-points">
              <div>
                <strong>10am - 8pm</strong>
                <span>daily opening hours</span>
              </div>
              <div>
                <strong>Code</strong>
                <span>generated instantly</span>
              </div>
              <div>
                <strong>Email</strong>
                <span>shop notice ready</span>
              </div>
            </div>
          </div>

          <aside className="hero-slab">
            <div className="slab-card slab-primary">
              <p>Today&apos;s flow</p>
              <strong>Choose a service, pick a time, get the code.</strong>
            </div>
            <div className="slab-card slab-accent">
              <p>Shop-side</p>
              <strong>
                Verification code gets stored and can be checked on arrival.
              </strong>
            </div>
          </aside>
        </section>

        <section className="booking-layout">
          <div className="booking-panel panel-quiet">
            <div className="panel-heading">
              <div>
                <p className="section-label">Choose the service</p>
                <h3>What are you booking?</h3>
              </div>
              <span>{selectedService.duration}</span>
            </div>

            <div className="service-grid">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={`service-card${service.id === selectedServiceId ? " active" : ""}`}
                  onClick={() => setSelectedServiceId(service.id)}
                >
                  <small>{service.duration}</small>
                  <strong>{service.title}</strong>
                  <p>{service.detail}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="booking-panel schedule-panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Pick a slot</p>
                <h3>Available appointment times 10am to 8pm</h3>
              </div>
              {slotState.loading ? (
                <span>Loading</span>
              ) : (
                <span>{availableSlotsCount} spots today</span>
              )}
            </div>

            {slotState.error ? (
              <p className="notice error">{slotState.error}</p>
            ) : null}

            <div className="calendar-container">
              <div className="calendar-header" style={{ cursor: 'pointer' }} onClick={(e) => { if (e.target.tagName !== 'BUTTON') setIsCalendarOpen(!isCalendarOpen); }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}>&lt;</button>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <strong>{monthLabel}</strong>
                  <small style={{color: '#8b7c62', fontSize: '0.7rem'}}>{isCalendarOpen ? 'Tap to close' : 'Tap to expand'}</small>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}>&gt;</button>
              </div>
              
              {isCalendarOpen && (
                <div className="calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} className="cal-day-name">{d}</div>
                  ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="cal-empty" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = new Date(year, month, i + 1);
                  const dateKey = date.toDateString();
                  const hasSlots = !!groupedSlots[dateKey];
                  const isActive = dateKey === activeDay;
                  
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const isPast = date < today;

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!hasSlots || isPast}
                      className={`cal-day-btn${isActive ? " active" : ""}${hasSlots && !isPast ? " has-slots" : ""}`}
                      onClick={() => {
                        if (hasSlots) setSelectedSlot(groupedSlots[dateKey][0].time);
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              )}
            </div>

            <div className={`time-grid${isCalendarOpen ? " one-row" : ""}`}>
              {visibleSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`time-chip${slot.time === selectedSlot ? " active" : ""}`}
                  onClick={() => setSelectedSlot(slot.time)}
                >
                  {formatTimeLabel(slot.time)}
                  <span className="slot-remaining">{slot.available} left</span>
                </button>
              ))}
            </div>

            {selectedSlot ? (
              <p className="slot-note">
                Selected: {formatLongLabel(selectedSlot)}
              </p>
            ) : (
              <p className="slot-note muted">
                Choose a day to unlock the time slots.
              </p>
            )}
          </div>
        </section>

        <section className="form-grid">
          <form
            className="booking-panel booking-form"
            onSubmit={handleBookingSubmit}
          >
            <div className="panel-heading">
              <div>
                <p className="section-label">Reserve the chair</p>
                <h3>Customer details</h3>
              </div>
              <span>{selectedService.title}</span>
            </div>

            <div className="input-grid two-up">
              <label>
                <span>Your name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                <span>Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  autoComplete="tel"
                />
              </label>
            </div>

            <div className="input-grid two-up">
              <label>
                <span>Email</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="Where should the reminder go?"
                  autoComplete="email"
                />
              </label>

              <label>
                <span>Selected time</span>
                <input
                  value={
                    selectedSlot
                      ? formatLongLabel(selectedSlot)
                      : "No slot selected"
                  }
                  readOnly
                />
              </label>
            </div>

            <label>
              <span>Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleInputChange}
                rows="4"
                placeholder="Anything the barbing shop should know before you arrive?"
              />
            </label>

            {bookingState.error ? (
              <p className="notice error">{bookingState.error}</p>
            ) : null}

            <button
              className="primary-button"
              type="submit"
              disabled={bookingState.loading || slotState.loading}
            >
              {bookingState.loading ? "Booking..." : "Book and generate code"}
            </button>

            <p className="fine-print">
              The backend returns a verification code immediately and prepares
              the shop notification using the configured email.
            </p>
          </form>

          <aside className="booking-panel receipt-panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Post-booking receipt</p>
                <h3>Verification code</h3>
              </div>
              <span>Counter ready</span>
            </div>

            {bookingReceipt ? (
              <div className="receipt-card">
                <p>Your code</p>
                <strong>{bookingReceipt.verificationCode}</strong>
                <span>
                  {bookingReceipt.name} · {formatLongLabel(bookingReceipt.time)}
                </span>
                <small>
                  {bookingReceipt.shopEmail
                    ? `Shop notice queued to ${bookingReceipt.shopEmail}.`
                    : "Shop notice is wired through the server and can use your email config later."}
                </small>
              </div>
            ) : (
              <div className="receipt-placeholder">
                <p>No booking yet</p>
                <span>The code will appear here once a slot is reserved.</span>
              </div>
            )}


          </aside>
        </section>
      </main>

      <footer className="footer-bar">
        <div>
          <strong>By appointment only</strong>
          <p>Sharp timing, clean check-in, no generic booking filler.</p>
        </div>
        <div>
          <strong>Arrival flow</strong>
          <p>
            Show your code at the counter — the shop verifies it at the door.
          </p>
        </div>
        <div>
          <strong>Open daily 10am – 8pm</strong>
          <p>Walk-ins are limited. Book a slot to guarantee your chair.</p>
        </div>
      </footer>
      <div className="footer-copy">
        <strong>CLASSIQ TOUCH</strong> &copy; {new Date().getFullYear()} · All rights reserved.
      </div>
    </div>
  );
}

export default App;
