import express from "express";
import { register, Login, UserDetails, verifyemail, updateProfile, verifyEmailChange, forgotPassword, resetPassword } from "../controllers/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/verifyemail", verifyemail);
router.post("/verify-email-change", verifyEmailChange);
router.post("/register", register);
router.post("/login",Login);
router.get("/me", protect, UserDetails);
router.put("/update", protect, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;