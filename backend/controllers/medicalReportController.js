import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import MedicalReport from "../models/MedicalReport.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { logActivity } from "../utils/activityLogger.js";

// Multer memory storage so file buffer is available for upload
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new AppError("Only PNG, JPG or PDF files are allowed", 400), false);
};

export const uploadMiddleware = multer({ storage, fileFilter });

// Helper: upload buffer to Cloudinary using upload_stream
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// Controller: expects `uploadMiddleware.single('file')` to run before this handler
export const uploadMedicalReport = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id)
      return next(new AppError("Unauthorized", 401));
    if (!req.file) return next(new AppError("No file uploaded", 400));

    const { mimetype, buffer, originalname } = req.file;
    const { category, reportDate, notes, tags } = req.body;

    // Choose resource_type for Cloudinary (pdf -> raw, images -> image)
    const resource_type = mimetype === "application/pdf" ? "raw" : "image";

    // Use a folder to group uploads
    const folder =
      process.env.CLOUDINARY_MEDICAL_FOLDER || "jotno_medical_reports";

    const public_id = `${Date.now()}-${originalname.replace(/\.[^/.]+$/, "")}`;

    const result = await uploadBufferToCloudinary(buffer, {
      folder,
      resource_type,
      public_id,
    });

    if (!result || !result.secure_url) {
      return next(new AppError("Failed to upload file to Cloudinary", 500));
    }

    const medicalReport = await MedicalReport.create({
      url: result.secure_url,
      public_id: result.public_id,
      resourceType: resource_type,
      owner: req.user._id,
      category: category || "Other",
      reportDate: reportDate || null,
      notes: notes || "",
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
    });

    // Add reference to user's medicalReports array
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { medicalReports: medicalReport._id },
    });

    // Log activity
    await logActivity(
      req.user._id,
      "uploaded_report",
      `Uploaded medical report: ${category || "Other"}`,
      { reportId: medicalReport._id, category: category || "Other" }
    );

    return res.status(201).json({ success: true, medicalReport });
  } catch (err) {
    return next(err);
  }
};

// Delete a medical report (ensure auth and ownership)
export const deleteMedicalReport = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { id } = req.params;
    const report = await MedicalReport.findOne({ _id: id, owner: userId });
    if (!report) return next(new AppError("Medical report not found", 404));

    // Attempt to remove from Cloudinary if we have a public_id
    if (report.public_id) {
      try {
        const destroyOptions = {
          resource_type: report.resourceType === "raw" ? "raw" : "image",
        };
        await cloudinary.uploader.destroy(report.public_id, destroyOptions);
      } catch (err) {
        // log and continue — deletion of the DB record should still proceed
        console.warn("Cloudinary deletion failed", err);
      }
    }

    // Remove DB record (use deleteOne instead of deprecated/removed remove())
    await report.deleteOne();

    // Remove reference from user's medicalReports
    await User.findByIdAndUpdate(userId, {
      $pull: { medicalReports: report._id },
    });

    // Log activity
    await logActivity(
      userId,
      "deleted_report",
      `Deleted medical report: ${report.category || "Other"}`,
      { reportId: report._id, category: report.category || "Other" }
    );

    return res.status(200).json({ success: true, id: report._id });
  } catch (err) {
    return next(err);
  }
};

export default { uploadMiddleware, uploadMedicalReport, deleteMedicalReport };
