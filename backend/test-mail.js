require("dotenv").config();
const nodemailer = require("nodemailer");

async function testMail() {
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";

  if (!smtpUser || !smtpPass) {
    console.log("No credentials");
    return;
  }
  
  console.log("User:", smtpUser);
  console.log("Pass:", smtpPass ? "SET" : "NOT SET");
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: smtpUser, pass: smtpPass },
  });
  
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: process.env.SHOP_OFFICIAL_EMAIL,
      subject: "Test email",
      text: "This is a test email.",
    });
    console.log("Success:", result.messageId);
  } catch (err) {
    console.error("Error sending mail:", err);
  }
}
testMail();
