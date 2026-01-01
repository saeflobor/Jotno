import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { sendEmail } from "../utils/emailverification.js";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import { generateToken, generateverifyToken } from "../utils/generatetokens.js";

const verifyemail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByIdAndUpdate(decoded.id, { verified: true });
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
  const { username, email, phone, password, role, gender } = req.body;
  try {
    const domain = email.split("@")[1];
    if (
      domain !== "gmail.com" &&
      domain !== "yahoo.com" &&
      domain !== "outlook.com"
    ) {
      return next(new AppError("Email doesnot support in the dns", 400));
    }
    const check_user = await User.findOne({ email }); 
    if(!check_user){
      const user = await User.create({
      username,
      email,
      password,
      role,
      verified: false,
      gender,
      phone,
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
    }
    
    else if(check_user.verified===false){
      return next(new AppError("Please verify your email for successful registration", 401));
    }
    else {
      return next(new AppError("Email already exists", 400));
    }

  } catch (err) {
    return next(err);
  }
};

// Login route
const Login = async (req, res, next) => {
  const { email, password, role } = req.body;
  try {
    if (!email || !password || !role) {
      return next(new AppError("Please provide email, password and role", 400));
    }

    if (!["doctor", "patient"].includes(role)) {
      return next(new AppError("Invalid role provided", 400));
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    if (user.role !== role) {
      return next(new AppError("Role does not match", 401));
    }

    if (user.verified === false) {
      return next(new AppError("Please verify your email to login", 401));
    }
    const token = generateToken(user._id);
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      token,
    });
  } catch (err) {
    return next(err);
  }
};

// Me route
// In auth.js, modify /me route
const UserDetails = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate(
      "family.father family.spouse family.mother family.siblings family.children"
    );
  res.status(200).json(user);
};

export { register, Login, UserDetails, verifyemail };
