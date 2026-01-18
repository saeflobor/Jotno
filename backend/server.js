import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authroutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import medicalReportRoutes from "./routes/medicalReportRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import errorHandler from "./middleware/errorhandler.js";
import { connectDB } from "./config/db.js";

dotenv.config();

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
app.use(errorHandler);

// <-- Mount family routes

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
