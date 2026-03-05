import AppError from "../utils/AppError.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load medicines data once when the module is loaded
let medicinesData = [];
let dosageForms = [];
let manufacturers = [];

try {
  const dataPath = path.join(__dirname, "../Data/bangladesh-medicines.json");
  const data = fs.readFileSync(dataPath, "utf8");
  medicinesData = JSON.parse(data);

  // Pre-compute unique dosage forms and manufacturers for filters
  const dosageSet = new Set();
  const mfgSet = new Set();
  medicinesData.forEach((med) => {
    if (med.dosage_form) dosageSet.add(med.dosage_form.trim());
    if (med.manufacturer) mfgSet.add(med.manufacturer.trim());
  });
  dosageForms = [...dosageSet].sort();
  manufacturers = [...mfgSet].sort();

  console.log(`✅ Loaded ${medicinesData.length} Bangladesh medicines`);
} catch (err) {
  console.error("❌ Failed to load medicines data:", err.message);
}

// GET /api/medicines/filters — return available filter options
export function getFilters(req, res) {
  return res.status(200).json({
    success: true,
    data: { dosageForms, manufacturers },
  });
}

// GET /api/medicines?q=...&dosage_form=...&manufacturer=...&page=1&limit=30
export default async function getmedicines(req, res, next) {
  try {
    // Support both query-param (?q=) and path-param (/:name) for backwards compat
    const searchTerm = (req.query.q || req.params.name || "").trim().toLowerCase();
    const dosageFilter = (req.query.dosage_form || "").trim().toLowerCase();
    const mfgFilter = (req.query.manufacturer || "").trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));

    let results;

    if (!searchTerm && !dosageFilter && !mfgFilter) {
      // No search → return first page of all medicines
      results = medicinesData;
    } else {
      // Score-based search for relevance ranking
      const scored = [];

      for (const med of medicinesData) {
        // Apply dosage form filter
        if (dosageFilter && (!med.dosage_form || !med.dosage_form.toLowerCase().includes(dosageFilter))) {
          continue;
        }
        // Apply manufacturer filter
        if (mfgFilter && (!med.manufacturer || !med.manufacturer.toLowerCase().includes(mfgFilter))) {
          continue;
        }

        if (!searchTerm) {
          scored.push({ med, score: 0 });
          continue;
        }

        const brand = (med.brand_name || "").toLowerCase();
        const generic = (med.generic || "").toLowerCase();
        let score = 0;

        // Exact match (highest priority)
        if (brand === searchTerm) score += 100;
        else if (brand.startsWith(searchTerm)) score += 80;
        else if (brand.includes(searchTerm)) score += 50;

        if (generic === searchTerm) score += 90;
        else if (generic.startsWith(searchTerm)) score += 70;
        else if (generic.includes(searchTerm)) score += 40;

        // Also search manufacturer
        const mfg = (med.manufacturer || "").toLowerCase();
        if (mfg.includes(searchTerm)) score += 20;

        if (score > 0) {
          scored.push({ med, score });
        }
      }

      // Sort by score descending, then brand name alphabetically
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.med.brand_name || "").localeCompare(b.med.brand_name || "");
      });

      results = scored.map((s) => s.med);
    }

    const totalCount = results.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return res.status(200).json({
      success: true,
      count: paginatedResults.length,
      totalCount,
      page,
      totalPages,
      data: paginatedResults,
    });
  } catch (err) {
    console.error("Medicine lookup error:", err.message);
    return next(new AppError("Failed to fetch medicine data", 500));
  }
}





