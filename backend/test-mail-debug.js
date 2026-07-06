require("dotenv").config();
const nodemailer = require("nodemailer");

async function testMail() {
  console.time("mail");
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: smtpPass },
    logger: true,
    debug: true
  });
  
  try {
    const result = await transporter.sendMail({
      from: smtpUser,
      to: smtpUser,
      subject: "Test email 465",
      text: "This is a test email on port 465.",
    });
    console.log("Success 465:", result.messageId);
  } catch (err) {
    console.error("Error sending mail 465:", err);
  }
  console.timeEnd("mail");
}
testMail();
