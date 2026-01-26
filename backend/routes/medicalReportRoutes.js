import express from "express";
import { protect } from "../middleware/auth.js";
import medicalReportController from "../controllers/medicalReportController.js";
import MedicalReport from "../models/MedicalReport.js";

const router = express.Router();

// POST /api/medical-report -> upload one or multiple files and save records
router.post(
  "/",
  protect,
  medicalReportController.uploadMiddleware.array("files", 10),
  medicalReportController.uploadMedicalReport,
);

// POST /api/medical-report/for-user -> upload for a family member (if private: false)
router.post(
  "/for-user",
  protect,
  medicalReportController.uploadMiddleware.array("files", 10),
  medicalReportController.uploadMedicalReportForUser,
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

// DELETE /api/medical-report/for-user/:targetUserId/:reportId -> delete family member's report (if private: false)
router.delete(
  "/for-user/:targetUserId/:reportId",
  protect,
  medicalReportController.deleteMedicalReportForUser,
);

// PATCH /api/medical-report/:id/privacy -> toggle privacy
router.patch(
  "/:id/privacy",
  protect,
  medicalReportController.toggleReportPrivacy,
);

export default router;
