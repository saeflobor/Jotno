import User from "../models/User.js";
import FamilyRequest from "../models/FamilyRequest.js";
import { protect } from "../middleware/auth.js";
import { sendEmail } from "../utils/emailverification.js";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import { generateToken, generateverifyToken } from "../utils/generatetokens.js";

const verifyemail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { verified: true },
      { new: true },
    )
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");

    const localStoragetoken = generateToken(user._id);
    return res
      .status(200)
      .json({ success: true, user, token: localStoragetoken });
  } catch (error) {
    return next(new AppError("Invalid or expired token", 400));
  }
};

// Register route
const register = async (req, res, next) => {
  const { username, email, phone, password, gender, timezone } = req.body;
  try {
    const domain = email.split("@")[1];
    if (
      domain !== "gmail.com" &&
      domain !== "yahoo.com" &&
      domain !== "outlook.com" &&
      domain !== "iut-dhaka.edu"
    ) {
      return next(new AppError("Email not supported in the DNS", 400));
    }
    const check_user = await User.findOne({ email });
    if (!check_user) {
      const user = await User.create({
        username,
        email,
        password,
        verified: false,
        gender,
        phone,
        private: false,
        timezone: timezone || "UTC",
      });

      const verifytoken = generateverifyToken(user._id);
      const sendemail = await sendEmail(email, verifytoken);
      if (!sendemail.success) {
        return next(new AppError("Email not sent, please try again", 500));
      }
      console.log("Verification email sent");
      return res
        .status(200)
        .json({ message: "Registration successful, please verify your email" });
    } else if (check_user.verified === false) {
      return next(
        new AppError(
          "Please verify your email for successful registration",
          401,
        ),
      );
    } else {
      return next(new AppError("Email already exists", 400));
    }
  } catch (err) {
    return next(err);
  }
};

// Login route
const Login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    if (user.verified === false) {
      return next(new AppError("Please verify your email to login", 401));
    }
    const token = generateToken(user._id);
    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");

    res.status(200).json({
      ...populatedUser._doc,
      token,
    });
  } catch (err) {
    return next(err);
  }
};

// Me route
// In auth.js, modify /me route
const UserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");
    res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
};

// Update Profile route
const updateProfile = async (req, res, next) => {
  try {
    const {
      email,
      phone,
      username,
      password,
      gender,
      private: isPrivate,
      timezone,
    } = req.body;
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return next(new AppError("Email already exists", 400));
      }
      // Store pending email and send verification
      user.pendingEmail = email;
      const verifytoken = generateverifyToken(user._id);
      
      // Send email with timeout to prevent hanging
      try {
        const emailPromise = sendEmail(email, verifytoken, true);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email timeout')), 10000)
        );
        
        const sendemail = await Promise.race([emailPromise, timeoutPromise]);
        
        if (!sendemail.success) {
          return next(new AppError("Verification email not sent, please try again", 500));
        }
      } catch (error) {
        console.error('Email sending error:', error);
        return next(new AppError("Email service temporarily unavailable. Your email change has been saved, but verification email could not be sent.", 500));
      }
    }

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== user.phone) {
      // Validate phone format - must include +88 prefix
      if (!/^\+88(013|014|015|016|017|018|019)\d{8}$/.test(phone)) {
        return next(new AppError("Invalid phone number format. Use format: +8801XXXXXXXXX", 400));
      }
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return next(new AppError("Phone number already exists", 400));
      }
      user.phone = phone;
    }

    // Update username
    if (username) {
      user.username = username;
    }

    // Update gender
    if (gender) {
      if (!["male", "female"].includes(gender)) {
        return next(
          new AppError("Invalid gender. Must be 'male' or 'female'", 400),
        );
      }

      // Check if gender is actually being changed
      if (gender !== user.gender) {
        // Check if the user has a spouse or children linked
        if ((user.family.children && user.family.children.length > 0) || user.family.spouse) {
          return next(
            new AppError(
              "You cannot change your gender as you already have a spouse or children linked to your account.",
              400,
            ),
          );
        }
      }

      user.gender = gender;
    }

    // Update password if provided
    if (password) {
      user.password = password; // Password will be hashed by the pre-save hook
    }

    // Update private status if provided
    if (isPrivate !== undefined) {
      user.private = Boolean(isPrivate);
    }
    
    // Update timezone if provided
    if (timezone) {
      user.timezone = timezone;
    }

    // Save the updated user
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");

    // Check if email change was requested
    const emailChangeRequested = updatedUser.pendingEmail !== null;

    res.status(200).json({
      success: true,
      message: emailChangeRequested 
        ? "Verification email sent. Please check your new email to confirm the change."
        : "Profile updated successfully",
      user: updatedUser,
      emailChangeRequested,
    });
  } catch (err) {
    return next(err);
  }
};

// Verify Email Change route
const verifyEmailChange = async (req, res, next) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.pendingEmail) {
      return next(new AppError("No pending email change found", 400));
    }

    // Update email and clear pendingEmail
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("family.father family.spouse family.mother family.children");

    const localStoragetoken = generateToken(user._id);
    return res
      .status(200)
      .json({ success: true, user: updatedUser, token: localStoragetoken });
  } catch (error) {
    return next(new AppError("Invalid or expired token", 400));
  }
};

export { register, Login, UserDetails, verifyemail, updateProfile, verifyEmailChange };
