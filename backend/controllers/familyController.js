import User from "../models/User.js";
import nodemailer from "nodemailer";
import AppError from "../utils/AppError.js";
import Medication from "../models/Medication.js";
import ChronicCondition from "../models/ChronicCondition.js";
import MedicalReport from "../models/MedicalReport.js";
import FamilyRequest from "../models/FamilyRequest.js";
import { logActivity } from "../utils/activityLogger.js";
import { sendSOSWhatsApp } from "../utils/sendWhatsApp.js";

// Create nodemailer transport
function createMailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Email is not configured on the server");
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// Add family member (now includes spouse)
export const addFamilyMember = async (req, res, next) => {
  const { memberEmail, memberPhone, relation } = req.body;
  const userId = req.user?._id;

  if (!userId) return next(new AppError("Unauthorized", 401));
  if (!(memberEmail && memberPhone && relation))
    return next(new AppError("All fields are required", 400));

  if (!["father", "mother", "child", "spouse"].includes(relation))
    return next(new AppError("Invalid relation type", 400));

  try {
    const user = await User.findById(userId);
    let member = null;
    if (memberEmail) member = await User.findOne({ email: memberEmail });
    else if (memberPhone) member = await User.findOne({ phone: memberPhone });

    if (!user) return next(new AppError("Current user not found", 404));
    if (!member) return next(new AppError("Member user not found", 404));

    // Initialize arrays if undefined
    user.family.children ||= [];
    member.family.children ||= [];

    switch (relation) {
      case "father":
        user.family.father = member._id;
        if (!member.family.children.includes(user._id))
          member.family.children.push(user._id);
        break;
      case "mother":
        user.family.mother = member._id;
        if (!member.family.children.includes(user._id))
          member.family.children.push(user._id);
        break;
      case "child":
        if (!user.family.children.includes(member._id))
          user.family.children.push(member._id);
        if (user.gender === "male") member.family.father = user._id;
        else if (user.gender === "female") member.family.mother = user._id;
        break;
      case "spouse":
        if (user.gender === member.gender) {
          return next(
            new AppError("Spouse must be of the opposite gender", 400),
          );
        }
        user.family.spouse = member._id;
        member.family.spouse = user._id;
        break;
    }

    await Promise.all([user.save(), member.save()]);

    // Log activity
    await logActivity(
      userId,
      "added_family_member",
      `Added ${member.username} as ${relation}`,
      { memberId: member._id, relation }
    );

    const populatedUser = await User.findById(userId)
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");

    res
      .status(200)
      .json({ message: "Family updated successfully", user: populatedUser });
  } catch (err) {
    return next(new AppError("Server error", 500));
  }
};

// Remove family member (now includes spouse)
export const removeFamilyMember = async (req, res, next) => {
  const { memberId, relation } = req.body;
  const userId = req.user?._id;

  if (!userId) return next(new AppError("Unauthorized", 401));
  if (!memberId || !relation)
    return next(new AppError("All fields are required", 400));

  if (!["father", "mother", "child", "spouse"].includes(relation))
    return next(new AppError("Invalid relation type", 400));

  try {
    const user = await User.findById(userId);
    const member = await User.findById(memberId);

    if (!user) return next(new AppError("Current user not found", 404));
    if (!member) return next(new AppError("Member user not found", 404));

    user.family.children ||= [];
    member.family.children ||= [];

    switch (relation) {
      case "father":
        if (user.family.father?.toString() === memberId) {
          user.family.father = null;
          member.family.children = member.family.children.filter(
            (id) => id.toString() !== userId.toString(),
          );
        }
        break;
      case "mother":
        if (user.family.mother?.toString() === memberId) {
          user.family.mother = null;
          member.family.children = member.family.children.filter(
            (id) => id.toString() !== userId.toString(),
          );
        }
        break;
      case "child":
        user.family.children = user.family.children.filter(
          (id) => id.toString() !== memberId.toString(),
        );
        if (
          user.gender === "male" &&
          member.family.father?.toString() === userId.toString()
        )
          member.family.father = null;
        if (
          user.gender === "female" &&
          member.family.mother?.toString() === userId.toString()
        )
          member.family.mother = null;
        break;
      case "spouse":
        if (user.family.spouse?.toString() === memberId) {
          user.family.spouse = null;
          member.family.spouse = null;
        }
        break;
    }

    await Promise.all([user.save(), member.save()]);

    // Log activity
    await logActivity(
      userId,
      "removed_family_member",
      `Removed ${member.username} as ${relation}`,
      { memberId: member._id, relation }
    );

    const populatedUser = await User.findById(userId)
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");

    res
      .status(200)
      .json({ message: "Family member removed", user: populatedUser });
  } catch (err) {
    return next(new AppError("Remove family member error", 500));
  }
};

