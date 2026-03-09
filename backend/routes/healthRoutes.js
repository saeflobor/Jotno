import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getHealthSummary,
  getChronicConditions,
  addChronicCondition,
  addChronicConditionForUser,
  deleteChronicCondition,
  deleteChronicConditionForUser,
  getMedications,
  addMedication,
  updateMedication,
  addMedicationForUser,
  deleteMedication,
  deleteMedicationForUser,
  checkMedicationReminders,
} from "../controllers/healthController.js";

const router = express.Router();

// Health summary route
router.get("/summary", protect, getHealthSummary);

// Chronic Conditions routes
router.get("/chronic-conditions", protect, getChronicConditions);
router.post("/chronic-conditions", protect, addChronicCondition);
router.post(
  "/chronic-conditions-for-user",
  protect,
  addChronicConditionForUser,
);
router.delete("/chronic-conditions/:id", protect, deleteChronicCondition);
router.delete(
  "/chronic-conditions-for-user/:targetUserId/:conditionId",
  protect,
  deleteChronicConditionForUser,
);

// Medications routes
router.get("/medications", protect, getMedications);
router.post("/medications", protect, addMedication);
router.put("/medications/:id", protect, updateMedication);
router.post("/medications-for-user", protect, addMedicationForUser);
router.delete("/medications/:id", protect, deleteMedication);
router.delete(
  "/medications-for-user/:targetUserId/:medicationId",
  protect,
  deleteMedicationForUser,
);

// Manual trigger for medication reminders (optional, useful for testing)
router.get("/reminders/check", checkMedicationReminders);

export default router;
