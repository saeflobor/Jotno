// routes/familyRoutes.js
import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addFamilyMember,
  removeFamilyMember,
  sendSosAlert,
  getFamilyMemberMedications,
  getFamilyMemberConditions,
  getFamilyMemberReports,
  sendFamilyRequest,
  getPendingRequests,
  getSentRequests,
  acceptFamilyRequest,
  declineFamilyRequest,
  cancelFamilyRequest,
} from "../controllers/familyController.js";

const router = express.Router();

router.post("/add", protect, addFamilyMember);
router.post("/remove", protect, removeFamilyMember);
router.post("/sos", protect, sendSosAlert);

// New routes for family member medical data
router.get("/member/:memberId/medications", protect, getFamilyMemberMedications);
router.get("/member/:memberId/conditions", protect, getFamilyMemberConditions);
router.get("/member/:memberId/reports", protect, getFamilyMemberReports);

// Family request routes
router.post("/request/send", protect, sendFamilyRequest);
router.get("/request/pending", protect, getPendingRequests);
router.get("/request/sent", protect, getSentRequests);
router.post("/request/:requestId/accept", protect, acceptFamilyRequest);
router.post("/request/:requestId/decline", protect, declineFamilyRequest);
router.delete("/request/:requestId/cancel", protect, cancelFamilyRequest);

export default router;
