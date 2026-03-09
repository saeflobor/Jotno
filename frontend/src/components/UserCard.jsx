// src/components/UserCard.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/axios";
import AddConditionModal from "./AddConditionModal";
import AddMedicationModal from "./AddMedicationModal";
import ConfirmationModal from "./ConfirmationModal";
import { useTranslation } from "react-i18next";

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

const UserCard = ({ user, onRemove }) => {
  const { t } = useTranslation();
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("conditions");
  const [healthData, setHealthData] = useState({
    conditions: [],
    medications: [],
    reports: [],
  });
  const [loading, setLoading] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showReportUploadModal, setShowReportUploadModal] = useState(false);
  const [showInlineConditionForm, setShowInlineConditionForm] = useState(false);
  const [showInlineMedicationForm, setShowInlineMedicationForm] =
    useState(false);
  const [inlineConditionData, setInlineConditionData] = useState({
    conditionName: "",
    severityLevel: "mild",
  });
  const [inlineMedicationData, setInlineMedicationData] = useState({
    medicationName: "",
    dosage: "",
    frequency: "once-daily",
    duration: "",
    times: [""],
    notificationType: "me",
  });
  const [reportFiles, setReportFiles] = useState([]);
  const [reportUploading, setReportUploading] = useState(false);
  const [reportUploadError, setReportUploadError] = useState("");
  const [conditionError, setConditionError] = useState("");
  const [medicationError, setMedicationError] = useState("");
  const [reportFormData, setReportFormData] = useState({
    category: "Other",
    reportDate: "",
    notes: "",
  });
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    isDangerous: false,
    confirmText: "Confirm",
    onConfirm: null,
  });

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const [conditionsRes, medicationsRes, reportsRes] = await Promise.all([
        api.get(`/api/family/member/${user._id}/conditions`),
        api.get(`/api/family/member/${user._id}/medications`),
        api.get(`/api/family/member/${user._id}/reports`),
      ]);

      setHealthData({
        conditions: conditionsRes.data.conditions || [],
        medications: medicationsRes.data.medications || [],
        reports: reportsRes.data.reports || [],
      });
      setConditionError("");
      setMedicationError("");
    } catch (err) {
      console.error("Failed to fetch health data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch health data on component mount
  useEffect(() => {
    fetchHealthData();
  }, [user._id]);

  const handleViewDetails = () => {
    setShowHealthModal(true);
  };

  const handleAddCondition = async (data) => {
    try {
      const payload = {
        targetUserId: user._id,
        conditionName: data.conditionName,
        severityLevel: data.severityLevel,
      };
      await api.post(
        "/api/health/chronic-conditions-for-user",
        payload,
      );
      setShowConditionModal(false);
      fetchHealthData();
    } catch (err) {
      setConditionError(
        err.response?.data?.message || t('userCard.failedAddCond'),
      );
    }
  };

  const handleAddMedication = async (data) => {
    try {
      const payload = {
        targetUserId: user._id,
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: parseInt(data.duration) || 0,
        times: Array.isArray(data.times) ? data.times : [data.times],
        notificationType: data.notificationType,
      };
      await api.post("/api/health/medications-for-user", payload);
      fetchHealthData();
    } catch (err) {
      setMedicationError(
        err.response?.data?.message || t('userCard.failedAddMed'),
      );
    }
  };

  const handleReportFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    const invalidFiles = [];
    const validFiles = [];

    selectedFiles.forEach((file) => {
      if (!allowed.includes(file.type)) {
        invalidFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setReportUploadError(
        `${t('userCard.invalidFiles', { names: invalidFiles.join(", ") })}`,
      );
    } else {
      setReportUploadError("");
    }

    if (validFiles.length + reportFiles.length > 10) {
      setReportUploadError(t('userCard.maxFiles'));
      return;
    }

    setReportFiles((prev) => [...prev, ...validFiles]);
  };

  const handleUploadReports = async () => {
    if (reportFiles.length === 0) {
      setReportUploadError(t('userCard.selectFirst'));
      return;
    }

    try {
      setReportUploading(true);
      setReportUploadError("");

      const formData = new FormData();
      reportFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("category", reportFormData.category);
      formData.append("reportDate", reportFormData.reportDate);
      formData.append("notes", reportFormData.notes);
      formData.append("targetUserId", user._id);

      await api.post("/api/medical-report/for-user", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setReportFiles([]);
      setReportFormData({ category: "Other", reportDate: "", notes: "" });
      setShowReportUploadModal(false);
      fetchHealthData();
    } catch (err) {
      setReportUploadError(
        err.response?.data?.message || t('userCard.failedUpload'),
      );
    } finally {
      setReportUploading(false);
    }
  };

  // Handle inline condition form submission
  const handleInlineAddCondition = async () => {
    if (!inlineConditionData.conditionName.trim()) {
      setConditionError(t('userCard.conditionRequired'));
      return;
    }
    try {
      await handleAddCondition(inlineConditionData);
      setInlineConditionData({ conditionName: "", severityLevel: "mild" });
      setShowInlineConditionForm(false);
      setConditionError("");
    } catch (err) {
      setConditionError(err.message || t('userCard.failedAddCond'));
    }
  };

  // Handle inline medication form submission
  const handleInlineAddMedication = async () => {
    if (
      !inlineMedicationData.medicationName.trim() ||
      !inlineMedicationData.dosage.trim() ||
      !inlineMedicationData.frequency.trim() ||
      !inlineMedicationData.duration
    ) {
      setMedicationError(t('userCard.allFieldsRequired'));
      return;
    }

    const hasCustomTimes = (inlineMedicationData.times || []).some(
      (time) => typeof time === "string" && time.trim(),
    );
    if (inlineMedicationData.frequency === "as-needed" && !hasCustomTimes) {
      setMedicationError("For custom schedule, please specify at least one reminder time");
      return;
    }

    try {
      await handleAddMedication(inlineMedicationData);
      setInlineMedicationData({
        medicationName: "",
        dosage: "",
        frequency: "once-daily",
        duration: "",
        times: [""],
        notificationType: "me",
      });
      setShowInlineMedicationForm(false);
      setMedicationError("");
    } catch (err) {
      setMedicationError(err.message || t('userCard.failedAddMed'));
    }
  };

  // Check if current user can edit this family member's data
  const canEdit = !user.private;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0.0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-200 w-full sm:max-w-[320px]"
      >
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-full text-white font-extrabold"
              style={{
                height: 56,
                width: 56,
                background:
                  "linear-gradient(135deg, rgb(211,46,149), rgb(236,72,153))",
                fontSize: 18,
              }}
            >
              {initials(user.username)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-gray-900 text-lg font-semibold truncate">
                  {user.username}
                </h3>
                {onRemove && (
                  <button
                    onClick={() =>
                      setConfirmation({
                        isOpen: true,
                        title: t('userCard.removeMember'),
                        message: t('userCard.removeMessage'),
                        isDangerous: true,
                        confirmText: t('userCard.removeBtn'),
                        onConfirm: () => {
                          onRemove();
                          setConfirmation((prev) => ({ ...prev, isOpen: false }));
                        },
                      })
                    }
                    className="ml-2 inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                    title={t('userCard.removeMemberTitle')}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-600 truncate">
                {user.email}
              </p>
              {user.phone && (
                <p className="mt-0.5 text-xs text-gray-500 truncate">
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Show Details Button */}
          <button
            onClick={handleViewDetails}
            className="mt-4 w-full py-2.5 rounded-lg font-semibold text-sm bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/80 text-white transition-all"
          >
            {t('userCard.showDetails', { defaultValue: 'Show Details' })}
          </button>
        </div>
      </motion.div>

      {/* Health Details Modal */}
      <AnimatePresence>
        {showHealthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowHealthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl bg-white my-auto"
              style={{
                maxHeight: "90vh",
              }}
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                      {user.username}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{t('userCard.healthDetails')}</p>
                  </div>
                  <button
                    onClick={() => setShowHealthModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 sm:mt-6 border-b border-gray-200 sm:items-center sm:justify-between">
                  <div className="flex gap-2 sm:gap-4 overflow-x-auto">
                    <button
                      onClick={() => setActiveTab("conditions")}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === "conditions"
                          ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t('userCard.conditionsTab')}
                    </button>
                    <button
                      onClick={() => setActiveTab("medications")}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === "medications"
                          ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t('userCard.medicationsTab')}
                    </button>
                    <button
                      onClick={() => setActiveTab("reports")}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === "reports"
                          ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t('userCard.reportsTab')}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && activeTab === "conditions" && (
                      <button
                        onClick={() => setShowInlineConditionForm(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(211,46,149)] text-white hover:bg-[rgb(211,46,149)]/80 transition-all"
                      >
                        {t('userCard.addConditionBtn')}
                      </button>
                    )}
                    {canEdit && activeTab === "medications" && (
                      <button
                        onClick={() => setShowInlineMedicationForm(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(211,46,149)] text-white hover:bg-[rgb(211,46,149)]/80 transition-all"
                      >
                        {t('userCard.addMedicationBtn')}
                      </button>
                    )}
                    {canEdit && activeTab === "reports" && (
                      <button
                        onClick={() => setShowReportUploadModal(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(211,46,149)] text-white hover:bg-[rgb(211,46,149)]/80 transition-all"
                      >
                        {t('userCard.addReportBtn')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div
                className="p-6 overflow-y-auto bg-white"
                style={{ maxHeight: "60vh" }}
              >
                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    {t('userCard.loading')}
                  </div>
                ) : (
                  <>
                    {/* Conditions Tab */}
                    {activeTab === "conditions" && (
                      <div className="space-y-4">
                        {/* Inline Add Condition Form */}
                        {showInlineConditionForm && canEdit && (
                          <div className="p-6 rounded-2xl bg-white border-2 border-gray-200">
                            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                              {t('userCard.addChronicCond')}
                            </h3>
                            {conditionError && (
                              <div className="mb-4 p-3 rounded-lg bg-red-100 border-2 border-red-300 text-red-700 text-sm font-semibold">
                                {conditionError}
                              </div>
                            )}
                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  {t('userCard.conditionLabel')}
                                </label>
                                <input
                                  type="text"
                                  value={inlineConditionData.conditionName}
                                  onChange={(e) =>
                                    setInlineConditionData((prev) => ({
                                      ...prev,
                                      conditionName: e.target.value,
                                    }))
                                  }
                                  placeholder={t('userCard.conditionPlaceholder')}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900 placeholder-gray-400"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  {t('userCard.severityLabel')}
                                </label>
                                <select
                                  value={inlineConditionData.severityLevel}
                                  onChange={(e) =>
                                    setInlineConditionData((prev) => ({
                                      ...prev,
                                      severityLevel: e.target.value,
                                    }))
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900 bg-white"
                                >
                                  <option value="mild">{t('userCard.mild')}</option>
                                  <option value="moderate">{t('userCard.moderate')}</option>
                                  <option value="severe">{t('userCard.severe')}</option>
                                </select>
                              </div>
                              <div className="flex gap-3 pt-3">
                                <button
                                  onClick={handleInlineAddCondition}
                                  className="flex-1 py-3 px-4 bg-[rgb(211,46,149)] hover:bg-[rgb(190,35,130)] text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 transition-all"
                                >
                                  {t('userCard.addConditionSubmit')}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowInlineConditionForm(false);
                                    setConditionError("");
                                    setInlineConditionData({
                                      conditionName: "",
                                      severityLevel: "mild",
                                    });
                                  }}
                                  className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                  {t('cancel')}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {healthData.conditions.length === 0 &&
                        !showInlineConditionForm ? (
                          <div className="text-center py-12 text-gray-500">
                            {t('userCard.noConditions')}
                          </div>
                        ) : (
                          healthData.conditions.map((condition) => (
                            <div
                              key={condition._id}
                              className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {condition.conditionName}
                                </h3>
                                <div className="mt-2 flex items-center gap-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      condition.severityLevel === "severe"
                                        ? "bg-red-200 text-red-800"
                                        : condition.severityLevel === "moderate"
                                          ? "bg-orange-200 text-orange-800"
                                          : "bg-yellow-200 text-yellow-800"
                                    }`}
                                  >
                                    {condition.severityLevel}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {t('userCard.diagnosed')}{" "}
                                    {new Date(
                                      condition.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setConfirmation({
                                      isOpen: true,
                                      title: t('userCard.deleteCondModal'),
                                      message: t('userCard.deleteCondMsg'),
                                      isDangerous: true,
                                      confirmText: t('delete'),
                                      onConfirm: async () => {
                                        try {
                                          await api.delete(
                                            `/api/health/chronic-conditions-for-user/${user._id}/${condition._id}`,
                                          );
                                          fetchHealthData();
                                        } catch (err) {
                                          console.error(
                                            "Failed to delete condition:",
                                            err,
                                          );
                                          setConditionError(
                                            err.response?.data?.message ||
                                              t('userCard.failedDelCond'),
                                          );
                                        } finally {
                                          setConfirmation((prev) => ({
                                            ...prev,
                                            isOpen: false,
                                          }));
                                        }
                                      },
                                    });
                                  }}
                                  className="ml-2 px-3 py-1.5 rounded-lg font-semibold text-sm bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 shrink-0"
                                  title={t('userCard.deleteCondTitle')}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Medications Tab */}
                    {activeTab === "medications" && (
                      <div className="space-y-4">
                        {/* Inline Add Medication Form */}
                        {showInlineMedicationForm && canEdit && (
                          <div className="p-6 rounded-2xl bg-white border-2 border-gray-200">
                            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                              {t('userCard.addMedicationTitle')}
                            </h3>
                            {medicationError && (
                              <div className="mb-4 p-3 rounded-lg bg-red-100 border-2 border-red-300 text-red-700 text-sm font-semibold">
                                {medicationError}
                              </div>
                            )}
                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  {t('userCard.nameLabel')}
                                </label>
                                <input
                                  type="text"
                                  value={inlineMedicationData.medicationName}
                                  onChange={(e) =>
                                    setInlineMedicationData((prev) => ({
                                      ...prev,
                                      medicationName: e.target.value,
                                    }))
                                  }
                                  placeholder={t('userCard.namePlaceholder')}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900 placeholder-gray-400"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('userCard.dosageLabel')}
                                  </label>
                                  <input
                                    type="text"
                                    value={inlineMedicationData.dosage}
                                    onChange={(e) =>
                                      setInlineMedicationData((prev) => ({
                                        ...prev,
                                        dosage: e.target.value,
                                      }))
                                    }
                                    placeholder={t('userCard.dosagePlaceholder')}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900 placeholder-gray-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('userCard.frequencyLabel')}
                                  </label>
                                  <select
                                    value={inlineMedicationData.frequency}
                                    onChange={(e) => {
                                      const newFreq = e.target.value;
                                      let count = 1;
                                      if (newFreq === "twice-daily") count = 2;
                                      else if (newFreq === "three-times-daily")
                                        count = 3;
                                      const newTimes =
                                        Array(count).fill("");
                                      setInlineMedicationData((prev) => ({
                                        ...prev,
                                        frequency: newFreq,
                                        times: newTimes,
                                      }));
                                    }}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900 bg-white"
                                  >
                                    <option value="once-daily">
                                      {t('userCard.onceDaily')}
                                    </option>
                                    <option value="twice-daily">
                                      {t('userCard.twiceDaily')}
                                    </option>
                                    <option value="three-times-daily">
                                      {t('userCard.threeTimesDaily')}
                                    </option>
                                    <option value="as-needed">As Needed</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  {t('userCard.durationLabel')}
                                </label>
                                <input
                                  type="number"
                                  value={inlineMedicationData.duration}
                                  onChange={(e) =>
                                    setInlineMedicationData((prev) => ({
                                      ...prev,
                                      duration: e.target.value,
                                    }))
                                  }
                                  placeholder={t('userCard.durationPlaceholder')}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900 placeholder-gray-400"
                                />
                              </div>
                              {inlineMedicationData.times &&
                                inlineMedicationData.times.length > 0 && (
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      {t('userCard.reminderTimes')}
                                    </label>
                                    <div className="grid gap-3">
                                      {inlineMedicationData.times.map(
                                        (time, idx) => (
                                          <input
                                            key={idx}
                                            type="time"
                                            value={time}
                                            onChange={(e) => {
                                              const newTimes = [
                                                ...inlineMedicationData.times,
                                              ];
                                              newTimes[idx] = e.target.value;
                                              setInlineMedicationData(
                                                (prev) => ({
                                                  ...prev,
                                                  times: newTimes,
                                                }),
                                              );
                                            }}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900"
                                          />
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  {t('userCard.receiverLabel')}
                                </label>
                                <select
                                  value={inlineMedicationData.notificationType}
                                  onChange={(e) =>
                                    setInlineMedicationData((prev) => ({
                                      ...prev,
                                      notificationType: e.target.value,
                                    }))
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[rgb(211,46,149)] focus:border-[rgb(211,46,149)] transition-all outline-none text-gray-900 bg-white"
                                >
                                  <option value="me">{t('userCard.onlyMe')}</option>
                                  <option value="family">{t('userCard.meAndFamily')}</option>
                                </select>
                              </div>
                              <div className="flex gap-3 pt-3">
                                <button
                                  onClick={handleInlineAddMedication}
                                  className="flex-1 py-3 px-4 bg-[rgb(211,46,149)] hover:bg-[rgb(190,35,130)] text-white font-semibold rounded-xl shadow-lg shadow-pink-500/25 transition-all"
                                >
                                  {t('userCard.addMedicationSubmit')}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowInlineMedicationForm(false);
                                    setMedicationError("");
                                    setInlineMedicationData({
                                      medicationName: "",
                                      dosage: "",
                                      frequency: "once-daily",
                                      duration: "",
                                      times: [""],
                                      notificationType: "me",
                                    });
                                  }}
                                  className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                  {t('cancel')}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {healthData.medications.length === 0 &&
                        !showInlineMedicationForm ? (
                          <div className="text-center py-12 text-gray-500">
                            {t('userCard.noMedications')}
                          </div>
                        ) : (
                          healthData.medications.map((medication) => (
                            <div
                              key={medication._id}
                              className="p-4 rounded-xl bg-pink-50 border border-pink-200 flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {medication.medicationName}
                                </h3>
                                <div className="mt-2 space-y-1 text-sm">
                                  <p className="text-gray-700">
                                    <span className="text-gray-600">
                                      {t('userCard.dosageInfo')}
                                    </span>{" "}
                                    {medication.dosage}
                                  </p>
                                  <p className="text-gray-700">
                                    <span className="text-gray-600">
                                      {t('userCard.frequencyInfo')}
                                    </span>{" "}
                                    {medication.frequency}
                                  </p>
                                  <p className="text-gray-700">
                                    <span className="text-gray-600">
                                      {t('userCard.durationInfo')}
                                    </span>{" "}
                                    {medication.duration} {t('userCard.days')}
                                  </p>
                                  {medication.times &&
                                    medication.times.length > 0 && (
                                      <p className="text-gray-700">
                                        <span className="text-gray-600">
                                          {t('userCard.timesInfo')}
                                        </span>{" "}
                                        {medication.times
                                          .map((time) => {
                                            const [hours, minutes] = time
                                              .split(":")
                                              .map(Number);
                                            const period =
                                              hours >= 12 ? "PM" : "AM";
                                            const displayHours =
                                              hours % 12 || 12;
                                            return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
                                          })
                                          .join(", ")}
                                      </p>
                                    )}
                                </div>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setConfirmation({
                                      isOpen: true,
                                      title: t('userCard.deleteMedModal'),
                                      message: t('userCard.deleteMedMsg'),
                                      isDangerous: true,
                                      confirmText: t('delete'),
                                      onConfirm: async () => {
                                        try {
                                          await api.delete(
                                            `/api/health/medications-for-user/${user._id}/${medication._id}`,
                                          );
                                          fetchHealthData();
                                        } catch (err) {
                                          console.error(
                                            "Failed to delete medication:",
                                            err,
                                          );
                                          setMedicationError(
                                            err.response?.data?.message ||
                                              t('userCard.failedDelMed'),
                                          );
                                        } finally {
                                          setConfirmation((prev) => ({
                                            ...prev,
                                            isOpen: false,
                                          }));
                                        }
                                      },
                                    });
                                  }}
                                  className="ml-2 px-3 py-1.5 rounded-lg font-semibold text-sm bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-300 shrink-0"
                                  title={t('userCard.deleteMedTitle')}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Reports Tab */}
                    {activeTab === "reports" && (
                      <div className="space-y-3">
                        {healthData.reports.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            {t('userCard.noReports')}
                          </div>
                        ) : (
                          healthData.reports.map((report) => (
                            <div
                              key={report._id}
                              className="p-4 rounded-xl flex items-center justify-between bg-blue-50 border border-blue-200"
                            >
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {report.category || t('userCard.medicalReport')}
                                </h3>
                                <div className="mt-1 space-y-1 text-sm">
                                  <p className="text-gray-600">
                                    {t('userCard.reportDate')}{" "}
                                    {report.reportDate
                                      ? new Date(
                                          report.reportDate,
                                        ).toLocaleDateString()
                                      : new Date(
                                          report.createdAt,
                                        ).toLocaleDateString()}
                                  </p>
                                  {report.notes && (
                                    <p className="text-gray-700">
                                      {t('userCard.notesLabel')} {report.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={report.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/80 text-white"
                                >
                                  {t('userCard.viewBtn')}
                                </a>
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await api.get(
                                        `/api/medical-report/${report._id}/download`,
                                        { responseType: "blob" }
                                      );
                                      const url = window.URL.createObjectURL(new Blob([response.data]));
                                      const link = document.createElement("a");
                                      link.href = url;
                                      const contentDisposition = response.headers["content-disposition"];
                                      let filename = `report-${Date.now()}`;
                                      if (contentDisposition) {
                                        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
                                        if (filenameMatch) filename = filenameMatch[1];
                                      }
                                      link.setAttribute("download", filename);
                                      document.body.appendChild(link);
                                      link.click();
                                      link.parentNode.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                      console.error("Download failed:", err);
                                      setReportUploadError(t('userCard.failedDownload'));
                                    }
                                  }}
                                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                                  title="Download report"
                                >
                                  ⬇️
                                </button>
                                {canEdit && (
                                <button
                                  onClick={() => {
                                    setConfirmation({
                                      isOpen: true,
                                      title: t('userCard.deleteReportModal'),
                                      message: t('userCard.deleteReportMsg'),
                                      isDangerous: true,
                                      confirmText: t('delete'),
                                      onConfirm: async () => {
                                        try {
                                          await api.delete(
                                            `/api/medical-report/for-user/${user._id}/${report._id}`,
                                          );
                                          fetchHealthData();
                                        } catch (err) {
                                          console.error(
                                            "Failed to delete report:",
                                            err,
                                          );
                                          setReportUploadError(
                                            err.response?.data?.message ||
                                              t('userCard.failedDelReport'),
                                          );
                                        } finally {
                                          setConfirmation((prev) => ({
                                            ...prev,
                                            isOpen: false,
                                          }));
                                        }
                                      },
                                    });
                                  }}
                                  className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"
                                  title={t('userCard.deleteReportTitle')}
                                >
                                  🗑️
                                </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Condition Modal */}
      <AnimatePresence>
        {showConditionModal && (
          <AddConditionModal
            onClose={() => setShowConditionModal(false)}
            onSubmit={handleAddCondition}
            error={conditionError}
          />
        )}
      </AnimatePresence>

      {/* Add Medication Modal */}
      <AnimatePresence>
        {showMedicationModal && (
          <AddMedicationModal
            onClose={() => setShowMedicationModal(false)}
            onSubmit={handleAddMedication}
            error={medicationError}
          />
        )}
      </AnimatePresence>

      {/* Upload Medical Report Modal */}
      <AnimatePresence>
        {showReportUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowReportUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('userCard.uploadReportTitle')}
                  </h2>
                  <button
                    onClick={() => setShowReportUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {reportUploadError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {reportUploadError}
                  </div>
                )}

                {/* File Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('userCard.selectFiles')}
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleReportFileChange}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  {reportFiles.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {reportFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          <button
                            onClick={() =>
                              setReportFiles((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                          >
                            {t('userCard.removeFile')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('userCard.categoryLabel')}
                  </label>
                  <select
                    value={reportFormData.category}
                    onChange={(e) =>
                      setReportFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Other">{t('userCard.other')}</option>
                    <option value="Lab Report">{t('userCard.labReport')}</option>
                    <option value="X-Ray">{t('userCard.xray')}</option>
                    <option value="Prescription">{t('userCard.prescription')}</option>
                    <option value="Doctor Notes">{t('userCard.doctorNotes')}</option>
                  </select>
                </div>

                {/* Report Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('userCard.reportDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={reportFormData.reportDate}
                    onChange={(e) =>
                      setReportFormData((prev) => ({
                        ...prev,
                        reportDate: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('userCard.notesInput')}
                  </label>
                  <textarea
                    value={reportFormData.notes}
                    onChange={(e) =>
                      setReportFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder={t('userCard.notesPlaceholder')}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    rows="3"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => setShowReportUploadModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
                >
                  {t('userCard.cancelBtn')}
                </button>
                <button
                  onClick={handleUploadReports}
                  disabled={reportUploading || reportFiles.length === 0}
                  className="px-4 py-2 rounded-lg bg-[rgb(211,46,149)] text-white font-semibold hover:bg-[rgb(211,46,149)]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reportUploading ? t('userCard.uploading') : t('userCard.uploadReports')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        isDangerous={confirmation.isDangerous}
        onConfirm={confirmation.onConfirm}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
      />
    </>
  );
};

export default UserCard;