// SOS alert function (unchanged)
export const sendSosAlert = async (req, res, next) => {
  const userId = req.user?._id;
  const { message = "I need help", location } = req.body || {};

  if (!userId) return next(new AppError("Unauthorized", 401));

  try {
    const user = await User.findById(userId)
      .select("username email phone whatsappPhone family")
      .populate(
        "family.father family.mother family.spouse family.children",
        "email username phone whatsappPhone",
      );

    if (!user) return next(new AppError("Current user not found", 404));

    const members = [];
    if (user.family?.father) members.push(user.family.father);
    if (user.family?.mother) members.push(user.family.mother);
    if (user.family?.spouse) members.push(user.family.spouse);
    if (Array.isArray(user.family?.children))
      members.push(...user.family.children);

    const recipientEmails = [
      ...new Set(members.map((m) => m?.email).filter(Boolean)),
    ].filter((email) => email !== user.email);

    const recipientWhatsAppNumbers = [
      ...new Set(members.map((m) => m?.whatsappPhone).filter(Boolean)),
    ];

    if (recipientEmails.length === 0 && recipientWhatsAppNumbers.length === 0) {
      return next(
        new AppError("No family members with email or WhatsApp to send SOS", 400),
      );
    }

    // Send Email
    if (recipientEmails.length > 0) {
      try {
        const transporter = createMailTransport();
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: recipientEmails,
          subject: `SOS alert from ${user.username}`,
          text: message,
        });
        console.log("SOS emails sent");
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    // Send WhatsApp Messages
    const whatsappResults = [];
    if (recipientWhatsAppNumbers.length > 0) {
      for (const phoneNumber of recipientWhatsAppNumbers) {
        const result = await sendSOSWhatsApp(phoneNumber, {
          username: user.username,
          phone: user.phone,
        });
        whatsappResults.push({ phone: phoneNumber, ...result });
      }
    }

    // Log activity
    await logActivity(
      userId,
      "sent_sos",
      `Sent SOS alert to ${recipientEmails.length} email(s) and ${recipientWhatsAppNumbers.length} WhatsApp contact(s)`,
      { 
        message, 
        recipientEmails: recipientEmails.length,
        recipientWhatsApp: recipientWhatsAppNumbers.length,
        location
      }
    );

    return res.status(200).json({ 
      message: "SOS sent successfully", 
      sentTo: {
        emails: recipientEmails,
        whatsapp: recipientWhatsAppNumbers
      },
      whatsappResults
    });
  } catch (err) {
    console.error("SOS Alert Error:", err);
    return next(new AppError("SOS sending failed", 500));
  }
};

// Helper function to check if memberId is in the user's family
const isFamilyMember = (user, memberId) => {
  const memberIdStr = memberId.toString();

  if (user.family.father?.toString() === memberIdStr) return true;
  if (user.family.mother?.toString() === memberIdStr) return true;
  if (user.family.spouse?.toString() === memberIdStr) return true;
  if (user.family.children?.some((id) => id.toString() === memberIdStr))
    return true;

  return false;
};

// Check if a family member allows access based on their private setting
const canAccessFamilyMemberData = async (memberId) => {
  const member = await User.findById(memberId).select("private");
  if (!member) return false;
  // Family members can always view, regardless of private setting
  return true;
};

// Check if a family member can edit (add/delete) data
const canEditFamilyMemberData = async (memberId) => {
  const member = await User.findById(memberId).select("private");
  if (!member) return false;
  // Can edit only if private is false
  return !member.private;
};

