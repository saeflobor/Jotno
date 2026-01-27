import ActivityLog from "../models/ActivityLog.js";

// Helper function to log activities
export const logActivity = async (userId, action, description, metadata = {}) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      description,
      metadata,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging should not break main functionality
  }
};

// Get user activities with pagination
export const getUserActivities = async (userId, limit = 20, skip = 0) => {
  try {
    const activities = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    return activities;
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return [];
  }
};

// Get all activities from all users with user information
export const getAllActivities = async (limit = 20, skip = 0) => {
  try {
    const activities = await ActivityLog.find({})
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    return activities;
  } catch (error) {
    console.error("Failed to fetch all activities:", error);
    return [];
  }
};
