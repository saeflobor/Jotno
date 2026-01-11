import express from "express";
import { protect } from "../middleware/auth.js";
import medicalReportController from "../controllers/medicalReportController.js";
import MedicalReport from "../models/MedicalReport.js";

const router = express.Router();

// POST /api/medical-report -> upload a file and save record
router.post(
  "/",
  protect,
  medicalReportController.uploadMiddleware.single("file"),
  medicalReportController.uploadMedicalReport
);

// GET /api/medical-report -> list reports for the authenticated user
router.get("/", protect, async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const reports = await MedicalReport.find({ owner: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ reports });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/medical-report/:id -> delete a report
router.delete("/:id", protect, medicalReportController.deleteMedicalReport);

export default router;