// Get family member's medications
export const getFamilyMemberMedications = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { memberId } = req.params;

    if (!userId) return next(new AppError("Unauthorized", 401));
    if (!memberId) return next(new AppError("Member ID is required", 400));

    // Get the current user with family populated
    const user = await User.findById(userId).select("family");
    if (!user) return next(new AppError("User not found", 404));

    // Check if memberId is in the user's family
    if (!isFamilyMember(user, memberId)) {
      return next(new AppError("Access denied: Not a family member", 403));
    }

    // Check if the family member allows access to their data
    const canAccess = await canAccessFamilyMemberData(memberId);
    if (!canAccess) {
      return next(
        new AppError(
          "Access denied: Member privacy settings prevent access",
          403,
        ),
      );
    }

    // Fetch medications for the family member
    const medications = await Medication.find({ owner: memberId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ medications });
  } catch (err) {
    return next(new AppError("Failed to fetch family member medications", 500));
  }
};

// Get family member's chronic conditions
export const getFamilyMemberConditions = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { memberId } = req.params;

    if (!userId) return next(new AppError("Unauthorized", 401));
    if (!memberId) return next(new AppError("Member ID is required", 400));

    // Get the current user with family populated
    const user = await User.findById(userId).select("family");
    if (!user) return next(new AppError("User not found", 404));

    // Check if memberId is in the user's family
    if (!isFamilyMember(user, memberId)) {
      return next(new AppError("Access denied: Not a family member", 403));
    }

    // Check if the family member allows access to their data
    const canAccess = await canAccessFamilyMemberData(memberId);
    if (!canAccess) {
      return next(
        new AppError(
          "Access denied: Member privacy settings prevent access",
          403,
        ),
      );
    }

    // Fetch chronic conditions for the family member
    const conditions = await ChronicCondition.find({ owner: memberId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ conditions });
  } catch (err) {
    return next(new AppError("Failed to fetch family member conditions", 500));
  }
};

// Get family member's medical reports
export const getFamilyMemberReports = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { memberId } = req.params;

    if (!userId) return next(new AppError("Unauthorized", 401));
    if (!memberId) return next(new AppError("Member ID is required", 400));

    // Get the current user with family populated
    const user = await User.findById(userId).select("family");
    if (!user) return next(new AppError("User not found", 404));

    // Check if memberId is in the user's family
    if (!isFamilyMember(user, memberId)) {
      return next(new AppError("Access denied: Not a family member", 403));
    }

    // Check if the family member allows access to their data
    const canAccess = await canAccessFamilyMemberData(memberId);
    if (!canAccess) {
      return next(
        new AppError(
          "Access denied: Member privacy settings prevent access",
          403,
        ),
      );
    }

    // Fetch medical reports for the family member
    // Only include reports that are NOT marked as private
    const reports = await MedicalReport.find({
      owner: memberId,
      isPrivate: false,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ reports });
  } catch (err) {
    return next(new AppError("Failed to fetch family member reports", 500));
  }
};

// ==================== FAMILY REQUEST SYSTEM ====================

