import ChronicCondition from "../models/ChronicCondition.js";
import Medication from "../models/Medication.js";
import MedicalReport from "../models/MedicalReport.js";
import AppError from "../utils/AppError.js";
import { logActivity } from "../utils/activityLogger.js";

// Get health summary (counts and stats)
export const getHealthSummary = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const [conditionsCount, medicationsCount, reportsCount, latestReport] = await Promise.all([
      ChronicCondition.countDocuments({ owner: userId }),
      Medication.countDocuments({ owner: userId }),
      MedicalReport.countDocuments({ owner: userId }),
      MedicalReport.findOne({ owner: userId }).sort({ createdAt: -1 }).select("createdAt category"),
    ]);

    return res.status(200).json({
      summary: {
        chronicConditionsCount: conditionsCount,
        medicationsCount: medicationsCount,
        medicalReportsCount: reportsCount,
        lastReportDate: latestReport?.createdAt || null,
        lastReportCategory: latestReport?.category || null,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// Get all chronic conditions for the authenticated user
export const getChronicConditions = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const conditions = await ChronicCondition.find({ owner: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ conditions });
  } catch (err) {
    return next(err);
  }
};

// Add a new chronic condition
export const addChronicCondition = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { conditionName, severityLevel } = req.body;

    if (!conditionName || !severityLevel) {
      return next(new AppError("All fields are required", 400));
    }

    const condition = await ChronicCondition.create({
      conditionName,
      severityLevel,
      owner: userId,
    });

    // Log activity
    await logActivity(
      userId,
      "added_condition",
      `Added chronic condition: ${conditionName}`,
      { conditionId: condition._id, conditionName, severityLevel }
    );

    return res.status(201).json({ success: true, condition });
  } catch (err) {
    return next(err);
  }
};

// Delete a chronic condition
export const deleteChronicCondition = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { id } = req.params;
    const condition = await ChronicCondition.findOne({ _id: id, owner: userId });

    if (!condition) {
      return next(new AppError("Chronic condition not found", 404));
    }

    const conditionName = condition.conditionName;
    await condition.deleteOne();

    // Log activity
    await logActivity(
      userId,
      "removed_condition",
      `Removed chronic condition: ${conditionName}`,
      { conditionId: id, conditionName }
    );

    return res.status(200).json({ success: true, id: condition._id });
  } catch (err) {
    return next(err);
  }
};

// Get all medications for the authenticated user
export const getMedications = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const medications = await Medication.find({ owner: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ medications });
  } catch (err) {
    return next(err);
  }
};

// Add a new medication
export const addMedication = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { medicationName, dosage, frequency, duration } = req.body;

    if (!medicationName || !dosage || !frequency || !duration) {
      return next(new AppError("All fields are required", 400));
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return next(new AppError("Duration must be a positive number", 400));
    }

    const expiryDate = new Date(Date.now() + durationNum*60*1000); // days to milliseconds
    const medication = await Medication.create({
      medicationName,
      dosage,
      frequency,
      duration,
      expiryDate,
      owner: userId,
    });

    // Log activity
    await logActivity(
      userId,
      "added_medication",
      `Added medication: ${medicationName}`,
      { medicationId: medication._id, medicationName, dosage }
    );

    return res.status(201).json({ success: true, medication });
  } catch (err) {
    return next(err);
  }
};

// Delete a medication
export const deleteMedication = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { id } = req.params;
    const medication = await Medication.findOne({ _id: id, owner: userId });

    if (!medication) {
      return next(new AppError("Medication not found", 404));
    }

    const medicationName = medication.medicationName;
    await medication.deleteOne();

    // Log activity
    await logActivity(
      userId,
      "removed_medication",
      `Removed medication: ${medicationName}`,
      { medicationId: id, medicationName }
    );

    return res.status(200).json({ success: true, id: medication._id });
  } catch (err) {
    return next(err);
  }
};
