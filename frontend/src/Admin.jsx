import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5390/api";

// Password — set VITE_ADMIN_PASSWORD in .env to override
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "classiq2025";
const SESSION_KEY = "classiq-admin-auth";

function formatDateTime(iso) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TABS = ["All", "Upcoming", "Past"];

/* ─────────────────────────────────────
   LOGIN SCREEN
───────────────────────────────────── */
function LoginScreen({ onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onAuth();
    } else {
      setError("Incorrect password. Try again.");
      setShaking(true);
      setPw("");
      setTimeout(() => setShaking(false), 500);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="login-shell">
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />

      <div className={`login-card${shaking ? " login-card--shake" : ""}`}>
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <span className="login-eyebrow">CLASSIQ TOUCH</span>
            <h1 className="login-title">Admin Access</h1>
          </div>
        </div>

        <p className="login-sub">
          Enter the admin password to access the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-wrap">
            <svg className="login-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              ref={inputRef}
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              placeholder="Enter password"
              className="login-input"
              autoComplete="current-password"
              id="admin-password-input"
            />
            <button
              type="button"
              className="login-eye-btn"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPw ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {error && (
            <p className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </p>
          )}

          <button type="submit" className="login-btn" id="admin-login-submit">
            <span>Unlock Dashboard</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </form>

        <p className="login-hint">
          Default password: <code>classiq2025</code> — set{" "}
          <code>VITE_ADMIN_PASSWORD</code> in <code>.env</code> to change it.
        </p>

        <Link to="/booking" className="login-back">
          ← Back to booking page
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────── */
function Dashboard({ onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Upcoming");

  // Verify panel
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  // Mark arrived (inline, per row)
  const [markingId, setMarkingId] = useState(null);

  // Search
  const [search, setSearch] = useState("");

  // Auto-refresh
  const intervalRef = useRef(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadBookings();
    intervalRef.current = setInterval(() => loadBookings(true), 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function loadBookings(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/admin/bookings`);
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || "Unable to load bookings");
      if (!silent) setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Verify via code input ──
  async function handleVerifySubmit(e) {
    e.preventDefault();
    if (!verifyCode.trim()) { setVerifyError("Enter a verification code"); return; }
    setVerifyLoading(true);
    setVerifyError("");
    setVerifyResult(null);
    setVerifySuccess(false);
    try {
      const res = await fetch(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Code not found");
      setVerifyResult(data.booking);
      setVerifySuccess(true);
      setVerifyCode("");
      await loadBookings(true);
    } catch (err) {
      setVerifyError(err.message || "Unable to verify code");
    } finally {
      setVerifyLoading(false);
    }
  }

  // ── Mark arrived inline (from the row button) ──
  async function handleMarkArrived(booking) {
    setMarkingId(booking.id);
    try {
      const res = await fetch(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: booking.verificationCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      await loadBookings(true);
    } catch (err) {
      // show nothing — booking will just stay pending; silent fail
      console.error("Mark arrived failed:", err.message);
    } finally {
      setMarkingId(null);
    }
  }

  const now = new Date();
  const upcoming = bookings.filter((b) => new Date(b.time) > now);
  const past = bookings.filter((b) => new Date(b.time) <= now);
  const verified = bookings.filter((b) => b.verifiedAt);
  const noshow = past.filter((b) => !b.verifiedAt);

  function getTabData() {
    let list =
      activeTab === "Upcoming" ? upcoming
      : activeTab === "Past" ? past
      : bookings;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.phone?.toLowerCase().includes(q) ||
          b.serviceTitle?.toLowerCase().includes(q) ||
          b.verificationCode?.toLowerCase().includes(q)
      );
    }
    return list;
  }

  const filteredBookings = getTabData();

  return (
    <div className="adm-shell">
      <div className="adm-glow adm-glow-1" />
      <div className="adm-glow adm-glow-2" />

      {/* HEADER */}
      <header className="adm-header">
        <div className="adm-brand">
          <div className="adm-brand-dot" />
          <div>
            <span className="adm-eyebrow">CLASSIQ TOUCH</span>
            <h1 className="adm-title">Admin Dashboard</h1>
          </div>
        </div>
        <div className="adm-header-right">
          <span className="adm-refresh-hint">Updated {timeAgo(lastRefresh.toISOString())}</span>
          <button className="adm-icon-btn" onClick={() => loadBookings()} title="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <Link to="/booking" className="adm-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Booking Page
          </Link>
          <button className="adm-logout-btn" onClick={onLogout} title="Lock dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="adm-main">
        {/* STATS */}
        <section className="adm-stats">
          <div className="adm-stat-card">
            <div className="adm-stat-icon adm-stat-icon--total">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <p className="adm-stat-label">Total Booked</p>
              <p className="adm-stat-value">{bookings.length}</p>
            </div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-icon adm-stat-icon--upcoming">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <p className="adm-stat-label">Upcoming</p>
              <p className="adm-stat-value">{upcoming.length}</p>
            </div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-icon adm-stat-icon--verified">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p className="adm-stat-label">Verified</p>
              <p className="adm-stat-value">{verified.length}</p>
            </div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-icon adm-stat-icon--noshow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <div>
              <p className="adm-stat-label">No-shows</p>
              <p className="adm-stat-value">{noshow.length}</p>
            </div>
          </div>
        </section>

        <div className="adm-body">
          {/* VERIFY PANEL */}
          <aside className="adm-verify-panel">
            <div className="adm-panel-head">
              <span className="adm-panel-label">Check-in Scanner</span>
              <h2 className="adm-panel-title">Verify a Code</h2>
              <p className="adm-panel-sub">Enter a CT code, or click <strong>Mark Arrived</strong> on any row.</p>
            </div>

            <div className={`adm-scanner${verifySuccess ? " adm-scanner--success" : verifyError ? " adm-scanner--error" : ""}`}>
              <div className="adm-scanner-corner adm-scanner-corner--tl" />
              <div className="adm-scanner-corner adm-scanner-corner--tr" />
              <div className="adm-scanner-corner adm-scanner-corner--bl" />
              <div className="adm-scanner-corner adm-scanner-corner--br" />
              {verifySuccess ? (
                <div className="adm-scanner-inner">
                  <div className="adm-scanner-check">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="adm-scanner-status adm-scanner-status--ok">Verified!</p>
                </div>
              ) : verifyError ? (
                <div className="adm-scanner-inner">
                  <div className="adm-scanner-x">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                  <p className="adm-scanner-status adm-scanner-status--err">Not found</p>
                </div>
              ) : (
                <div className="adm-scanner-inner">
                  <div className="adm-scanner-code-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                      <rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
                    </svg>
                  </div>
                  <p className="adm-scanner-status adm-scanner-status--idle">Awaiting code</p>
                </div>
              )}
              <div className="adm-scanner-line" />
            </div>

            <form onSubmit={handleVerifySubmit} className="adm-verify-form">
              <div className="adm-code-input-wrap">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => { setVerifyCode(e.target.value.toUpperCase()); setVerifyError(""); setVerifySuccess(false); setVerifyResult(null); }}
                  placeholder="CT-123456"
                  autoComplete="off"
                  className="adm-code-input"
                  id="verify-code-input"
                />
                <button type="submit" disabled={verifyLoading} className="adm-verify-btn">
                  {verifyLoading ? <span className="adm-spinner" /> : "Verify"}
                </button>
              </div>
              {verifyError && <p className="adm-verify-msg adm-verify-msg--err">{verifyError}</p>}
            </form>

            {verifyResult && verifySuccess && (
              <div className="adm-verified-card">
                <div className="adm-verified-row"><span className="adm-verified-label">Name</span><span className="adm-verified-val">{verifyResult.name}</span></div>
                <div className="adm-verified-row"><span className="adm-verified-label">Service</span><span className="adm-verified-val">{verifyResult.serviceTitle || "—"}</span></div>
                <div className="adm-verified-row"><span className="adm-verified-label">Time</span><span className="adm-verified-val">{formatDateTime(verifyResult.time)}</span></div>
                <div className="adm-verified-row"><span className="adm-verified-label">Code</span><code className="adm-verified-code">{verifyResult.verificationCode}</code></div>
              </div>
            )}
          </aside>

          {/* SCHEDULE LIST */}
          <section className="adm-schedule">
            <div className="adm-schedule-head">
              <div className="adm-tabs">
                {TABS.map((tab) => (
                  <button key={tab} className={`adm-tab${activeTab === tab ? " adm-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                    {tab}
                    <span className="adm-tab-count">
                      {tab === "All" ? bookings.length : tab === "Upcoming" ? upcoming.length : past.length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="adm-search-wrap">
                <svg className="adm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" className="adm-search" placeholder="Search by name, code, service…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="adm-col-header">
              <span>Date &amp; Time</span>
              <span>Customer</span>
              <span>Service</span>
              <span>Code</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {loading && (
              <div className="adm-loading-state">
                {[1, 2, 3, 4].map((i) => <div key={i} className="adm-skeleton-row" />)}
              </div>
            )}

            {error && (
              <div className="adm-error-state">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p>{error}</p>
                <button onClick={() => loadBookings()}>Try again</button>
              </div>
            )}

            {!loading && !error && filteredBookings.length === 0 && (
              <div className="adm-empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>{search ? "No results match your search." : "No appointments in this view."}</p>
              </div>
            )}

            <div className="adm-rows">
              {filteredBookings.map((booking) => {
                const isPast = new Date(booking.time) <= now;
                const isVerified = !!booking.verifiedAt;
                const isMarking = markingId === booking.id;
                const canMark = !isVerified;

                return (
                  <div key={booking.id} className={`adm-row${isPast ? " adm-row--past" : ""}${isVerified ? " adm-row--verified" : ""}`}>
                    <div className="adm-row-datetime">
                      <span className="adm-row-date">{formatDate(booking.time)}</span>
                      <span className="adm-row-time">{formatTime(booking.time)}</span>
                    </div>
                    <div className="adm-row-customer">
                      <span className="adm-row-name">{booking.name}</span>
                      <span className="adm-row-phone">{booking.phone || "No phone"}</span>
                    </div>
                    <div className="adm-row-service">
                      <span>{booking.serviceTitle || "—"}</span>
                    </div>
                    <div className="adm-row-code-cell">
                      <code className="adm-booking-code">{booking.verificationCode}</code>
                    </div>
                    <div className="adm-row-status-cell">
                      {isVerified ? (
                        <span className="adm-badge adm-badge--verified">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          Verified
                        </span>
                      ) : isPast ? (
                        <span className="adm-badge adm-badge--noshow">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          No-show
                        </span>
                      ) : (
                        <span className="adm-badge adm-badge--pending">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/></svg>
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="adm-row-action-cell">
                      {canMark ? (
                        <button
                          className="adm-arrived-btn"
                          onClick={() => handleMarkArrived(booking)}
                          disabled={isMarking}
                          title="Mark customer as arrived"
                        >
                          {isMarking ? (
                            <span className="adm-spinner adm-spinner--dark" />
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Arrived
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="adm-arrived-done">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────
   ROOT — handles auth gate
───────────────────────────────────── */
function Admin() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  }

  if (!authed) {
    return <LoginScreen onAuth={() => setAuthed(true)} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}

export default Admin;
