import axios from "axios";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import AppError from "../utils/AppError.js";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export const extractPrescription = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    if (!req.file) {
      return next(new AppError("Please upload a PDF file", 400));
    }

    if (req.file.mimetype !== "application/pdf") {
      return next(new AppError("Only PDF files are supported", 400));
    }

    // Extract text from the PDF buffer
    let pdfData;
    try {
      const dataBuffer = Buffer.isBuffer(req.file.buffer)
        ? req.file.buffer
        : Buffer.from(req.file.buffer);
      pdfData = await pdfParse(dataBuffer);
    } catch (parseErr) {
      console.error("PDF parse error:", parseErr);
      return next(
        new AppError(`Failed to read the PDF file: ${parseErr.message}`, 400)
      );
    }

    const extractedText = pdfData.text?.trim();
    if (!extractedText) {
      return next(
        new AppError(
          "No text found in the PDF. This may be a scanned document. Only digital/text-based PDFs are supported.",
          400
        )
      );
    }

    // Build prompt for Ollama to extract structured prescription data
    const prompt = `You are a medical prescription data extraction assistant. Extract all prescription/medication data from the following text extracted from a prescription PDF.

Return ONLY a valid JSON array with the following structure (no extra text, no markdown, just the JSON array):
[
  {
    "medicationName": "Name of the medicine",
    "dosage": "Dosage amount (e.g., 500mg, 10ml)",
    "frequency": "once-daily | twice-daily | three-times-daily | as-needed",
    "duration": number of days as an integer (estimate 30 if not specified)
  }
]

Rules:
- frequency MUST be one of: "once-daily", "twice-daily", "three-times-daily", "as-needed"
- duration MUST be an integer (number of days). If it says "1 month" use 30, "2 weeks" use 14, etc.
- If dosage is not specified, use "As prescribed"
- If frequency is unclear, use "as-needed"
- If no medications are found, return an empty array: []
- Do NOT include any explanation, just the JSON array

=== PRESCRIPTION TEXT ===
${extractedText}
=== END OF TEXT ===`;

    // Call Ollama API
    let ollamaResponse;
    try {
      ollamaResponse = await axios.post(
        `${OLLAMA_BASE_URL}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 1024,
          },
        },
        { timeout: 120000 }
      );
    } catch (ollamaErr) {
      if (ollamaErr.code === "ECONNREFUSED") {
        return next(
          new AppError(
            "AI service is not running. Please start Ollama with 'ollama serve' in your terminal.",
            503
          )
        );
      }
      return next(new AppError(`AI service error: ${ollamaErr.message}`, 502));
    }

    const rawResponse = ollamaResponse.data?.response;
    if (!rawResponse) {
      return next(new AppError("AI returned an empty response", 502));
    }

    // Parse the JSON from the AI response
    let medications;
    try {
      // Try to extract JSON array from the response (AI might wrap it in markdown code blocks)
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return next(
          new AppError("AI could not extract prescription data from this document", 422)
        );
      }
      medications = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(medications)) {
        return next(new AppError("AI returned invalid data format", 502));
      }

      // Validate and sanitize each medication entry
      const validFrequencies = ["once-daily", "twice-daily", "three-times-daily", "as-needed"];
      medications = medications.map((med) => ({
        medicationName: String(med.medicationName || "").trim(),
        dosage: String(med.dosage || "As prescribed").trim(),
        frequency: validFrequencies.includes(med.frequency) ? med.frequency : "as-needed",
        duration: Number.isInteger(Number(med.duration)) && Number(med.duration) > 0
          ? Number(med.duration)
          : 30,
      })).filter((med) => med.medicationName);
    } catch (jsonErr) {
      return next(
        new AppError("Failed to parse AI response. Please try again.", 502)
      );
    }

    return res.status(200).json({
      medications,
      metadata: {
        model: OLLAMA_MODEL,
        pdfPages: pdfData.numpages,
        extractedTextLength: extractedText.length,
        medicationsFound: medications.length,
      },
    });
  } catch (err) {
    return next(err);
  }
};
