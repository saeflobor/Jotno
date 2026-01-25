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
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// Controller: expects `uploadMiddleware.array('files')` to run before this handler
// Supports multiple file uploads (PNG, JPEG, JPG, PDF)
export const uploadMedicalReport = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id)
      return next(new AppError("Unauthorized", 401));
    if (!req.files || req.files.length === 0)
      return next(new AppError("No files uploaded", 400));

    const { category, reportDate, notes, tags, isPrivate } = req.body;

    // Validate number of files
    if (req.files.length > 10) {
      return next(
        new AppError("Maximum 10 files can be uploaded at once", 400),
      );
    }

    const uploadedReports = [];
    const errors = [];

    // Use a folder to group uploads
    const folder =
      process.env.CLOUDINARY_MEDICAL_FOLDER || "jotno_medical_reports";

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      try {
        const { mimetype, buffer, originalname } = req.files[i];

        // Choose resource_type for Cloudinary (pdf and images -> image, others -> raw)
        // Cloudinary supports PDF under 'image' resource type, which serves it with correct MIME type for browser viewing
        const resource_type =
          mimetype === "application/pdf" || mimetype.startsWith("image/")
            ? "image"
            : "raw";

        const public_id = `${Date.now()}-${i}-${originalname.replace(/\.[^/.]+$/, "")}`;

        const result = await uploadBufferToCloudinary(buffer, {
          folder,
          resource_type,
          public_id,
        });

        if (!result || !result.secure_url) {
          errors.push({
            filename: originalname,
            error: "Failed to upload file to Cloudinary",
          });
          continue;
        }

        const url = result.secure_url;

        const medicalReport = await MedicalReport.create({
          url,
          public_id: result.public_id,
          resourceType: resource_type,
          owner: req.user._id,
          category: category || "Other",
          reportDate: reportDate || null,
          notes: notes || "",
          tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
          isPrivate: isPrivate === "true" ? true : false,
        });

        uploadedReports.push(medicalReport);
      } catch (err) {
        errors.push({
          filename: req.files[i].originalname,
          error: err.message,
        });
      }
    }

    // Log activity
    if (uploadedReports.length > 0) {
      await logActivity(
        req.user._id,
        "uploaded_report",
        `Uploaded ${uploadedReports.length} medical report(s): ${category || "Other"}`,
        {
          reportIds: uploadedReports.map((r) => r._id),
          count: uploadedReports.length,
          category: category || "Other",
        },
      );
    }

    // If no files were uploaded successfully
    if (uploadedReports.length === 0) {
      return next(
        new AppError(
          `Failed to upload files: ${errors.map((e) => e.filename).join(", ")}`,
          400,
        ),
      );
    }

    return res.status(201).json({
      success: true,
      medicalReports: uploadedReports,
      uploadedCount: uploadedReports.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return next(err);
  }
};

// Toggle privacy status
export const toggleReportPrivacy = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const { id } = req.params;
    const report = await MedicalReport.findOne({ _id: id, owner: userId });
    if (!report) return next(new AppError("Medical report not found", 404));

    report.isPrivate = !report.isPrivate;
    await report.save();

    // Log activity
    await logActivity(
      userId,
      "updated_report_privacy",
      `Updated report privacy to ${report.isPrivate ? "Private" : "Public"}`,
      { reportId: report._id, isPrivate: report.isPrivate },
    );

    return res.status(200).json({
      success: true,
      isPrivate: report.isPrivate,
      medicalReport: report,
    });
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

    // Log activity
    await logActivity(
      userId,
      "deleted_report",
      `Deleted medical report: ${report.category || "Other"}`,
      { reportId: report._id, category: report.category || "Other" },
    );

    return res.status(200).json({ success: true, id: report._id });
  } catch (err) {
    return next(err);
  }
};

export default {
  uploadMiddleware,
  uploadMedicalReport,
  deleteMedicalReport,
  toggleReportPrivacy,
};
