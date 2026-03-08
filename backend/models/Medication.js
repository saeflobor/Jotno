import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    medicationName: {
      type: String,
      required: [true, "Medication name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, "Dosage is required"],
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["once-daily", "twice-daily", "three-times-daily", "as-needed"],
      required: [true, "Frequency is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      immutable: true,
      index: { expires: 0 }
    },
    times: {
      type: [String],
      default: []
    },
    remindersSent: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxReminders: {
      type: Number,
      default: 1,
      min: 1,
    },
    notificationType: {
      type: String,
      enum: ["me", "family"],
      default: "me",
    }
  },
  { timestamps: true }
);

medicationSchema.index({
  times: 1,
  owner: 1
});

export default mongoose.model("Medication", medicationSchema);
