import getmedicines from "../controllers/Medicines.js";
import express from "express";
const router = express.Router();

// Route to get medicine information by name
router.get("/medicines/:name", getmedicines);

export default router;