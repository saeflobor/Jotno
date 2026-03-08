import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import { getAISummary } from "../controllers/aiSummaryController.js";
import { extractPrescription } from "../controllers/prescriptionExtractorController.js";

const router = express.Router();

// Multer setup for single PDF upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.get("/summary", protect, getAISummary);
router.post("/extract-prescription", protect, upload.single("file"), extractPrescription);

export default router;
