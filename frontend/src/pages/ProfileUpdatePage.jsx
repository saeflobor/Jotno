import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { MdArrowBack } from "react-icons/md";
import ConfirmationModal from "../components/ConfirmationModal";

const ProfileUpdatePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    timezone: user?.timezone || "UTC",
    whatsappPhone: user?.whatsappPhone || "",
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
    const timezoneChanged = formData.timezone && formData.timezone !== user?.timezone;
    const whatsappChanged = formData.whatsappPhone && formData.whatsappPhone !== user?.whatsappPhone;

    if (
      !emailChanged &&
      !phoneChanged &&
      !usernameChanged &&
      !passwordChanged &&
      !genderChanged &&
      !privateChanged &&
      !timezoneChanged &&
      !whatsappChanged
    ) {
      setErrorMessage(t('profileUpdate.fillAtLeastOne'));
      return false;
    }

    // Email validation
    if (emailChanged) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        setErrorMessage(t('profileUpdate.invalidEmail'));
        return false;
      }
    }

    // Phone validation
    if (phoneChanged) {
      const phoneRegex = /^\+88(013|014|015|016|017|018|019)\d{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        setErrorMessage(t('profileUpdate.invalidPhone'));
        return false;
      }
    }

    // WhatsApp validation
    if (whatsappChanged) {
      const whatsappRegex = /^\+\d{1,15}$/;
      if (!whatsappRegex.test(formData.whatsappPhone)) {
        setErrorMessage(t('profileUpdate.invalidWhatsapp'));
        return false;
      }
    }

    // Password validation
    if (passwordChanged) {
      if (formData.password.length < 6) {
        setErrorMessage(t('profileUpdate.shortPassword'));
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage(t('profileUpdate.passwordMismatch'));
        return false;
      }
    }

    // Gender validation
    if (formData.gender && !["male", "female"].includes(formData.gender)) {
      setErrorMessage(t('profileUpdate.invalidGender'));
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
      if (formData.timezone && formData.timezone !== user?.timezone) {
        updatePayload.timezone = formData.timezone;
      }
      if (formData.whatsappPhone && formData.whatsappPhone !== user?.whatsappPhone) {
        updatePayload.whatsappPhone = formData.whatsappPhone;
      }

      if (Object.keys(updatePayload).length === 0) {
        setErrorMessage(t('profileUpdate.noChanges'));
        setIsLoading(false);
        return;
      }

      const response = await axios.put("/api/users/update", updatePayload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        // Check if email change was requested
        if (response.data.emailChangeRequested) {
          setSuccessMessage(response.data.message || "Verification email sent! Please check your new email to confirm the change.");
          
          // Don't update user or redirect immediately for email changes
          setTimeout(() => {
            navigate("/dashboard");
          }, 4000);
        } else {
          setUser(response.data.user);
          setSuccessMessage(response.data.message || "Profile updated successfully!");

          // Reset form and redirect after 2 seconds
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        }
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        t('profileUpdate.updateFailed');
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-8 text-[rgb(211,46,149)] hover:text-[rgb(190,35,130)] transition font-semibold text-sm sm:text-base"
        >
          <MdArrowBack className="text-lg sm:text-xl" />
          <span className="hidden sm:inline">{t('profileUpdate.backToDashboard')}</span>
          <span className="sm:hidden">{t('profileUpdate.back')}</span>
        </motion.button>

        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          {t('profileUpdate.breadcrumb')} <span className="text-gray-900 font-semibold">{t('profileUpdate.updateProfile')}</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            {t('profileUpdate.updateProfile')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t('profileUpdate.subtitle')}
          </p>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 sm:p-8 shadow-lg"
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
                className="fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-50 sm:w-80 p-4 rounded-xl shadow-lg bg-green-50 border border-green-200"
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
                    aria-label={t('profileUpdate.dismissSuccess')}
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
                className="fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-50 sm:w-80 p-4 rounded-xl shadow-lg bg-red-50 border border-red-200"
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
                    aria-label={t('profileUpdate.dismissError')}
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
              <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-2">
                {t('profileUpdate.emailLabel')}
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
              <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-2">
                {t('profileUpdate.phoneLabel')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('profileUpdate.phonePlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
              />
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.phone}
              </p>
            </div>

            {/* WhatsApp Phone */}
            <div>
              <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-2">
                {t('profileUpdate.whatsappLabel')}
              </label>
              <input
                type="tel"
                name="whatsappPhone"
                value={formData.whatsappPhone}
                onChange={handleChange}
                placeholder={t('profileUpdate.whatsappPlaceholder')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
              />
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.whatsappPhone || t('profileUpdate.whatsappNotSet')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {t('profileUpdate.whatsappInfo')}
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-2">
                {t('profileUpdate.usernameLabel')}
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
              <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-2">
                {t('profileUpdate.genderLabel')}
              </label>
              <select
                name="gender"
                onChange={handleChange}
                placeholder={user?.gender || "Select gender"}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition text-gray-900 bg-white appearance-none cursor-pointer"
              >
                <option value="male">{t('profileUpdate.male')}</option>
                <option value="female">{t('profileUpdate.female')}</option>
              </select>
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.gender}
              </p>
            </div>

            {/* Timezone */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-base sm:text-xl font-semibold text-gray-700">
                  {t('profileUpdate.timezoneLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    setFormData(prev => ({ ...prev, timezone: detectedTz }));
                  }}
                  className="text-xs font-semibold text-[rgb(211,46,149)] hover:text-[rgb(190,35,130)] transition underline decoration-dotted underline-offset-4"
                >
                  {t('profileUpdate.detectCurrent')}
                </button>
              </div>
              <div className="relative">
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-transparent transition text-gray-900 bg-white appearance-none cursor-pointer"
                >
                  {[
                    "UTC",
                    "Asia/Dhaka",
                    "Asia/Kolkata",
                    "Asia/Dubai",
                    "Europe/London",
                    "Europe/Paris",
                    "America/New_York",
                    "America/Chicago",
                    "America/Los_Angeles",
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                    user?.timezone
                  ].filter((tz, index, self) => tz && self.indexOf(tz) === index).map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <p className="text-xs text-gray-700 mt-3">
                Current: {user?.timezone || "UTC"}
              </p>
            </div>

            {/* Private Profile */}
            <div>
              <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-4">
                {t('profileUpdate.privacyLabel')}
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
                  {formData.private ? t('profileUpdate.private') : t('profileUpdate.public')}
                </span>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  <span className="font-semibold">{t('profileUpdate.publicInfo')}</span> {t('profileUpdate.publicInfoDetail')}
                </p>
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">{t('profileUpdate.privateInfo')}</span> {t('profileUpdate.privateInfoDetail')}
                </p>
              </div>
              <p className="text-xs text-gray-700 mt-3">
                Current:{" "}
                {user?.private
                  ? t('profileUpdate.currentPrivate')
                  : t('profileUpdate.currentPublic')}
              </p>
            </div>

            {/* Password */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">
                  {t('profileUpdate.passwordSection')}
                </span>{" "}
                - {t('profileUpdate.passwordHint')}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-2">
                    {t('profileUpdate.newPasswordLabel')}
                  </label>
                  <input
                    type="password"
                    name="password"
                    // value={formData.password}
                    onChange={handleChange}
                    placeholder={t('profileUpdate.newPasswordPlaceholder')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(211,46,149)] transition placeholder-black/50 text-black"
                  />
                </div>

                <div>
                  <label className="block text-base sm:text-xl font-semibold text-gray-700 mb-2">
                    {t('profileUpdate.confirmPasswordLabel')}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    // value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t('profileUpdate.confirmPasswordPlaceholder')}
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
                {isLoading ? t('profileUpdate.updating') : t('profileUpdate.updateBtn')}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-3 rounded-4xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                {t('profileUpdate.cancelBtn')}
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
            <span className="font-semibold">{t('profileUpdate.note').split(':')[0]}:</span> {t('profileUpdate.note').split(': ').slice(1).join(': ')}
          </p>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title={t('profileUpdate.confirmTitle')}
        message={t('profileUpdate.confirmMessage')}
        confirmText={t('profileUpdate.confirmYes')}
        onConfirm={handleConfirmUpdate}
        onCancel={() => setShowConfirmation(false)}
      />
    </div>
  );
};

export default ProfileUpdatePage;
