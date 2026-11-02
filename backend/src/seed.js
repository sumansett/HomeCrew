// Run once:  npm run seed
// Creates the first admin account and the default services.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");
const Service = require("./models/Service");

const services = [
  { name: "Electrical Work", category: "Electrical", icon: "⚡", startingPrice: 299, description: "Wiring, switches, fans, lights, MCB and short-circuit repairs by electricians." },
  { name: "Plumbing", category: "Plumbing", icon: "🚰", startingPrice: 249, description: "Leakage fixing, tap and pipe repair, bathroom fittings and tank cleaning." },
  { name: "Carpentry", category: "Carpentry", icon: "🪚", startingPrice: 349, description: "Furniture repair, door and window fixing, modular work and custom woodwork." },
  { name: "Painting", category: "Painting", icon: "🎨", startingPrice: 999, description: "Interior and exterior wall painting, waterproofing and touch-ups." },
  { name: "AC Servicing", category: "Appliance", icon: "❄️", startingPrice: 499, description: "AC installation, gas refilling, deep cleaning and general servicing." },
  { name: "Appliance Repair", category: "Appliance", icon: "🔧", startingPrice: 399, description: "Washing machine, refrigerator, microwave, geyser and TV repair." },
  { name: "Home Cleaning", category: "Cleaning", icon: "🧹", startingPrice: 599, description: "Full home, kitchen and bathroom deep cleaning with trained staff." },
];

(async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || "admin@homecrew.com").toLowerCase();
  if (!(await Admin.findOne({ email }))) {
    await Admin.create({
      name: process.env.ADMIN_NAME || "HomeCrew Admin",
      email,
      password: process.env.ADMIN_PASSWORD || "admin123",
    });
    console.log("Admin created:", email);
  } else {
    console.log("Admin already exists:", email);
  }

  for (const s of services) {
    await Service.updateOne({ name: s.name }, { $setOnInsert: s }, { upsert: true });
  }
  console.log("Services ready:", await Service.countDocuments());

  await mongoose.disconnect();
  process.exit(0);
})();
