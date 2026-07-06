require("dotenv").config();
const mongoose = require("mongoose");

async function testConnection() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ SUCCESS! Connected to MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: Could not connect to MongoDB.", error.message);
    process.exit(1);
  }
}

testConnection();
