import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "added_condition",
        "removed_condition",
        "added_medication",
        "removed_medication",
        "uploaded_report",
        "deleted_report",
        "added_family_member",
        "removed_family_member",
        "updated_profile",
        "sent_sos",
        "updated_report_privacy",
        "removed_family_condition",
        "removed_family_medication",
        "deleted_family_report",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

// Index for faster queries
activityLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
