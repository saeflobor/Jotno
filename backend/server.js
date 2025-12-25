import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import familyRoutes from './routes/familyRoutes.js'; // <-- Import family routes
import { connectDB } from './config/db.js';
dotenv.config({ path: '../.env' });

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/users", authRoutes);
app.use("/api/family", familyRoutes); // <-- Mount family routes

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
