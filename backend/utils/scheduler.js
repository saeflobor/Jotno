import { checkMedicationReminders } from "../controllers/healthController.js";

export const startScheduler = () => {
  console.log("Starting medication reminder scheduler...");
  
  // Schedule task to run every minute
  // We use setInterval for simplicity and robust cross-platform support without native deps
  setInterval(() => {
    console.log("Running medication reminder task...");
    checkMedicationReminders(); // Call without req, res
  }, 60 * 1000); // 60 seconds
};
