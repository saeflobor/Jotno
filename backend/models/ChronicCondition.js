import mongoose from "mongoose";

const chronicConditionSchema = new mongoose.Schema(
  {
    conditionName: {
      type: String,
      required: [true, "Condition name is required"],
      trim: true,
    },
    severityLevel: {
      type: String,
      enum: ["mild", "moderate", "severe"],
      required: [true, "Severity level is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ChronicCondition", chronicConditionSchema);
