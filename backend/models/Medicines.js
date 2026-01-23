// Mongoose schema example
import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema({
  brand_name: { type: String, required: true }, // e.g., "Napa"
  generic_name: { type: String, required: true }, // e.g., "Paracetamol"
  purpose: { type: String }, // e.g., "Pain reliever / fever reducer"
  form: { type: String }, // e.g., "Tablet / Syrup" (optional)
  strength: { type: String }, // e.g., "500mg" (optional)
  manufacturer: { type: String }, // e.g., "ACI Pharmaceuticals" (optional)
});

export default mongoose.model("Medicine", MedicineSchema);
