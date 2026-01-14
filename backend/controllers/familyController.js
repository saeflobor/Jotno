import User from "../models/User.js";
import nodemailer from "nodemailer";
import AppError from "../utils/AppError.js";

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
  if ((!memberEmail && !memberPhone) || !relation)
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
