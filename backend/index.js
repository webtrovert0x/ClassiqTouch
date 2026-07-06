require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

const SLOT_MINUTES = 20;
const SLOT_CAPACITY = 3; // bookings allowed per 20-min slot (3 chairs × 30 slots = 90/day)
const OPEN_HOUR = 10;
const CLOSE_HOUR = 20;
const SHOP_TIMEZONE_OFFSET = 1; // Africa/Lagos is UTC+1

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  notes: { type: String, default: "" },
  serviceId: { type: String, default: "" },
  serviceTitle: { type: String, default: "" },
  time: { type: String, required: true },
  verificationCode: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
  verifiedAt: { type: String, default: "" },
});

const Booking = mongoose.model("Booking", bookingSchema);

function generateVerificationCode() {
  return `CT-${crypto.randomInt(100000, 1000000)}`;
}

function getShopNotificationEmail() {
  return (
    process.env.SHOP_OFFICIAL_EMAIL ||
    process.env.SHOP_EMAIL ||
    process.env.BARBER_SHOP_EMAIL ||
    ""
  );
}

let sharedTransporter = null;
function getTransporter() {
  if (sharedTransporter) return sharedTransporter;
  
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  if (!smtpUser || !smtpPass) return null;

  sharedTransporter = nodemailer.createTransport({
    pool: true,
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: smtpUser, pass: smtpPass },
  });
  
  return sharedTransporter;
}

async function notifyShopByEmail(booking) {
  const shopEmail = getShopNotificationEmail();

  if (!shopEmail) {
    console.log("[email] SHOP_OFFICIAL_EMAIL not set — skipping.");
    return;
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log("[email] SMTP credentials not set — booking logged only:", booking.verificationCode);
    return;
  }

  const smtpUser = process.env.SMTP_USER || "";

  const bookingTime = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(booking.time));

  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || `Classiq Touch <${smtpUser}>`,
      to: shopEmail,
      subject: `New booking: ${booking.verificationCode}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
          <h2 style="color:#b8860b">New Booking @ClassiqTouch</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#555;width:140px"><strong>Code</strong></td><td style="padding:8px 0;font-size:1.2em;font-weight:bold;color:#b8860b">${booking.verificationCode}</td></tr>
            <tr><td style="padding:8px 0;color:#555"><strong>Customer</strong></td><td style="padding:8px 0">${booking.name}</td></tr>
            <tr><td style="padding:8px 0;color:#555"><strong>Phone</strong></td><td style="padding:8px 0">${booking.phone || "Not provided"}</td></tr>
            <tr><td style="padding:8px 0;color:#555"><strong>Email</strong></td><td style="padding:8px 0">${booking.email || "Not provided"}</td></tr>
            <tr><td style="padding:8px 0;color:#555"><strong>Service</strong></td><td style="padding:8px 0">${booking.serviceTitle || "Not specified"}</td></tr>
            <tr><td style="padding:8px 0;color:#555"><strong>Time</strong></td><td style="padding:8px 0">${bookingTime}</td></tr>
            <tr><td style="padding:8px 0;color:#555"><strong>Notes</strong></td><td style="padding:8px 0">${booking.notes || "None"}</td></tr>
          </table>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee">
          <p style="color:#888;font-size:0.9em">Customer will present code <strong>${booking.verificationCode}</strong> at the door.</p>
        </div>
      `,
    });
    console.log("[email] Shop notified:", result.messageId);
  } catch (err) {
    console.error("[email] Shop notify failed:", err.message);
  }
}

