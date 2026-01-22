import AppError from "../utils/AppError.js";
import axios from "axios";

export default async function getmedicines(req, res, next) {
  try {
    const { name } = req.params; // user input (optional)
    const apiKey = process.env.Medicine_API_KEY;
    let searchQuery = "";
    let limit = 10;

    if (!name) {
      // No input → return random/default medicines
      searchQuery = 'openfda.generic_name:*';
    } else if (name.length === 1) {
      // Single letter → medicines starting with that letter
      // Use regex-like search: ^letter
      searchQuery = `openfda.generic_name:${name}*+openfda.brand_name:${name}*+openfda.substance_name:${name}*`;
    } else {
      // Full name input → exact match search (optional)
      searchQuery = `openfda.generic_name:"${name}"+openfda.brand_name:"${name}"+openfda.substance_name:"${name}"`;
    }

    const response = await axios.get("https://api.fda.gov/drug/label.json", {
      params: {
        search: searchQuery,
        limit,
        api_key: apiKey
      }
    });

    const medicines = response.data.results.map((drug) => ({
      brand_name: drug.openfda?.brand_name || [],
      generic_name: drug.openfda?.generic_name || [],
      purpose: drug.purpose || []
    }));

    return res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines
    });

  } catch (err) {
    // No matches found
    if (err.response?.status === 404) {
      return res.status(200).json({
        success: false,
        message: "No medicines found",
        data: []
      });
    }

    console.error("FDA ERROR:", err.response?.data || err.message);

    return next(
      new AppError(
        "Failed to fetch medicine data",
        err.response?.status || 500
      )
    );
  }
}





