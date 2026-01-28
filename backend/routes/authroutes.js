import express from "express";
import { register, Login, UserDetails, verifyemail, updateProfile, verifyEmailChange } from "../controllers/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/verifyemail", verifyemail);
router.post("/verify-email-change", verifyEmailChange);
router.post("/register", register);
router.post("/login",Login);
router.get("/me", protect, UserDetails);
router.put("/update", protect, updateProfile);

export default router;