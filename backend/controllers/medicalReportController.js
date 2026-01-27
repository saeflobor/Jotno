import multer from "multer";
import streamifier from "streamifier";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
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
    try {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(
              new Error(`Cloudinary upload failed: ${error.message}`),
            );
          }
          if (!result || !result.secure_url) {
            return reject(new Error("Cloudinary returned invalid response"));
          }
          resolve(result);
        },
      );

      const stream = streamifier.createReadStream(buffer);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        reject(new Error(`Stream error: ${err.message}`));
      });
      stream.pipe(uploadStream);
    } catch (err) {
      console.error("Upload setup error:", err);
      reject(new Error(`Upload setup failed: ${err.message}`));
    }
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

        console.log(
          `Processing file ${i + 1}/${req.files.length}: ${originalname}`,
        );

        // Choose resource_type for Cloudinary (pdf and images -> image, others -> raw)
        // Cloudinary supports PDF under 'image' resource type, which serves it with correct MIME type for browser viewing
        const resource_type =
          mimetype === "application/pdf" || mimetype.startsWith("image/")
            ? "image"
            : "raw";

        const public_id = `${Date.now()}-${i}-${originalname.replace(/\.[^/.]+$/, "")}`;

        console.log(`Uploading to Cloudinary with public_id: ${public_id}`);

        const result = await uploadBufferToCloudinary(buffer, {
          folder,
          resource_type,
          public_id,
        });

        if (!result || !result.secure_url) {
          console.error(
            `Cloudinary returned invalid result for ${originalname}:`,
            result,
          );
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
        console.log(`Successfully uploaded: ${originalname}`);
      } catch (err) {
        console.error(`Error uploading ${req.files[i].originalname}:`, err);
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

// Helper function to check if requester can add data for a target user
const canAddDataForUser = async (requesterId, targetUserId) => {
  if (requesterId.toString() === targetUserId.toString()) {
    // User can always add data for themselves
    return true;
  }

  // Check if requester is a family member of the target user
  const targetUser = await User.findById(targetUserId).select("family private");
  if (!targetUser) return false;

  // If target user's private is true, family members cannot add data
  if (targetUser.private) return false;

  // Check if requester is in target user's family
  const requesterIdStr = requesterId.toString();
  if (targetUser.family.father?.toString() === requesterIdStr) return true;
  if (targetUser.family.mother?.toString() === requesterIdStr) return true;
  if (targetUser.family.spouse?.toString() === requesterIdStr) return true;
  if (
    targetUser.family.children?.some((id) => id.toString() === requesterIdStr)
  )
    return true;

  return false;
};

// Controller: upload medical report for a user (self or family member if private: false)
export const uploadMedicalReportForUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id)
      return next(new AppError("Unauthorized", 401));
    if (!req.files || req.files.length === 0)
      return next(new AppError("No files uploaded", 400));

    const { category, reportDate, notes, tags, isPrivate, targetUserId } =
      req.body;
    const requesterId = req.user._id;
    const ownerUserId = targetUserId || requesterId;

    // Check if requester can add data for this user
    const canAdd = await canAddDataForUser(requesterId, ownerUserId);
    if (!canAdd) {
      return next(
        new AppError(
          "Access denied: Cannot add data for this user due to privacy settings",
          403,
        ),
      );
    }

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

        console.log(
          `Processing file ${i + 1}/${req.files.length}: ${originalname}`,
        );

        const resource_type =
          mimetype === "application/pdf" || mimetype.startsWith("image/")
            ? "image"
            : "raw";

        const public_id = `${Date.now()}-${i}-${originalname.replace(/\.[^/.]+$/, "")}`;

        console.log(`Uploading to Cloudinary with public_id: ${public_id}`);

        const result = await uploadBufferToCloudinary(buffer, {
          folder,
          resource_type,
          public_id,
        });

        if (!result || !result.secure_url) {
          console.error(
            `Cloudinary returned invalid result for ${originalname}:`,
            result,
          );
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
          owner: ownerUserId,
          category: category || "Other",
          reportDate: reportDate || null,
          notes: notes || "",
          tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
          isPrivate: isPrivate === "true" ? true : false,
        });

        uploadedReports.push(medicalReport);
        console.log(`Successfully uploaded: ${originalname}`);
      } catch (err) {
        console.error(`Error uploading ${req.files[i].originalname}:`, err);
        errors.push({
          filename: req.files[i].originalname,
          error: err.message,
        });
      }
    }

    // Log activity
    if (uploadedReports.length > 0) {
      await logActivity(
        requesterId,
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

// Delete medical report for a family member (if private: false)
export const deleteMedicalReportForUser = async (req, res, next) => {
  try {
    const requesterId = req.user?._id;
    if (!requesterId) return next(new AppError("Unauthorized", 401));

    const { reportId, targetUserId } = req.params;

    if (!reportId || !targetUserId) {
      return next(
        new AppError("Report ID and Target User ID are required", 400),
      );
    }

    // Get the current user with family populated
    const requester = await User.findById(requesterId).select("family");
    if (!requester) return next(new AppError("User not found", 404));

    // Check if targetUserId is in the requester's family
    const isFamilyMember = (user, memberId) => {
      const memberIdStr = memberId.toString();
      if (user.family.father?.toString() === memberIdStr) return true;
      if (user.family.mother?.toString() === memberIdStr) return true;
      if (user.family.spouse?.toString() === memberIdStr) return true;
      if (user.family.children?.some((id) => id.toString() === memberIdStr))
        return true;
      return false;
    };

    if (!isFamilyMember(requester, targetUserId)) {
      return next(new AppError("Access denied: Not a family member", 403));
    }

    // Check if target user allows family members to edit their data
    const targetUser = await User.findById(targetUserId).select("private");
    if (!targetUser) return next(new AppError("Target user not found", 404));

    if (targetUser.private === true) {
      return next(
        new AppError(
          "Access denied: User privacy settings prevent editing",
          403,
        ),
      );
    }

    // Find the report
    const report = await MedicalReport.findOne({
      _id: reportId,
      owner: targetUserId,
    });

    if (!report) {
      return next(new AppError("Medical report not found", 404));
    }

    // Only allow deletion of non-private reports
    if (report.isPrivate === true) {
      return next(
        new AppError("Access denied: Cannot delete private reports", 403),
      );
    }

    // Delete from Cloudinary if public_id exists
    if (report.public_id) {
      try {
        const destroyOptions = {
          resource_type: report.resourceType === "raw" ? "raw" : "image",
        };
        await cloudinary.uploader.destroy(report.public_id, destroyOptions);
      } catch (err) {
        console.warn("Cloudinary deletion failed:", err);
      }
    }

    // Delete from database
    await report.deleteOne();

    // Log activity
    await logActivity(
      requesterId,
      "deleted_family_report",
      `Deleted medical report for family member: ${report.category || "Other"}`,
      {
        reportId: report._id,
        targetUserId,
        category: report.category || "Other",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
      reportId: report._id,
    });
  } catch (err) {
    return next(err);
  }
};

// Controller: download a medical report
export const downloadMedicalReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return next(new AppError("Unauthorized", 401));
    }

    // Find the report
    const report = await MedicalReport.findById(id);

    if (!report) {
      return next(new AppError("Medical report not found", 404));
    }

    // Check if user owns the report or has access to it (family member scenario)
    const isOwner = report.owner.toString() === userId.toString();
    
    if (!isOwner) {
      // Check if user is a family member and report is not private
      const targetUser = await User.findById(report.owner);
      if (!targetUser || report.isPrivate === true) {
        return next(new AppError("Access denied", 403));
      }

      // Verify that the current user is in the target user's family
      const isFamilyMember = 
        targetUser.family?.father?._id?.toString() === userId.toString() ||
        targetUser.family?.mother?._id?.toString() === userId.toString() ||
        targetUser.family?.spouse?._id?.toString() === userId.toString() ||
        (Array.isArray(targetUser.family?.children) && 
         targetUser.family.children.some(child => child._id?.toString() === userId.toString()));

      if (!isFamilyMember) {
        return next(new AppError("Access denied", 403));
      }
    }

    try {
      // Fetch the file from Cloudinary using axios
      const fileResponse = await axios.get(report.url, {
        responseType: "arraybuffer"
      });

      // Get content type from the response headers or determine based on URL
      let contentType = fileResponse.headers["content-type"] || "application/octet-stream";
      
      // Generate filename
      const fileExtension = getFileExtension(contentType);
      const filename = `${report.category || "report"}-${new Date(report.reportDate || report.createdAt).toISOString().split('T')[0]}.${fileExtension}`;

      // Set response headers for download
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Content-Length", fileResponse.data.length);

      // Send the file
      return res.status(200).send(fileResponse.data);
    } catch (fetchErr) {
      console.error("Failed to fetch file from Cloudinary:", fetchErr);
      return next(new AppError("Failed to download file", 500));
    }
  } catch (err) {
    return next(err);
  }
};

// Helper function to get file extension from content type
function getFileExtension(contentType) {
  const extensionMap = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
  };
  return extensionMap[contentType] || "bin";
}

export default {
  uploadMiddleware,
  uploadMedicalReport,
  uploadMedicalReportForUser,
  deleteMedicalReport,
  deleteMedicalReportForUser,
  toggleReportPrivacy,
  downloadMedicalReport,
};
