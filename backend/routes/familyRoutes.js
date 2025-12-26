// routes/familyRoutes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import { addFamilyMember, removeFamilyMember, sendSosAlert } from "../controllers/familyController.js";

const router = express.Router();

router.post("/add", protect, addFamilyMember);
router.post("/remove",protect, removeFamilyMember);
router.post("/sos", protect, sendSosAlert);

export default router;

