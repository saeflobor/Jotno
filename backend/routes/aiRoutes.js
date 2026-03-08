import express from "express";
import { protect } from "../middleware/auth.js";
import { getAISummary } from "../controllers/aiSummaryController.js";

const router = express.Router();

router.get("/summary", protect, getAISummary);

export default router;
