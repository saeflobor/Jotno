import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { MdArrowBack } from "react-icons/md";
import { CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/users/reset-password", { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Section */}
      <motion.div
        className="w-[60%] bg-gradient-to-b from-[rgb(211,46,149)] via-[rgb(235,80,160)] to-[rgb(255,150,190)] relative overflow-hidden flex flex-col justify-start pt-65 items-center p-16"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[rgb(211,46,149)]/30 via-transparent to-[rgb(230,60,140)]/20" />
        <div className="absolute inset-0 bg-gradient-to-bl from-pink-500/10 via-transparent to-[rgb(211,46,149)]/15" />

        {/* Animated blobs */}
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-[rgb(211,46,149)]/25 to-pink-400/25 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-[rgb(230,60,140)]/25 to-[rgb(211,46,149)]/25 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-3xl">
          <motion.button
            onClick={() => navigate("/login")}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 mb-12 text-white/90 hover:text-white transition font-semibold"
          >
            <MdArrowBack className="text-xl" />
            Back to Login
          </motion.button>

          <motion.div
            className="mb-6 drop-shadow-lg"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="text-6xl font-extrabold text-white leading-none">
              যত্ন : Jotno
            </div>
            <div className="mt-10 text-3xl text-white/90 font-semibold tracking-wide">
              Reset Your Password
            </div>
          </motion.div>

          <motion.p
            className="text-2xl text-white/95 mb-12 leading-relaxed drop-shadow-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Choose a strong new password to keep your account secure
          </motion.p>
        </div>
      </motion.div>

      {/* Right Section */}
      <motion.div
        className="w-[40%] flex items-center justify-center p-12 bg-gray-50"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="w-full max-w-md">
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-xl"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 100 }}
          >
            {success ? (
              /* Success State */
              <motion.div
                className="text-center py-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Your password has been updated. You can now sign in with your new password.
                </p>
                <motion.button
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go to Sign In
                </motion.button>
              </motion.div>
            ) : (
              /* Reset Form */
              <>
                <motion.h2
                  className="text-3xl font-bold mb-2 text-gray-900"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  New Password
                </motion.h2>
                <motion.p
                  className="text-gray-600 mb-6 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  Enter and confirm your new password below
                </motion.p>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-red-800 font-medium text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition placeholder-gray-400 text-gray-900 bg-white"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[rgb(211,46,149)] to-[rgb(255,95,109)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    whileHover={{ scale: loading ? 1 : 1.02, boxShadow: "0px 10px 30px rgba(211, 46, 149, 0.3)" }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </motion.button>
                </form>

                <motion.p
                  className="text-center mt-6 text-gray-600 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  Remember your password?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-[rgb(211,46,149)] font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </motion.p>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
