import getmedicines, { getFilters } from "../controllers/Medicines.js";
import express from "express";
const router = express.Router();

// Route to get filter options (dosage forms, manufacturers)
router.get("/medicines/filters", getFilters);

// Route to get medicine information (supports ?q=, ?dosage_form=, ?manufacturer=, ?page=, ?limit=)
router.get("/medicines", getmedicines);

// Backwards-compatible path-param search
router.get("/medicines/:name", getmedicines);

export default router;