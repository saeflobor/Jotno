import AppError from "../utils/AppError.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load medicines data once when the module is loaded
let medicinesData = [];
try {
  const dataPath = path.join(__dirname, "../Data/bangladesh-medicines.json");
  const data = fs.readFileSync(dataPath, "utf8");
  medicinesData = JSON.parse(data);
  console.log(`✅ Loaded ${medicinesData.length} Bangladesh medicines`);
} catch (err) {
  console.error("❌ Failed to load medicines data:", err.message);
}

export default async function getmedicines(req, res, next) {
  try {
    const { name } = req.params;
    let filteredMedicines = [];

    if (!name) {
      // No input → return first 20 medicines
      filteredMedicines = medicinesData.slice(0, 20);
    } else {
      // Search by brand name or generic name (case-insensitive)
      const searchTerm = name.toLowerCase();
      filteredMedicines = medicinesData.filter(
        (med) =>
          med.brand_name?.toLowerCase().includes(searchTerm) ||
          med.generic?.toLowerCase().includes(searchTerm)
      );

      // Limit to 50 results
      filteredMedicines = filteredMedicines.slice(0, 50);
    }

    return res.status(200).json({
      success: true,
      count: filteredMedicines.length,
      data: filteredMedicines,
    });
  } catch (err) {
    console.error("Medicine lookup error:", err.message);
    return next(new AppError("Failed to fetch medicine data", 500));
  }
}





