import ChronicCondition from "../models/ChronicCondition.js";
import Medication from "../models/Medication.js";
import MedicalReport from "../models/MedicalReport.js";
import AppError from "../utils/AppError.js";
import { logActivity } from "../utils/activityLogger.js";
import { sendEmail } from "../utils/sendEmail.js";

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

    const { medicationName, dosage, frequency, duration, times } = req.body;

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
      times,
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

// Check medication reminders (generic helper, can be called by cron or route)
export const checkMedicationReminders = async (req, res, next) => {
  try {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    console.log(`Checking reminders for time: ${currentTime}`);

    // Find medications that have this time in their schedule
    // Use cursor or lean() if expecting large results, but straight find is okay for moderate load
    const medications = await Medication.find({ times: currentTime }).populate("owner");

    if (medications.length === 0) {
      if (res) return res.status(200).json({ success: true, checkedTime: currentTime, sentCount: 0 });
      return 0;
    }

    console.log(`Found ${medications.length} reminders to send.`);

    // Helper function to send a single email wrapper
    const sendReminderEmail = async (med) => {
      if (!med.owner || !med.owner.email) return null;

      const mailOptions = {
        to: med.owner.email,
        subject: `Medication Reminder: ${med.medicationName}`,
        text: `It's time to take your medication: ${med.medicationName} (${med.dosage}).`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e91e63;">Medication Reminder</h2>
            <p>Hello ${med.owner.username || "User"},</p>
            <p>This is a reminder to take your medication:</p>
            <div style="background: #fdf2f8; padding: 15px; border-left: 4px solid #db2777; margin: 20px 0;">
              <h3 style="margin: 0; color: #db2777;">${med.medicationName}</h3>
              <p style="margin: 5px 0 0;">Dosage: <strong>${med.dosage}</strong></p>
            </div>
            <p>Stay healthy!</p>
            <p style="font-size: 12px; color: #888;">Jotno Health App</p>
          </div>
        `
      };

      try {
        await sendEmail(mailOptions);
        return true;
      } catch (e) {
        console.error(`Failed to send email to ${med.owner.email}:`, e.message);
        return false;
      }
    };

    // Process in batches (chunks) to avoid overwhelming SMTP or memory
    const BATCH_SIZE = 20; 
    let sentCount = 0;

    for (let i = 0; i < medications.length; i += BATCH_SIZE) {
      const batch = medications.slice(i, i + BATCH_SIZE);
      // Run the batch in parallel
      const results = await Promise.allSettled(batch.map(med => sendReminderEmail(med)));
      
      // Count successes
      const batchSuccess = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      sentCount += batchSuccess;
      
      // Optional: small delay between batches if needed to respect rate limits
      // await new Promise(r => setTimeout(r, 100)); 
    }

    console.log(`Sent ${sentCount}/${medications.length} emails for time ${currentTime}`);

    if (res) {
      return res.status(200).json({ success: true, checkedTime: currentTime, sentCount });
    } else {
        return sentCount;
    }
  } catch (err) {
    console.error("Error in checkMedicationReminders:", err);
    if (res && next) return next(err);
  }
};