// Confirmation email to the customer
async function sendCustomerConfirmation(booking) {
  if (!booking.email) return; // customer didn't provide email

  const transporter = getTransporter();
  if (!transporter) return;

  const smtpUser = process.env.SMTP_USER || "";

  const bookingTime = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(booking.time));

  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || `Classiq Touch <${smtpUser}>`,
      to: booking.email,
      subject: `Your Classiq Touch booking confirmation code: ${booking.verificationCode}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0d0b09;color:#f1eadf;padding:32px;border-radius:12px">
          <h2 style="color:#d7ac62;margin:0 0 8px">Booking Confirmed</h2>
          <p style="color:#b2a691;margin:0 0 24px">See you at the shop, ${booking.name.split(' ')[0]}!</p>

          <div style="background:#1a140e;border:1px solid #3a2e20;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
            <p style="margin:0 0 4px;color:#7a6e60;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase">Your Check-in Code</p>
            <p style="margin:0;font-size:2em;font-weight:bold;color:#d7ac62;letter-spacing:0.1em">${booking.verificationCode}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#7a6e60;width:100px">Service</td><td style="padding:8px 0;color:#f1eadf">${booking.serviceTitle || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#7a6e60">Date &amp; Time</td><td style="padding:8px 0;color:#f1eadf">${bookingTime}</td></tr>
            <tr><td style="padding:8px 0;color:#7a6e60">Name</td><td style="padding:8px 0;color:#f1eadf">${booking.name}</td></tr>
          </table>

          <p style="color:#7a6e60;font-size:0.85em;border-top:1px solid #2a2018;padding-top:16px;margin:0">
            Show code <strong style="color:#d7ac62">${booking.verificationCode}</strong> at the counter on arrival.
          </p>
        </div>
      `,
    });
    console.log("[email] Customer confirmed:", result.messageId);
  } catch (err) {
    console.error("[email] Customer confirm failed:", err.message);
  }
}

app.use(cors()); // allow React to talk to Node
app.use(express.json()); // parse JSON bodies

app.get("/api/time", (req, res) => {
  res.json({ serverTime: new Date() });
});

// Helper: round a Date up to the next 20-minute slot
function roundToNextSlot(date, slotMinutes = SLOT_MINUTES) {
  const d = new Date(date.getTime());
  const ms = slotMinutes * 60 * 1000;
  const remainder = d.getTime() % ms;
  if (remainder !== 0) {
    d.setTime(d.getTime() + (ms - remainder));
  }
  d.setSeconds(0, 0);
  return d;
}

function getBusinessWindow(date) {
  const opening = new Date(date.getTime());
  opening.setUTCHours(OPEN_HOUR - SHOP_TIMEZONE_OFFSET, 0, 0, 0);

  const closing = new Date(date.getTime());
  closing.setUTCHours(CLOSE_HOUR - SHOP_TIMEZONE_OFFSET, 0, 0, 0);

  return { opening, closing };
}

