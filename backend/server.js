import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authroutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import errorHandler from "./middleware/errorhandler.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 5001;

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", authRoutes);
app.use("/api/family", familyRoutes);
app.use(errorHandler);

// <-- Mount family routes

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
