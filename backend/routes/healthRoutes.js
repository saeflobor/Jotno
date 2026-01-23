import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getHealthSummary,
  getChronicConditions,
  addChronicCondition,
  deleteChronicCondition,
  getMedications,
  addMedication,
  deleteMedication,
  checkMedicationReminders,
} from "../controllers/healthController.js";

const router = express.Router();

// Health summary route
router.get("/summary", protect, getHealthSummary);

// Chronic Conditions routes
router.get("/chronic-conditions", protect, getChronicConditions);
router.post("/chronic-conditions", protect, addChronicCondition);
router.delete("/chronic-conditions/:id", protect, deleteChronicCondition);

// Medications routes
router.get("/medications", protect, getMedications);
router.post("/medications", protect, addMedication);
router.delete("/medications/:id", protect, deleteMedication);

// Manual trigger for medication reminders (optional, useful for testing)
router.get("/reminders/check", checkMedicationReminders);

export default router;