// Send family member request
export const sendFamilyRequest = async (req, res, next) => {
  try {
    const { memberEmail, memberPhone, relation, message } = req.body;
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));
    if (!memberEmail || !memberPhone || !relation)
      return next(new AppError("All fields are required", 400));

    if (!["father", "mother", "child", "spouse"].includes(relation))
      return next(new AppError("Invalid relation type", 400));

    // Find the receiver
    let receiver = null;
    receiver = await User.findOne({
      email: memberEmail,
      phone: memberPhone,
    });

    if (!receiver) return next(new AppError("User not found", 404));
    if (receiver._id.toString() === userId.toString())
      return next(new AppError("Cannot send request to yourself", 400));

    // Check if user already has this relation
    const sender = await User.findById(userId);
    if (!sender) return next(new AppError("User not found", 404));

    // Check if receiver is already a family member
    if (isFamilyMember(sender, receiver._id)) {
      return next(new AppError("User is already a family member", 400));
    }

    if (relation === "father" && sender.family.father) {
      return next(new AppError("You already have a father added", 400));
    }
    if (relation === "mother" && sender.family.mother) {
      return next(new AppError("You already have a mother added", 400));
    }
    if (relation === "spouse") {
      if (sender.family.spouse) {
        return next(new AppError("You already have a spouse added", 400));
      }
      if (receiver.family.spouse) {
        return next(
          new AppError("The user you're requesting already has a spouse", 400),
        );
      }
    }

    if (relation === "child") {
      if (sender.gender === "male" && receiver.family.father) {
        return next(new AppError("This user already has a father added", 400));
      }
      if (sender.gender === "female" && receiver.family.mother) {
        return next(new AppError("This user already has a mother added", 400));
      }
    }

    // Check if there's already a pending request for Father or Mother
    if (["father", "mother"].includes(relation)) {
      const pendingRoleRequest = await FamilyRequest.findOne({
        sender: userId,
        relation,
        status: "pending",
      });
      if (pendingRoleRequest) {
        return next(
          new AppError(`You already have a pending request for a ${relation}`, 400),
        );
      }
    }

    // Check if request already exists for this specific receiver
    const existingRequest = await FamilyRequest.findOne({
      sender: userId,
      receiver: receiver._id,
      status: "pending",
    });

    if (existingRequest) return next(new AppError("Request already sent to this user", 400));

    // Create the request
    if (receiver.gender ===sender.gender && relation === "spouse") {
      return next(new AppError("Spouse must be opposite gender", 400));
    }

    if (receiver.gender === "female" && relation === "father") {
      return next(new AppError("Father must be male", 400));
    }

    if (receiver.gender === "male" && relation === "mother") {
      return next(new AppError("Mother must be female", 400));
    }

    const request = await FamilyRequest.create({
      sender: userId,
      receiver: receiver._id,
      relation,
      message: message || "",
    });

    const populatedRequest = await FamilyRequest.findById(request._id)
      .populate("sender", "username email")
      .populate("receiver", "username email");

    // Log activity
    await logActivity(
      userId,
      "sent_family_request",
      `Sent family request to ${receiver.username} as ${relation}`,
      { receiverId: receiver._id, relation }
    );

    return res.status(201).json({
      message: "Family request sent successfully",
      request: populatedRequest,
    });
  } catch (err) {
    return next(new AppError("Failed to send family request", 500));
  }
};

// Get pending requests (received by current user)
export const getPendingRequests = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const requests = await FamilyRequest.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "username email phone gender")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (err) {
    return next(new AppError("Failed to fetch requests", 500));
  }
};

// Get sent requests (sent by current user)
export const getSentRequests = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const requests = await FamilyRequest.find({
      sender: userId,
      status: "pending",
    })
      .populate("receiver", "username email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (err) {
    return next(new AppError("Failed to fetch sent requests", 500));
  }
};

