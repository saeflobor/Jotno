import express from "express";
import { register, Login, UserDetails, verifyemail } from "../controllers/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/verifyemail", verifyemail);
router.post("/register", register);
router.post("/login",Login);
router.get("/me", protect, UserDetails)

export default router;