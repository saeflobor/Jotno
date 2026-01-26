import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
    },
    // Cloudinary public id (optional for existing records)
    public_id: {
      type: String,
    },
    // resource type: 'image' or 'raw' (pdfs)
    resourceType: {
      type: String,
      enum: ["image", "raw"],
      default: "image",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // New fields for Phase 2 (all optional for backward compatibility)
    category: {
      type: String,
      enum: [
        "Lab Results",
        "Prescription",
        "X-Ray",
        "CT Scan",
        "MRI",
        "Ultrasound",
        "Blood Test",
        "Doctor's Note",
        "Insurance",
        "Other",
      ],
      default: "Other",
    },
    reportDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MedicalReport", medicalReportSchema);
