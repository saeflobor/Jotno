import ChronicCondition from "../models/ChronicCondition.js";
import Medication from "../models/Medication.js";
import AppError from "../utils/AppError.js";

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

    await condition.deleteOne();

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

    const { medicationName, dosage, frequency } = req.body;

    if (!medicationName || !dosage || !frequency) {
      return next(new AppError("All fields are required", 400));
    }

    const medication = await Medication.create({
      medicationName,
      dosage,
      frequency,
      owner: userId,
    });

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

    await medication.deleteOne();

    return res.status(200).json({ success: true, id: medication._id });
  } catch (err) {
    return next(err);
  }
};
