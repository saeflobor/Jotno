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

    const prompt = `You are a professional medical information assistant. Based on the following patient records, provide a clear and well-structured summary of their current overall medical condition.

FORMATTING REQUIREMENTS:
- Use clear section headings with "###" prefix (e.g., "### Overview")
- Use bullet points with "-" for lists
- Keep the summary concise (under 300 words)
- Use simple, patient-friendly language
- Do NOT provide diagnoses or treatment recommendations — only summarize what the records show

STRUCTURE YOUR RESPONSE AS FOLLOWS:
### Overview
[Brief general health status overview in 2-3 sentences]

### Chronic Conditions
[List and briefly describe the chronic conditions if any, or state "No chronic conditions reported"]

### Current Medications
[List active medications with their purpose/indication if inferable, or state "No medications recorded"]

### Medical Documentation
[Summarize types and recency of medical reports if any, or state "No recent reports"]

### Key Considerations
[Any notable patterns, interactions, or points requiring attention - keep brief]

=== PATIENT MEDICAL RECORDS ===

CHRONIC CONDITIONS:
${conditionsText}

CURRENT MEDICATIONS:
${medicationsText}

MEDICAL REPORTS/DOCUMENTS:
${reportsText}

=== END OF RECORDS ===

Provide the structured summary now:`;

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
