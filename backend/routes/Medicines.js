import getmedicines from "../controllers/Medicines.js";
import express from "express";
const router = express.Router();

// Route to get medicine information by name (name is optional)
router.get("/medicines", getmedicines);
router.get("/medicines/:name", getmedicines);

export default router;