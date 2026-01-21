import User from "../models/User.js";
import nodemailer from "nodemailer";
import AppError from "../utils/AppError.js";
import Medication from "../models/Medication.js";
import ChronicCondition from "../models/ChronicCondition.js";
import MedicalReport from "../models/MedicalReport.js";
import FamilyRequest from "../models/FamilyRequest.js";

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
  if (memberEmail && memberPhone && relation)
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
            new AppError("Spouse must be of the opposite gender", 400)
          );
        }
        user.family.spouse = member._id;
        member.family.spouse = user._id;
        break;
    }

    await Promise.all([user.save(), member.save()]);

    const populatedUser = await User.findById(userId)
      .select("-password")
      .populate(
        "family.father family.spouse family.mother family.children"
      );

    res
      .status(200)
      .json({ message: "Family updated successfully", user: populatedUser });
  } catch (err) {
    return next(new AppError("Server error", 500));
  }
};

// Remove family member (now includes spouse)
export const removeFamilyMember = async (req, res) => {
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
            (id) => id.toString() !== userId.toString()
          );
        }
        break;
      case "mother":
        if (user.family.mother?.toString() === memberId) {
          user.family.mother = null;
          member.family.children = member.family.children.filter(
            (id) => id.toString() !== userId.toString()
          );
        }
        break;
      case "child":
        user.family.children = user.family.children.filter(
          (id) => id.toString() !== memberId.toString()
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

    const populatedUser = await User.findById(userId)
      .select("-password")
      .populate(
        "family.father family.spouse family.mother family.children"
      );

    res
      .status(200)
      .json({ message: "Family member removed", user: populatedUser });
  } catch (err) {
    return next(new AppError("Remove family member error", 500));
  }
};

// SOS alert function (unchanged)
export const sendSosAlert = async (req, res) => {
  const userId = req.user?._id;
  const { message = "I need help" } = req.body || {};

  if (!userId) return next(new AppError("Unauthorized", 401));

  try {
    const user = await User.findById(userId)
      .select("username email family")
      .populate(
        "family.father family.mother family.spouse family.children",
        "email username"
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

    if (recipientEmails.length === 0) {
      return next(
        new AppError("No family members with email to send SOS", 400)
      );
    }

    const transporter = createMailTransport();

    await transporter.sendMail({
      from: process.env.SMTP_FROM || user.email,
      to: recipientEmails,
      subject: `SOS alert from ${user.username}`,
      text: message,
    });

    return res
      .status(200)
      .json({ message: "SOS email sent", sentTo: recipientEmails });
  } catch (err) {
    return next(new AppError("SOS email sending failed", 500));
  }
};

// Helper function to check if memberId is in the user's family
const isFamilyMember = (user, memberId) => {
  const memberIdStr = memberId.toString();
  
  if (user.family.father?.toString() === memberIdStr) return true;
  if (user.family.mother?.toString() === memberIdStr) return true;
  if (user.family.spouse?.toString() === memberIdStr) return true;
  if (user.family.children?.some(id => id.toString() === memberIdStr)) return true;
  
  return false;
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

    // Fetch medical reports for the family member
    const reports = await MedicalReport.find({ owner: memberId }).sort({
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
    if ((!memberEmail && !memberPhone) || !relation)
      return next(new AppError("All fields are required", 400));

    if (!["father", "mother", "child", "spouse"].includes(relation))
      return next(new AppError("Invalid relation type", 400));

    // Find the receiver
    let receiver = null;
    if (memberEmail) receiver = await User.findOne({ email: memberEmail });
    else if (memberPhone) receiver = await User.findOne({ phone: memberPhone });

    if (!receiver) return next(new AppError("User not found", 404));
    if (receiver._id.toString() === userId.toString())
      return next(new AppError("Cannot send request to yourself", 400));

    // Check if request already exists
    const existingRequest = await FamilyRequest.findOne({
      sender: userId,
      receiver: receiver._id,
      status: "pending",
    });

    if (existingRequest)
      return next(new AppError("Request already sent", 400));

    // Create the request
    const request = await FamilyRequest.create({
      sender: userId,
      receiver: receiver._id,
      relation,
      message: message || "",
    });

    const populatedRequest = await FamilyRequest.findById(request._id)
      .populate("sender", "username email")
      .populate("receiver", "username email");

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

    if (!sender || !receiver)
      return next(new AppError("User not found", 404));

    // Initialize arrays if undefined
    sender.family.children ||= [];
    receiver.family.children ||= [];

    // Update family relationships based on relation
    const relation = request.relation;

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
            new AppError("Spouse must be of the opposite gender", 400)
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

    return res.status(200).json({ message: "Family request cancelled" });
  } catch (err) {
    return next(new AppError("Failed to cancel request", 500));
  }
};