// Accept family request
export const acceptFamilyRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    const request = await FamilyRequest.findById(requestId);
    if (!request) return next(new AppError("Request not found", 404));

    if (request.receiver.toString() !== userId.toString())
      return next(new AppError("Not authorized to accept this request", 403));

    if (request.status !== "pending")
      return next(new AppError("Request already processed", 400));

    // Get both users
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    if (!sender || !receiver) return next(new AppError("User not found", 404));

    // Initialize arrays if undefined
    sender.family.children ||= [];
    receiver.family.children ||= [];

    // Update family relationships based on relation
    const relation = request.relation;

    // Check if roles are already filled
    if (relation === "father" && sender.family.father) {
      return next(new AppError("Sender already has a father", 400));
    }
    if (relation === "mother" && sender.family.mother) {
      return next(new AppError("Sender already has a mother", 400));
    }
    if (relation === "spouse") {
      if (sender.family.spouse)
        return next(new AppError("Sender already has a spouse", 400));
      if (receiver.family.spouse)
        return next(new AppError("You already have a spouse", 400));
    }
    if (relation === "child") {
      if (sender.gender === "male" && receiver.family.father)
        return next(new AppError("Receiver already has a father", 400));
      if (sender.gender === "female" && receiver.family.mother)
        return next(new AppError("Receiver already has a mother", 400));
    }

    switch (relation) {
      case "father":
        // Sender wants to add receiver as father
        sender.family.father = receiver._id;
        if (!receiver.family.children.includes(sender._id))
          receiver.family.children.push(sender._id);
        break;
      case "mother":
        sender.family.mother = receiver._id;
        if (!receiver.family.children.includes(sender._id))
          receiver.family.children.push(sender._id);
        break;
      case "child":
        if (!sender.family.children.includes(receiver._id))
          sender.family.children.push(receiver._id);
        if (sender.gender === "male") receiver.family.father = sender._id;
        else if (sender.gender === "female")
          receiver.family.mother = sender._id;
        break;
      case "spouse":
        if (sender.gender === receiver.gender) {
          return next(
            new AppError("Spouse must be of the opposite gender", 400),
          );
        }
        sender.family.spouse = receiver._id;
        receiver.family.spouse = sender._id;
        break;
    }

    // Save both users and update request status
    await Promise.all([
      sender.save(),
      receiver.save(),
      FamilyRequest.findByIdAndUpdate(requestId, { status: "accepted" }),
    ]);

    // Auto-decline other requests that are now invalid
    const cleanupFilters = [];
    if (relation === "spouse") {
      cleanupFilters.push(
        { sender: sender._id, relation: "spouse", status: "pending" },
        { receiver: sender._id, relation: "spouse", status: "pending" },
        { sender: receiver._id, relation: "spouse", status: "pending" },
        { receiver: receiver._id, relation: "spouse", status: "pending" },
      );
    } else if (relation === "father") {
      cleanupFilters.push({
        sender: sender._id,
        relation: "father",
        status: "pending",
      });
    } else if (relation === "mother") {
      cleanupFilters.push({
        sender: sender._id,
        relation: "mother",
        status: "pending",
      });
    } else if (relation === "child") {
      // If B (receiver) just got a father/mother, decline B's other requests for that role
      if (sender.gender === "male") {
        cleanupFilters.push({
          sender: receiver._id,
          relation: "father",
          status: "pending",
        });
      } else if (sender.gender === "female") {
        cleanupFilters.push({
          sender: receiver._id,
          relation: "mother",
          status: "pending",
        });
      }
    }

    if (cleanupFilters.length > 0) {
      await FamilyRequest.updateMany(
        {
          $or: cleanupFilters,
          _id: { $ne: requestId },
        },
        { status: "declined" },
      );
    }

    // Log activity for both sender and receiver
    await Promise.all([
      logActivity(
        receiver._id,
        "accepted_family_request",
        `Accepted family request from ${sender.username}`,
        { senderId: sender._id, relation }
      ),
      logActivity(
        sender._id,
        "family_request_accepted",
        `${receiver.username} accepted your family request`,
        { receiverId: receiver._id, relation }
      )
    ]);

    // Get updated user data
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");

    return res.status(200).json({
      message: "Family request accepted",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Accept request error:", err);
    return next(new AppError("Failed to accept request", 500));
  }
};

// Decline family request
export const declineFamilyRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    const request = await FamilyRequest.findById(requestId);
    if (!request) return next(new AppError("Request not found", 404));

    if (request.receiver.toString() !== userId.toString())
      return next(new AppError("Not authorized to decline this request", 403));

    if (request.status !== "pending")
      return next(new AppError("Request already processed", 400));

    await FamilyRequest.findByIdAndUpdate(requestId, { status: "declined" });

    // Log activity
    await logActivity(
      userId,
      "declined_family_request",
      `Declined family request from ${request.sender}`,
      { requestId, senderId: request.sender }
    );

    return res.status(200).json({ message: "Family request declined" });
  } catch (err) {
    return next(new AppError("Failed to decline request", 500));
  }
};

// Cancel sent request
export const cancelFamilyRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?._id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    const request = await FamilyRequest.findById(requestId);
    if (!request) return next(new AppError("Request not found", 404));

    if (request.sender.toString() !== userId.toString())
      return next(new AppError("Not authorized to cancel this request", 403));

    if (request.status !== "pending")
      return next(new AppError("Request already processed", 400));

    await FamilyRequest.findByIdAndDelete(requestId);

    // Log activity
    await logActivity(
      userId,
      "cancelled_family_request",
      `Cancelled family request to ${request.receiver}`,
      { requestId, receiverId: request.receiver }
    );

    return res.status(200).json({ message: "Family request cancelled" });
  } catch (err) {
    return next(new AppError("Failed to cancel request", 500));
  }
};
