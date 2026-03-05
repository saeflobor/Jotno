import express from "express";
import { protect } from "../middleware/auth.js";
import { getUserActivities, getAllActivities } from "../utils/activityLogger.js";

const router = express.Router();

// GET /api/activities - Get user's activity timeline or all activities
router.get("/", protect, async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const all = req.query.all === 'true';

    let activities;
    if (all) {
      // Get all activities from all users
      activities = await getAllActivities(limit, skip);
    } else {
      // Get only user's activities
      activities = await getUserActivities(userId, limit, skip);
    }

    return res.status(200).json({ activities });
  } catch (err) {
    return next(err);
  }
});

export default router;
