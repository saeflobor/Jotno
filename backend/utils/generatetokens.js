import jwt from "jsonwebtoken";
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const generateverifyToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "600s" });
};

export {generateToken, generateverifyToken}