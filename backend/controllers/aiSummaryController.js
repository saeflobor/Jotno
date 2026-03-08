import axios from "axios";
import ChronicCondition from "../models/ChronicCondition.js";
import Medication from "../models/Medication.js";
import MedicalReport from "../models/MedicalReport.js";
import AppError from "../utils/AppError.js";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export const getAISummary = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    // Fetch all medical records in parallel
    const [conditions, medications, reports] = await Promise.all([
      ChronicCondition.find({ owner: userId }).lean(),
      Medication.find({ owner: userId }).lean(),
      MedicalReport.find({ owner: userId })
        .sort({ reportDate: -1, createdAt: -1 })
        .lean(),
    ]);

    // Check if the user has any records at all
    if (
      conditions.length === 0 &&
      medications.length === 0 &&
      reports.length === 0
    ) {
      return res.status(200).json({
        summary:
          "No medical records found. Please add your chronic conditions, medications, or upload medical reports to generate a health summary.",
      });
    }

    // Build structured patient data for the prompt
    const conditionsText =
      conditions.length > 0
        ? conditions
            .map(
              (c) =>
                `- ${c.conditionName} (Severity: ${c.severityLevel})`,
            )
            .join("\n")
        : "None reported";

    const medicationsText =
      medications.length > 0
        ? medications
            .map((m) => {
              const freq = m.frequency.replace(/-/g, " ");
              return `- ${m.medicationName}, ${m.dosage}, ${freq}, for ${m.duration} days`;
            })
            .join("\n")
        : "None reported";

    const reportsText =
      reports.length > 0
        ? reports
            .map((r) => {
              const date = r.reportDate
                ? new Date(r.reportDate).toLocaleDateString()
                : "No date";
              const notes = r.notes ? ` — Notes: ${r.notes}` : "";
              const tags =
                r.tags && r.tags.length > 0
                  ? ` [Tags: ${r.tags.join(", ")}]`
                  : "";
              return `- ${r.category} (${date})${notes}${tags}`;
            })
            .join("\n")
        : "None uploaded";

    const prompt = `You are a helpful medical information assistant. Based on the following patient records, provide a clear and concise summary of their current overall medical condition and also mention if any of the medications clash with any of the chronic conditions. Use simple language that a patient can understand. Structure your response with sections if needed. Do NOT provide diagnoses or treatment recommendations — only summarize what the records show.

IMPORTANT: Keep the summary concise (under 300 words). Focus on the key points.

=== PATIENT MEDICAL RECORDS ===

CHRONIC CONDITIONS:
${conditionsText}

CURRENT MEDICATIONS:
${medicationsText}

MEDICAL REPORTS/DOCUMENTS:
${reportsText}

=== END OF RECORDS ===

Please provide a brief, organized summary of this patient's current health status based on the records above.`;

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
            temperature: 0.3,
            num_predict: 512,
          },
        },
        { timeout: 120000 },
      );
    } catch (ollamaErr) {
      if (ollamaErr.code === "ECONNREFUSED") {
        return next(
          new AppError(
            "AI service is not running. Please start Ollama with 'ollama serve' in your terminal.",
            503,
          ),
        );
      }
      return next(
        new AppError(
          `AI service error: ${ollamaErr.message}`,
          502,
        ),
      );
    }

    const summary = ollamaResponse.data?.response;
    if (!summary) {
      return next(new AppError("AI returned an empty response", 502));
    }

    return res.status(200).json({
      summary,
      metadata: {
        model: OLLAMA_MODEL,
        recordCounts: {
          conditions: conditions.length,
          medications: medications.length,
          reports: reports.length,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};
