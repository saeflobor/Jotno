import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Configure Cloudinary immediately after dotenv loads
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import express from "express";
import authRoutes from "./routes/authroutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import medicalReportRoutes from "./routes/medicalReportRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import errorHandler from "./middleware/errorhandler.js";
import medicineRoutes from "./routes/Medicines.js";
import { connectDB } from "./config/db.js";
import { checkMedicationReminders } from "./controllers/healthController.js";


const PORT = process.env.PORT || 5001;

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", authRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/medical-report", medicalReportRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api", medicineRoutes); // <-- Mount medicine routes here
app.use(errorHandler);

// <-- Mount family routes

// Connect to MongoDB
connectDB();

// Schedule task to run every minute using setInterval (native alternative to node-cron)
setInterval(() => {
  console.log("Running medication reminder task...");
  checkMedicationReminders(); // Call without req, res
}, 60 * 1000); // 60 seconds

// Start server
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
