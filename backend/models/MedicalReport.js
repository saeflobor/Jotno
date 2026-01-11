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
  },
  { timestamps: true }
);

export default mongoose.model("MedicalReport", medicalReportSchema);