function getNextBusinessSlot(date) {
  const nextSlot = roundToNextSlot(date);
  const { opening, closing } = getBusinessWindow(nextSlot);

  if (nextSlot < opening) {
    return opening;
  }

  if (nextSlot >= closing) {
    const nextDay = new Date(nextSlot.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setUTCHours(OPEN_HOUR - SHOP_TIMEZONE_OFFSET, 0, 0, 0);
    return nextDay;
  }

  return nextSlot;
}

function isWithinBusinessHours(date) {
  const { opening, closing } = getBusinessWindow(date);
  return date >= opening && date < closing;
}

// Helper: generate the next N available 20-minute slots from now
async function getNextAvailableSlots(count = 10950, slotMinutes = SLOT_MINUTES) {
  const now = new Date();
  
  // Fetch all future bookings from DB
  const futureBookings = await Booking.find({ time: { $gte: now.toISOString() } });

  let slot = getNextBusinessSlot(now);
  const slots = [];

  while (slots.length < count) {
    const { opening, closing } = getBusinessWindow(slot);

    if (slot < opening) {
      slot = opening;
    }

    if (slot >= closing) {
      const nextDay = new Date(slot.getTime());
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setUTCHours(OPEN_HOUR - SHOP_TIMEZONE_OFFSET, 0, 0, 0);
      slot = nextDay;
      continue;
    }

    const slotIso = slot.toISOString();
    const slotBookings = futureBookings.filter((b) => b.time === slotIso).length;
    if (slotBookings < SLOT_CAPACITY) {
      slots.push({ time: slotIso, available: SLOT_CAPACITY - slotBookings });
    }
    slot = new Date(slot.getTime() + slotMinutes * 60 * 1000);
  }

  return slots;
}

// Get a list of upcoming available 20-minute slots
app.get("/api/version", (req, res) => res.json({ version: "v3-mongodb", OPEN_HOUR, SHOP_TIMEZONE_OFFSET }));
app.get("/api/test-slots", async (req, res) => { res.json({ slots: await getNextAvailableSlots(5) }); });
app.get("/api/test-time", (req, res) => {
  const now = new Date("2026-07-06T19:00:00.000Z");
  res.json({ slot1: getNextBusinessSlot(now), window: getBusinessWindow(now) });
});
app.get("/api/slots", async (req, res) => {
  try {
    const slots = await getNextAvailableSlots();
    res.json({ slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load slots" });
  }
});

// Book a 20-minute slot if it is still available
app.post("/api/book", async (req, res) => {
  const { name, time, phone, email, notes, serviceId, serviceTitle } = req.body;

  if (!name || !time) {
    return res
      .status(400)
      .json({ success: false, message: "Name and time are required" });
  }

  const slotDate = new Date(time);
  if (Number.isNaN(slotDate.getTime())) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid time format" });
  }

  const normalisedSlot = roundToNextSlot(slotDate);
  if (!isWithinBusinessHours(normalisedSlot)) {
    return res.status(400).json({
      success: false,
      message: "Bookings are only available between 10:00 AM and 8:00 PM",
    });
  }

  const slotIso = normalisedSlot.toISOString();

  try {
    const slotBookings = await Booking.countDocuments({ time: slotIso });
    if (slotBookings >= SLOT_CAPACITY) {
      return res
        .status(409)
        .json({ success: false, message: "This time slot is fully booked" });
    }

    const verificationCode = generateVerificationCode();
    const booking = new Booking({
      id: crypto.randomUUID(),
      name,
      phone: typeof phone === "string" ? phone : "",
      email: typeof email === "string" ? email : "",
      notes: typeof notes === "string" ? notes : "",
      serviceId: typeof serviceId === "string" ? serviceId : "",
      serviceTitle: typeof serviceTitle === "string" ? serviceTitle : "",
      time: slotIso,
      verificationCode,
      createdAt: new Date().toISOString(),
      verifiedAt: "",
    });

    await booking.save();
    // Await emails because Vercel/serverless environments freeze the process after res.json()
    await Promise.allSettled([
      notifyShopByEmail(booking),       // → shop owner
      sendCustomerConfirmation(booking) // → customer (if email provided)
    ]);

    res.json({
      success: true,
      bookingId: booking.id,
      name: booking.name,
      time: slotIso,
      verificationCode,
      serviceTitle: booking.serviceTitle,
      shopEmail: getShopNotificationEmail() || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/api/verify", async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Verification code is required" });
  }

  try {
    const booking = await Booking.findOne({ verificationCode: code.trim().toUpperCase() });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "No booking matches that code" });
    }

    if (!booking.verifiedAt) {
      booking.verifiedAt = new Date().toISOString();
      await booking.save();
    }

    res.json({
      success: true,
      booking: {
        id: booking.id,
        name: booking.name,
        time: booking.time,
        serviceTitle: booking.serviceTitle,
        verificationCode: booking.verificationCode,
        verifiedAt: booking.verifiedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Admin endpoint to list all bookings (for shop use)
app.get("/api/admin/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ time: -1 });
    const listOrder = bookings.map((booking) => ({
      id: booking.id,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      time: booking.time,
      serviceTitle: booking.serviceTitle,
      verificationCode: booking.verificationCode,
      verifiedAt: booking.verifiedAt || null,
      notes: booking.notes,
    }));

    res.json({
      success: true,
      bookings: listOrder,
      total: bookings.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

const PORT = 5390;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
