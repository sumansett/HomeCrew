const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

const mongoose = require("mongoose");

// Connects to MongoDB (local MongoDB Compass server or Atlas)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected:", mongoose.connection.name);

    // Ensure email index is sparse and phone index is unique on both collections
    const User = require("../models/User");
    const Professional = require("../models/Professional");

    for (const Model of [User, Professional]) {
      try {
        const collection = Model.collection;
        const indexes = await collection.indexes().catch(() => []);
        const emailIdx = indexes.find((idx) => idx.name === "email_1");
        if (emailIdx && !emailIdx.sparse) {
          console.log(`Dropping non-sparse email_1 index on ${collection.collectionName}`);
          await collection.dropIndex("email_1").catch(() => {});
        }
        await Model.syncIndexes().catch(() => {});
      } catch (idxErr) {
        console.warn("Index setup notice:", idxErr.message);
      }
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
