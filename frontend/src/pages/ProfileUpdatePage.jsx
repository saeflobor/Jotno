import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowBack } from "react-icons/md";
import ConfirmationModal from "../components/ConfirmationModal";

const ProfileUpdatePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: user?.phone || "+88",
    username: user?.username || "",
    password: "",
    confirmPassword: "",
    gender: user?.gender || "male",
    private: user?.private || false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone input
    if (name === "phone") {
      if (!value.startsWith("+88")) {
        setFormData((prev) => ({ ...prev, [name]: "+88" }));
        return;
      }
      
      // Only allow digits after +88
      const afterPrefix = value.slice(3);
      if (!/^\d*$/.test(afterPrefix)) {
        return;
      }
      
      // Limit to 14 characters total (+88 + 11 digits)
      if (value.length > 14) {
        return;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages on input
    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const emailChanged = formData.email && formData.email !== user?.email;
    const phoneChanged =
      formData.phone &&
      formData.phone !== "+88" &&
      formData.phone !== user?.phone;
    const usernameChanged =
      formData.username && formData.username !== user?.username;
    const passwordChanged = !!formData.password;
    const genderChanged =
      formData.gender && formData.gender !== user?.gender;
    const privateChanged = formData.private !== user?.private;

    if (
      !emailChanged &&
      !phoneChanged &&
      !usernameChanged &&
      !passwordChanged &&
      !genderChanged &&
      !privateChanged
    ) {
      setErrorMessage("Please fill in at least one field to update");
      return false;
    }

    // Email validation
    if (emailChanged) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        setErrorMessage("Invalid email format");
        return false;
      }
    }

    // Phone validation
    if (phoneChanged) {
      const phoneRegex = /^\+88(013|014|015|016|017|018|019)\d{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        setErrorMessage("Phone must be a valid Bangladeshi number (format: +8801XXXXXXXXX)");
        return false;
      }
    }

    // Password validation
    if (passwordChanged) {
      if (formData.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match");
        return false;
      }
    }

    // Gender validation
    if (formData.gender && !["male", "female"].includes(formData.gender)) {
      setErrorMessage("Invalid gender selection");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    try {
      const updatePayload = {};

      // Only include fields that have been changed or have values
      if (formData.email && formData.email !== user?.email) {
        updatePayload.email = formData.email;
      }
      if (formData.phone && formData.phone !== user?.phone) {
        updatePayload.phone = formData.phone;
      }
      if (formData.username && formData.username !== user?.username) {
        updatePayload.username = formData.username;
      }
      if (formData.password) {
        updatePayload.password = formData.password;
      }
      if (formData.gender && formData.gender !== user?.gender) {
        updatePayload.gender = formData.gender;
      }
      if (formData.private !== user?.private) {
        updatePayload.private = formData.private;
      }

      if (Object.keys(updatePayload).length === 0) {
        setErrorMessage("No changes detected");
        setIsLoading(false);
        return;
      }

      const response = await axios.put("/api/users/update", updatePayload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        setUser(response.data.user);
        setSuccessMessage("Profile updated successfully!");

        // Reset form and redirect after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to update profile";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 mb-8 text-[rgb(211,46,149)] hover:text-[rgb(190,35,130)] transition font-semibold"
        >
          <MdArrowBack className="text-xl" />
          Back to Dashboard
        </motion.button>

        <div className="mb-4 text-sm text-gray-600">
          Dashboard / <span className="text-gray-900 font-semibold">Update Profile</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Update Profile
          </h1>
          <p className="text-gray-600">
            Update your email, phone, username, password, or gender
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
          style={{ boxShadow: "8px 8px 20px rgba(211, 46, 149, 0.1)" }}
        >
          {/* Floating Notifications */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="fixed top-6 right-6 z-50 w-80 p-4 rounded-xl shadow-lg bg-green-50 border border-green-200"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-green-600">✔</div>
                  <div className="flex-1">
                    <p className="text-green-800 font-semibold">{successMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage("")}
                    className="text-green-700 hover:text-green-900"
                    aria-label="Dismiss success message"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="fixed top-6 right-6 z-50 w-80 p-4 rounded-xl shadow-lg bg-red-50 border border-red-200"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-red-600">⚠</div>
                  <div className="flex-1">
                    <p className="text-red-800 font-semibold">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage("")}
                    className="text-red-700 hover:text-red-900"
                    aria-label="Dismiss error message"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                // value={formData.email}
                onChange={handleChange}
                placeholder={user?.email || "Enter your email"}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
              />
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.email}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+8801xxxxxxxxx"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
              />
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.phone}
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                // value={formData.username}
                onChange={handleChange}
                placeholder={user?.username || "Enter your username"}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
              />
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.username}
              </p>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                onChange={handleChange}
                placeholder={user?.gender || "Select gender"}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition text-gray-900 bg-white appearance-none cursor-pointer"
              >
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.gender}
              </p>
            </div>

            {/* Private Profile */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-4">
                Profile Privacy Settings
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      private: !prev.private,
                    }))
                  }
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                    formData.private ? "bg-[rgb(211,46,149)]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formData.private ? "translate-x-9" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-gray-600 font-medium">
                  {formData.private ? "Private" : "Public"}
                </span>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  <span className="font-semibold">Public Profile:</span> Family
                  members can view your health information and add medications
                  and medical reports.
                </p>
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Private Profile:</span> Only
                  you can manage your health information.
                </p>
              </div>
              <p className="text-xs text-gray-700 mt-3">
                Current:{" "}
                {user?.private
                  ? "Private - Only you manage your data"
                  : "Public - Family members can add info"}
              </p>
            </div>

            {/* Password */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">
                  Password Change (Optional)
                </span>{" "}
                - Leave blank to keep password unchanged
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xl font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    // value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
                  />
                </div>

                <div>
                  <label className="block text-xl font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    // value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 rounded-4xl font-semibold text-white transition disabled:opacity-60"
                style={{
                  background: isLoading
                    ? "rgba(211, 46, 149, 0.5)"
                    : "linear-gradient(90deg, rgb(211, 46, 149), rgb(255, 95, 109))",
                }}
              >
                {isLoading ? "Updating..." : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-3 rounded-4xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200"
        >
          <p className="text-sm text-blue-700 text-center">
            <span className="font-semibold">Note:</span> Please keep your profile information up to date.
          </p>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Update Profile"
        message="Are you sure you want to update your profile information?"
        confirmText="Yes, Update"
        onConfirm={handleConfirmUpdate}
        onCancel={() => setShowConfirmation(false)}
      />
    </div>
  );
};

export default ProfileUpdatePage;
