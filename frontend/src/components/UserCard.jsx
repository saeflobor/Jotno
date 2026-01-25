// src/components/UserCard.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import AddConditionModal from "./AddConditionModal";
import AddMedicationModal from "./AddMedicationModal";

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => (n ? n[0] : ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const UserCard = ({ user, onRemove }) => {
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
    times: ["08:00"],
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

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const [conditionsRes, medicationsRes, reportsRes] = await Promise.all([
        axiosInstance.get(`/api/family/member/${user._id}/conditions`),
        axiosInstance.get(`/api/family/member/${user._id}/medications`),
        axiosInstance.get(`/api/family/member/${user._id}/reports`),
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
      await axiosInstance.post(
        "/api/health/chronic-conditions-for-user",
        payload,
      );
      setShowConditionModal(false);
      fetchHealthData();
    } catch (err) {
      setConditionError(
        err.response?.data?.message || "Failed to add condition",
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
      await axiosInstance.post("/api/health/medications-for-user", payload);
      fetchHealthData();
    } catch (err) {
      setMedicationError(
        err.response?.data?.message || "Failed to add medication",
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
        `Invalid files: ${invalidFiles.join(", ")}. Only PNG, JPG or PDF files are allowed.`,
      );
    } else {
      setReportUploadError("");
    }

    if (validFiles.length + reportFiles.length > 10) {
      setReportUploadError("Maximum 10 files allowed per upload");
      return;
    }

    setReportFiles((prev) => [...prev, ...validFiles]);
  };

  const handleUploadReports = async () => {
    if (reportFiles.length === 0) {
      setReportUploadError("Please select at least one file first");
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

      await axiosInstance.post("/api/medical-report/for-user", formData, {
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
        err.response?.data?.message || "Failed to upload reports",
      );
    } finally {
      setReportUploading(false);
    }
  };

  // Handle inline condition form submission
  const handleInlineAddCondition = async () => {
    if (!inlineConditionData.conditionName.trim()) {
      setConditionError("Condition name is required");
      return;
    }
    try {
      await handleAddCondition(inlineConditionData);
      setInlineConditionData({ conditionName: "", severityLevel: "mild" });
      setShowInlineConditionForm(false);
      setConditionError("");
    } catch (err) {
      setConditionError(err.message || "Failed to add condition");
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
      setMedicationError("All fields are required");
      return;
    }
    try {
      await handleAddMedication(inlineMedicationData);
      setInlineMedicationData({
        medicationName: "",
        dosage: "",
        frequency: "once-daily",
        duration: "",
        times: ["08:00"],
        notificationType: "me",
      });
      setShowInlineMedicationForm(false);
      setMedicationError("");
    } catch (err) {
      setMedicationError(err.message || "Failed to add medication");
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
        className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-200"
        style={{
          minWidth: 260,
          maxWidth: 320,
        }}
      >
        {/* Pink gradient top bar */}
        <div
          style={{
            height: 6,
            background:
              "linear-gradient(90deg, rgb(211,46,149), rgb(236,72,153))",
          }}
        />

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
                      window.confirm("Remove this member?") && onRemove()
                    }
                    className="ml-2 inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-600 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600">Role</div>
              <div className="mt-1 font-medium text-gray-900">{user.role}</div>
            </div>

            <div className="py-2 px-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600">Gender</div>
              <div className="mt-1 font-medium text-gray-900">
                {user.gender}
              </div>
            </div>
          </div>

          {/* Health Info Pills */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-50 border border-red-200">
              <span className="text-red-600">❤️</span>
              <span className="text-xs text-red-700 font-medium">
                Chronic Conditions
              </span>
              <span className="ml-auto text-xs font-bold text-red-700 bg-red-200 px-2 py-0.5 rounded-full">
                {healthData.conditions.length}
              </span>
            </div>

            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-purple-50 border border-purple-200">
              <span className="text-purple-600">💊</span>
              <span className="text-xs text-purple-700 font-medium">
                Medications
              </span>
              <span className="ml-auto text-xs font-bold text-purple-700 bg-purple-200 px-2 py-0.5 rounded-full">
                {healthData.medications.length}
              </span>
            </div>

            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-blue-600">📄</span>
              <span className="text-xs text-blue-700 font-medium">
                Medical Reports
              </span>
              <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                {healthData.reports.length}
              </span>
            </div>

            {!canEdit && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-700">
                  🔒 Member has privacy enabled
                </p>
              </div>
            )}
          </div>

          {/* View All Details Button */}
          <button
            onClick={handleViewDetails}
            className="mt-4 w-full py-2.5 rounded-lg font-semibold text-sm bg-[rgb(211,46,149)] hover:bg-[rgb(211,46,149)]/80 text-white transition-all"
          >
            View All Details →
          </button>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="text-xs text-gray-500">Member since</div>
            <div className="text-xs text-gray-700 font-medium">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Health Details Modal */}
      <AnimatePresence>
        {showHealthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowHealthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl bg-white"
              style={{
                maxHeight: "90vh",
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.username}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Health Details</p>
                  </div>
                  <button
                    onClick={() => setShowHealthModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-6 border-b border-gray-200 items-center justify-between">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab("conditions")}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === "conditions"
                          ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      ❤️ Conditions
                    </button>
                    <button
                      onClick={() => setActiveTab("medications")}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === "medications"
                          ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      💊 Medications
                    </button>
                    <button
                      onClick={() => setActiveTab("reports")}
                      className={`pb-3 px-1 text-sm font-semibold transition-all ${
                        activeTab === "reports"
                          ? "text-[rgb(211,46,149)] border-b-2 border-[rgb(211,46,149)]"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      📄 Reports
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {canEdit && activeTab === "conditions" && (
                      <button
                        onClick={() => setShowInlineConditionForm(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(211,46,149)] text-white hover:bg-[rgb(211,46,149)]/80 transition-all"
                      >
                        + Add Condition
                      </button>
                    )}
                    {canEdit && activeTab === "medications" && (
                      <button
                        onClick={() => setShowInlineMedicationForm(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(211,46,149)] text-white hover:bg-[rgb(211,46,149)]/80 transition-all"
                      >
                        + Add Medication
                      </button>
                    )}
                    {canEdit && activeTab === "reports" && (
                      <button
                        onClick={() => setShowReportUploadModal(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgb(211,46,149)] text-white hover:bg-[rgb(211,46,149)]/80 transition-all"
                      >
                        + Add Report
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
                    Loading...
                  </div>
                ) : (
                  <>
                    {/* Conditions Tab */}
                    {activeTab === "conditions" && (
                      <div className="space-y-4">
                        {/* Inline Add Condition Form */}
                        {showInlineConditionForm && canEdit && (
                          <div className="p-6 rounded-2xl bg-white border-2 border-gray-200">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                              Add Chronic Condition
                            </h3>
                            {conditionError && (
                              <div className="mb-4 p-3 rounded-lg bg-red-100 border-2 border-red-300 text-red-700 text-sm font-semibold">
                                {conditionError}
                              </div>
                            )}
                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Condition Name
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
                                  placeholder="e.g., Diabetes, Hypertension"
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Severity Level
                                </label>
                                <select
                                  value={inlineConditionData.severityLevel}
                                  onChange={(e) =>
                                    setInlineConditionData((prev) => ({
                                      ...prev,
                                      severityLevel: e.target.value,
                                    }))
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-gray-900 bg-white"
                                >
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="severe">Severe</option>
                                </select>
                              </div>
                              <div className="flex gap-3 pt-3">
                                <button
                                  onClick={handleInlineAddCondition}
                                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 transition-all"
                                >
                                  Add Condition
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
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {healthData.conditions.length === 0 &&
                        !showInlineConditionForm ? (
                          <div className="text-center py-12 text-gray-500">
                            No chronic conditions
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
                                    Diagnosed:{" "}
                                    {new Date(
                                      condition.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Are you sure you want to delete this condition?",
                                      )
                                    ) {
                                      try {
                                        await axiosInstance.delete(
                                          `/api/health/chronic-conditions-for-user/${user._id}/${condition._id}`,
                                        );
                                        fetchHealthData();
                                      } catch (err) {
                                        console.error(
                                          "Failed to delete condition:",
                                          err,
                                        );
                                        alert(
                                          err.response?.data?.message ||
                                            "Failed to delete condition",
                                        );
                                      }
                                    }
                                  }}
                                  className="ml-2 px-3 py-1.5 rounded-lg font-semibold text-sm bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 shrink-0"
                                  title="Delete condition"
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
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">
                              Add Medication
                            </h3>
                            {medicationError && (
                              <div className="mb-4 p-3 rounded-lg bg-red-100 border-2 border-red-300 text-red-700 text-sm font-semibold">
                                {medicationError}
                              </div>
                            )}
                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Medication Name
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
                                  placeholder="e.g., Metformin, Lisinopril"
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Dosage
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
                                    placeholder="e.g., 500mg, 10ml"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Frequency
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
                                        Array(count).fill("08:00");
                                      setInlineMedicationData((prev) => ({
                                        ...prev,
                                        frequency: newFreq,
                                        times: newTimes,
                                      }));
                                    }}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 bg-white"
                                  >
                                    <option value="once-daily">
                                      Once Daily
                                    </option>
                                    <option value="twice-daily">
                                      Twice Daily
                                    </option>
                                    <option value="three-times-daily">
                                      Three Times Daily
                                    </option>
                                    <option value="as-needed">As Needed</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Duration (Days)
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
                                  placeholder="e.g., 30"
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                                />
                              </div>
                              {inlineMedicationData.times &&
                                inlineMedicationData.times.length > 0 && (
                                  <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                      Reminder Times
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
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900"
                                          />
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Notification Receiver
                                </label>
                                <select
                                  value={inlineMedicationData.notificationType}
                                  onChange={(e) =>
                                    setInlineMedicationData((prev) => ({
                                      ...prev,
                                      notificationType: e.target.value,
                                    }))
                                  }
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none text-gray-900 bg-white"
                                >
                                  <option value="me">Only Me</option>
                                  <option value="family">Me & My Family</option>
                                </select>
                              </div>
                              <div className="flex gap-3 pt-3">
                                <button
                                  onClick={handleInlineAddMedication}
                                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all"
                                >
                                  Add Medication
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
                                      times: ["08:00"],
                                      notificationType: "me",
                                    });
                                  }}
                                  className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {healthData.medications.length === 0 &&
                        !showInlineMedicationForm ? (
                          <div className="text-center py-12 text-gray-500">
                            No medications
                          </div>
                        ) : (
                          healthData.medications.map((medication) => (
                            <div
                              key={medication._id}
                              className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start justify-between"
                            >
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {medication.medicationName}
                                </h3>
                                <div className="mt-2 space-y-1 text-sm">
                                  <p className="text-gray-700">
                                    <span className="text-gray-600">
                                      Dosage:
                                    </span>{" "}
                                    {medication.dosage}
                                  </p>
                                  <p className="text-gray-700">
                                    <span className="text-gray-600">
                                      Frequency:
                                    </span>{" "}
                                    {medication.frequency}
                                  </p>
                                  <p className="text-gray-700">
                                    <span className="text-gray-600">
                                      Duration:
                                    </span>{" "}
                                    {medication.duration} days
                                  </p>
                                  {medication.times &&
                                    medication.times.length > 0 && (
                                      <p className="text-gray-700">
                                        <span className="text-gray-600">
                                          Times:
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
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        "Are you sure you want to delete this medication?",
                                      )
                                    ) {
                                      try {
                                        await axiosInstance.delete(
                                          `/api/health/medications-for-user/${user._id}/${medication._id}`,
                                        );
                                        fetchHealthData();
                                      } catch (err) {
                                        console.error(
                                          "Failed to delete medication:",
                                          err,
                                        );
                                        alert(
                                          err.response?.data?.message ||
                                            "Failed to delete medication",
                                        );
                                      }
                                    }
                                  }}
                                  className="ml-2 px-3 py-1.5 rounded-lg font-semibold text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 shrink-0"
                                  title="Delete medication"
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
                            No medical reports
                          </div>
                        ) : (
                          healthData.reports.map((report) => (
                            <div
                              key={report._id}
                              className="p-4 rounded-xl flex items-center justify-between bg-blue-50 border border-blue-200"
                            >
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {report.category || "Medical Report"}
                                </h3>
                                <div className="mt-1 space-y-1 text-sm">
                                  <p className="text-gray-600">
                                    Report Date:{" "}
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
                                      Notes: {report.notes}
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
                                  View 📄
                                </a>
                                {canEdit && (
                                  <button
                                    onClick={async () => {
                                      if (
                                        window.confirm(
                                          "Are you sure you want to delete this report?",
                                        )
                                      ) {
                                        try {
                                          await axiosInstance.delete(
                                            `/api/medical-report/for-user/${user._id}/${report._id}`,
                                          );
                                          fetchHealthData();
                                        } catch (err) {
                                          console.error(
                                            "Failed to delete report:",
                                            err,
                                          );
                                          alert(
                                            err.response?.data?.message ||
                                              "Failed to delete report",
                                          );
                                        }
                                      }
                                    }}
                                    className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"
                                    title="Delete report"
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
                    Upload Medical Report
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
                    Select Files (PNG, JPG, PDF)
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
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
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
                    <option value="Other">Other</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Doctor Notes">Doctor Notes</option>
                  </select>
                </div>

                {/* Report Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Report Date
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
                    Notes
                  </label>
                  <textarea
                    value={reportFormData.notes}
                    onChange={(e) =>
                      setReportFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add any additional notes..."
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
                  Cancel
                </button>
                <button
                  onClick={handleUploadReports}
                  disabled={reportUploading || reportFiles.length === 0}
                  className="px-4 py-2 rounded-lg bg-[rgb(211,46,149)] text-white font-semibold hover:bg-[rgb(211,46,149)]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reportUploading ? "Uploading..." : "Upload Reports"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserCard;
